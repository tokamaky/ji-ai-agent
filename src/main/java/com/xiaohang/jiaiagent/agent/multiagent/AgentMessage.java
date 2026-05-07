package com.xiaohang.jiaiagent.agent.multiagent;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Inter-agent message envelope implementing a JSON-based communication protocol.
 *
 * <p>Supports four message types:
 * <ul>
 *   <li>{@code REQUEST} — one agent requests an action from another</li>
 *   <li>{@code RESPONSE} — reply to a prior REQUEST</li>
 *   <li>{@code NOTIFICATION} — one-way broadcast / event signal</li>
 *   <li>{@code BROADCAST} — informational message to all registered agents</li>
 * </ul>
 *
 * <p>Messages are serialised to JSON so they can pass through a
 * {@link java.util.concurrent.BlockingQueue} or any other transport layer.
 *
 * <h2>Example REQUEST</h2>
 * <pre>
 * AgentMessage msg = AgentMessage.request("supervisor", "researcher",
 *     "Search for LangChain latest release");
 * </pre>
 *
 * <h2>Example RESPONSE</h2>
 * <pre>
 * AgentMessage reply = AgentMessage.response(msg,
 *     Map.of("results", List.of(...)));
 * </pre>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentMessage {

    private String id;
    private MessageType type;
    private String sender;
    private String receiver;
    private String content;
    private Map<String, Object> payload;
    private Instant timestamp;
    private String correlationId;
    private Map<String, String> metadata;

    public enum MessageType {
        REQUEST,
        RESPONSE,
        NOTIFICATION,
        BROADCAST
    }

    /**
     * Creates a new REQUEST message from {@code sender} to {@code receiver}.
     */
    public static AgentMessage request(String sender, String receiver, String content) {
        return builder()
                .id(UUID.randomUUID().toString())
                .type(MessageType.REQUEST)
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .timestamp(Instant.now())
                .build();
    }

    /**
     * Creates a RESPONSE message replying to {@code original} with {@code content}.
     */
    public static AgentMessage response(AgentMessage original, String content) {
        return response(original, content, null);
    }

    /**
     * Creates a RESPONSE message replying to {@code original} with {@code content} and extra payload.
     */
    public static AgentMessage response(AgentMessage original, String content,
                                         Map<String, Object> payload) {
        return builder()
                .id(UUID.randomUUID().toString())
                .type(MessageType.RESPONSE)
                .sender(original.getReceiver())
                .receiver(original.getSender())
                .content(content)
                .payload(payload)
                .timestamp(Instant.now())
                .correlationId(original.getId())
                .build();
    }

    /**
     * Creates a one-way NOTIFICATION from {@code sender} to {@code receiver}.
     */
    public static AgentMessage notification(String sender, String receiver, String content) {
        return builder()
                .id(UUID.randomUUID().toString())
                .type(MessageType.NOTIFICATION)
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .timestamp(Instant.now())
                .build();
    }

    /**
     * Creates a BROADCAST message from {@code sender} to all agents.
     */
    public static AgentMessage broadcast(String sender, String content) {
        return builder()
                .id(UUID.randomUUID().toString())
                .type(MessageType.BROADCAST)
                .sender(sender)
                .receiver(null)
                .content(content)
                .timestamp(Instant.now())
                .build();
    }

    /**
     * Serialises this message to a JSON string.
     */
    public String toJson() {
        return JSONUtil.toJsonStr(this);
    }

    /**
     * Deserialises a JSON string back into an AgentMessage.
     */
    public static AgentMessage fromJson(String json) {
        return JSONUtil.toBean(json, AgentMessage.class);
    }

    /**
     * Returns the payload value cast to type T, or null if absent.
     */
    @SuppressWarnings("unchecked")
    public <T> T getPayloadValue(String key) {
        if (payload == null) return null;
        Object value = payload.get(key);
        return value != null ? (T) value : null;
    }

    /**
     * Returns true if this is a response to another message.
     */
    public boolean isResponse() {
        return type == MessageType.RESPONSE;
    }

    /**
     * Returns true if this message is addressed to a specific receiver (not a broadcast).
     */
    public boolean isDirected() {
        return receiver != null && !receiver.isBlank();
    }
}
