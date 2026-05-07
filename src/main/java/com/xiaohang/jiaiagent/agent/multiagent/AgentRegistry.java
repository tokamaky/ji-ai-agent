package com.xiaohang.jiaiagent.agent.multiagent;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Consumer;

/**
 * Central registry for all agents in the multi-agent system.
 *
 * <p>Agents register themselves at startup (or dynamically) with a unique name.
 * The registry provides lookup by name, listing, and the ability to send
 * messages directly to a registered agent or broadcast to all.
 *
 * <p>This class is thread-safe: reads and writes against the internal maps
 * are protected by the ConcurrentHashMap implementation.
 *
 * <h2>Usage</h2>
 * <pre>
 * // Agent registers itself
 * agentRegistry.register("researcher", researcherAgent);
 *
 * // Supervisor looks up a sub-agent
 * ResearcherAgent researcher = agentRegistry.getAgent("researcher", ResearcherAgent.class);
 *
 * // Broadcast to all agents
 * agentRegistry.broadcast(msg, agent -> agent.receive(msg));
 * </pre>
 *
 * <h2>Metrics</h2>
 * The registry tracks total registrations and message counts per agent.
 */
@Component
@Slf4j
public class AgentRegistry {

    private final Map<String, BaseAgentWrapper> agents = new ConcurrentHashMap<>();
    private final AtomicLong totalRegistrations = new AtomicLong(0);
    private final AtomicLong totalMessages = new AtomicLong(0);

    @PostConstruct
    public void init() {
        log.info("AgentRegistry initialised");
    }

    /**
     * Registers an agent instance under the given {@code name}.
     * If a previous agent was registered under the same name, it is replaced.
     *
     * @param name  unique identifier for the agent (e.g. "researcher", "coder")
     * @param agent the agent instance to register
     */
    public void register(String name, BaseAgentWrapper agent) {
        agents.put(name, agent);
        long count = totalRegistrations.incrementAndGet();
        log.info("Agent registered: name={}, type={}, totalRegistrations={}",
                name, agent.getClass().getSimpleName(), count);
    }

    /**
     * Unregisters the agent with the given name.
     *
     * @param name the agent name to unregister
     * @return the previously registered agent, or null if none existed
     */
    public BaseAgentWrapper unregister(String name) {
        BaseAgentWrapper removed = agents.remove(name);
        if (removed != null) {
            log.info("Agent unregistered: name={}", name);
        }
        return removed;
    }

    /**
     * Looks up a registered agent by name.
     *
     * @param name the agent name
     * @return the agent, or null if not found
     */
    public BaseAgentWrapper getAgent(String name) {
        return agents.get(name);
    }

    /**
     * Looks up a registered agent by name and casts it to the expected type.
     *
     * @param name     the agent name
     * @param agentClass the expected class
     * @param <T>      the agent type
     * @return the agent, or null if not found or not of the expected type
     */
    @SuppressWarnings("unchecked")
    public <T extends BaseAgentWrapper> T getAgent(String name, Class<T> agentClass) {
        BaseAgentWrapper agent = agents.get(name);
        if (agent == null) return null;
        if (!agentClass.isInstance(agent)) {
            log.warn("Agent '{}' exists but is type {}, expected {}",
                    name, agent.getClass().getSimpleName(), agentClass.getSimpleName());
            return null;
        }
        return (T) agent;
    }

    /**
     * Returns an unmodifiable collection of all registered agent names.
     */
    public Collection<String> getAllAgentNames() {
        return Collections.unmodifiableCollection(agents.keySet());
    }

    /**
     * Returns an unmodifiable list of all registered agents.
     */
    public List<BaseAgentWrapper> getAllAgents() {
        return List.copyOf(agents.values());
    }

    /**
     * Returns the number of currently registered agents.
     */
    public int getAgentCount() {
        return agents.size();
    }

    /**
     * Broadcasts a message to all registered agents.
     *
     * @param message the message to send
     * @param sender  the consumer that actually delivers to each agent
     */
    public void broadcast(Object message, Consumer<BaseAgentWrapper> sender) {
        totalMessages.addAndGet(agents.size());
        for (BaseAgentWrapper agent : agents.values()) {
            try {
                sender.accept(agent);
            } catch (Exception e) {
                log.error("Error broadcasting to agent '{}': {}",
                        agent.getClass().getSimpleName(), e.getMessage());
            }
        }
    }

    /**
     * Checks whether an agent with the given name is registered.
     */
    public boolean isRegistered(String name) {
        return agents.containsKey(name);
    }

    /**
     * Returns the total number of messages processed by the registry since startup.
     */
    public long getTotalMessages() {
        return totalMessages.get();
    }

    /**
     * Lightweight interface wrapping any agent type so the registry
     * can hold references without knowing concrete types.
     */
    public interface BaseAgentWrapper {
        String getName();
    }
}
