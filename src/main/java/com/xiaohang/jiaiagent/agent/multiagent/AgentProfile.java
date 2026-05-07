package com.xiaohang.jiaiagent.agent.multiagent;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.*;

/**
 * Defines the role, capabilities, and operational boundaries of a single agent.
 *
 * <p>Each agent in the multi-agent system carries an {@code AgentProfile} that
 * describes:
 * <ul>
 *   <li>Identity — name, display label, description</li>
 *   <li>Capability — a set of task keywords or categories the agent handles</li>
 *   <li>Tool whitelist — which tools this agent is permitted to use</li>
 *   <li>Operational limits — max steps, timeout per task</li>
 *   <li>Tags — free-form labels for filtering (e.g. "web", "code", "analysis")</li>
 * </ul>
 *
 * <p>The SupervisorAgent uses profiles to route incoming tasks to the most
 * appropriate sub-agent.
 *
 * <h2>Example</h2>
 * <pre>
 * AgentProfile researcher = AgentProfile.builder()
 *         .name("researcher")
 *         .displayName("Research Specialist")
 *         .description("Web search, page scraping, and information gathering")
 *         .capabilities(List.of("search", "research", "scrape", "analyze"))
 *         .toolWhitelist(Set.of("searchWeb", "scrapeWebPage"))
 *         .maxSteps(15)
 *         .timeoutSeconds(120)
 *         .tags(Set.of("web", "research"))
 *         .build();
 * </pre>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentProfile {

    /**
     * Unique identifier used for lookup and routing.
     */
    private String name;

    /**
     * Human-readable display name shown in logs and UIs.
     */
    private String displayName;

    /**
     * One-sentence description of the agent's primary role.
     */
    private String description;

    /**
     * Keywords or phrases that indicate this agent can handle a task.
     * Matching is case-insensitive substring matching.
     */
    private List<String> capabilities;

    /**
     * Explicit allow-list of tool names this agent is permitted to invoke.
     * If empty, all tools are permitted (unless restricted by runtime config).
     */
    private Set<String> toolWhitelist;

    /**
     * Explicit deny-list of tool names this agent is NOT permitted to invoke.
     * Takes precedence over {@code toolWhitelist}.
     */
    private Set<String> toolBlacklist;

    /**
     * Maximum number of ReAct steps this agent may take per task.
     */
    @Builder.Default
    private int maxSteps = 10;

    /**
     * Maximum wall-clock time (seconds) allowed per task.
     */
    @Builder.Default
    private int timeoutSeconds = 300;

    /**
     * Priority when multiple agents match. Higher number = higher priority.
     */
    @Builder.Default
    private int priority = 5;

    /**
     * Free-form tags for grouping and filtering agents.
     */
    private Set<String> tags;

    /**
     * Whether this agent is currently active and able to receive tasks.
     */
    @Builder.Default
    private boolean active = true;

    /**
     * Ordered list of routing hints (other agent names) to consult before this one.
     * Used by the supervisor for fallback chain routing.
     */
    private List<String> fallbackAgents;

    /**
     * Checks whether this agent can use the given tool name.
     * Deny-list takes precedence over allow-list.
     */
    public boolean canUseTool(String toolName) {
        if (toolBlacklist != null && toolBlacklist.contains(toolName)) {
            return false;
        }
        if (toolWhitelist != null && !toolWhitelist.isEmpty()) {
            return toolWhitelist.contains(toolName);
        }
        return true;
    }

    /**
     * Checks whether this agent's capability keywords match the given task text.
     * Matching is case-insensitive substring matching against each capability.
     */
    public boolean matchesTask(String taskText) {
        if (capabilities == null || capabilities.isEmpty()) {
            return false;
        }
        String lower = taskText.toLowerCase();
        return capabilities.stream()
                .anyMatch(cap -> lower.contains(cap.toLowerCase()));
    }

    /**
     * Returns all capability keywords as a comma-separated string.
     */
    public String getCapabilitiesSummary() {
        return capabilities == null ? "" : String.join(", ", capabilities);
    }

    /**
     * Builder subclass that provides sensible defaults.
     */
    public static class AgentProfileBuilder {
        public AgentProfileBuilder tags(Set<String> tags) {
            this.tags = tags;
            return this;
        }

        public AgentProfileBuilder tags(String... tagArray) {
            this.tags = Set.of(tagArray);
            return this;
        }

        public AgentProfileBuilder capabilities(List<String> capabilities) {
            this.capabilities = capabilities;
            return this;
        }

        public AgentProfileBuilder capabilities(String... caps) {
            this.capabilities = List.of(caps);
            return this;
        }
    }
}
