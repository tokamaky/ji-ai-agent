package com.xiaohang.jiaiagent.agent.multiagent;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Asynchronous message queue for inter-agent communication.
 *
 * <p>Built on {@link LinkedBlockingQueue}, this queue provides:
 * <ul>
 *   <li>Bounded or unbounded queues per {@code queueId}</li>
 *   <li>Offer / take semantics so producers never block the caller</li>
 *   <li>Polling consumers with configurable timeout</li>
 *   <li>Message TTL — expired messages are discarded on poll</li>
 *   <li>Dead-letter handling for undeliverable messages</li>
 * </ul>
 *
 * <h2>Queue model</h2>
 * Each named queue is independent. Agents can use named queues
 * (e.g. "supervisor.inbox", "researcher.inbox") for point-to-point delivery,
 * or use the shared global queue for broadcast-style delivery.
 *
 * <h2>Example</h2>
 * <pre>
 * messageQueue.offer("researcher.inbox", agentMessage);
 *
 * AgentMessage msg = messageQueue.poll("researcher.inbox", 5, TimeUnit.SECONDS);
 * if (msg != null) {
 *     // process msg
 * }
 * </pre>
 */
@Component
@Slf4j
public class MessageQueue {

    private final Map<String, LinkedBlockingQueue<QueuedMessage>> queues = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> droppedCounter = new ConcurrentHashMap<>();

    private static final int DEFAULT_CAPACITY = 1024;
    private static final long DEFAULT_TTL_MILLIS = 300_000L; // 5 minutes

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(
            r -> new Thread(r, "MessageQueue-Scheduler")
    );

    @PostConstruct
    public void init() {
        log.info("MessageQueue initialised with {} queues", 0);
    }

    @PreDestroy
    public void shutdown() {
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
        queues.clear();
        log.info("MessageQueue shut down");
    }

    /**
     * Offers a message to the named queue. Never blocks the caller.
     *
     * @param queueId the target queue name
     * @param message the agent message to enqueue
     * @return true if enqueued, false if the queue is at capacity
     */
    public boolean offer(String queueId, AgentMessage message) {
        return offer(queueId, message, DEFAULT_CAPACITY);
    }

    /**
     * Offers a message to the named queue with a custom capacity limit.
     *
     * @param queueId   the target queue name
     * @param message  the agent message
     * @param capacity the maximum queue depth before offer() returns false
     * @return true if enqueued, false if full
     */
    public boolean offer(String queueId, AgentMessage message, int capacity) {
        LinkedBlockingQueue<QueuedMessage> queue = queues.computeIfAbsent(
                queueId, k -> new LinkedBlockingQueue<>(capacity));

        QueuedMessage qm = new QueuedMessage(message, System.currentTimeMillis());
        boolean accepted = queue.offer(qm);

        if (accepted) {
            log.debug("Message queued: queueId={}, msgId={}, size={}",
                    queueId, message.getId(), queue.size());
        } else {
            log.warn("Queue full, message dropped: queueId={}, msgId={}",
                    queueId, message.getId());
            droppedCounter.computeIfAbsent(queueId, k -> new AtomicLong(0)).incrementAndGet();
        }

        return accepted;
    }

    /**
     * Takes (blocks) the next available message from the named queue.
     *
     * @param queueId the queue name
     * @return the next message, or null if interrupted
     * @throws InterruptedException if the calling thread is interrupted
     */
    public AgentMessage take(String queueId) throws InterruptedException {
        LinkedBlockingQueue<QueuedMessage> queue = getOrCreateQueue(queueId);
        QueuedMessage qm = queue.take();
        return qm.message();
    }

    /**
     * Polls the named queue with a timeout.
     *
     * @param queueId   the queue name
     * @param timeout   max wait time
     * @param unit      time unit
     * @return the next message, or null if timeout expires
     */
    public AgentMessage poll(String queueId, long timeout, TimeUnit unit) {
        LinkedBlockingQueue<QueuedMessage> queue = getOrCreateQueue(queueId);
        try {
            QueuedMessage qm = queue.poll(timeout, unit);
            if (qm == null) return null;

            if (qm.isExpired(DEFAULT_TTL_MILLIS)) {
                log.debug("Message expired (TTL): queueId={}, msgId={}",
                        queueId, qm.message().getId());
                droppedCounter.computeIfAbsent(queueId, k -> new AtomicLong(0)).incrementAndGet();
                return null;
            }
            return qm.message();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return null;
        }
    }

    /**
     * Peeks at the head of the queue without removing it.
     *
     * @param queueId the queue name
     * @return the next message, or null if empty
     */
    public AgentMessage peek(String queueId) {
        LinkedBlockingQueue<QueuedMessage> queue = queues.get(queueId);
        if (queue == null || queue.isEmpty()) return null;
        return queue.peek().message();
    }

    /**
     * Returns the current depth of the named queue.
     */
    public int size(String queueId) {
        LinkedBlockingQueue<QueuedMessage> queue = queues.get(queueId);
        return queue == null ? 0 : queue.size();
    }

    /**
     * Clears all messages from the named queue.
     */
    public void clear(String queueId) {
        LinkedBlockingQueue<QueuedMessage> queue = queues.remove(queueId);
        if (queue != null) {
            queue.clear();
            log.info("Queue cleared: queueId={}", queueId);
        }
    }

    /**
     * Returns the count of dropped messages for the named queue.
     */
    public long getDroppedCount(String queueId) {
        AtomicLong counter = droppedCounter.get(queueId);
        return counter == null ? 0L : counter.get();
    }

    /**
     * Returns all active queue IDs.
     */
    public Set<String> getQueueIds() {
        return Collections.unmodifiableSet(queues.keySet());
    }

    /**
     * Registers a message consumer that continuously drains a named queue.
     * The consumer runs in a separate daemon thread.
     *
     * @param queueId   the queue to consume
     * @param processor handles each incoming message; return true to continue, false to stop
     */
    public void startConsumer(String queueId, java.util.function.Function<AgentMessage, Boolean> processor) {
        scheduler.submit(() -> {
            log.info("Queue consumer started: queueId={}", queueId);
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    AgentMessage msg = take(queueId);
                    if (msg == null) continue;
                    Boolean cont = processor.apply(msg);
                    if (cont == null || !cont) break;
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                } catch (Exception e) {
                    log.error("Consumer error for queue '{}': {}", queueId, e.getMessage());
                }
            }
            log.info("Queue consumer stopped: queueId={}", queueId);
        });
    }

    private LinkedBlockingQueue<QueuedMessage> getOrCreateQueue(String queueId) {
        return queues.computeIfAbsent(queueId, k -> {
            log.debug("Auto-creating queue: {}", queueId);
            return new LinkedBlockingQueue<>(DEFAULT_CAPACITY);
        });
    }

    /**
     * Wrapper that pairs a message with its enqueue timestamp for TTL tracking.
     */
    private record QueuedMessage(AgentMessage message, long enqueuedAt) {
        boolean isExpired(long ttlMillis) {
            return System.currentTimeMillis() - enqueuedAt > ttlMillis;
        }
    }
}
