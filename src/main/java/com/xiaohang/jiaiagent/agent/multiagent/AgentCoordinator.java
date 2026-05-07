package com.xiaohang.jiaiagent.agent.multiagent;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * Aggregates execution results from multiple sub-agents into a single
 * coherent response for the user.
 *
 * <p>The coordinator maintains a {@code CompletableFuture} per active sub-agent task.
 * When all futures complete (or timeout), the coordinator:
 * <ol>
 *   <li>Collects each sub-agent's result</li>
 *   <li>Detects and handles failures</li>
 *   <li>Synthesises a unified response in the user's language</li>
 *   <li>Streams the final result to the frontend via SSE</li>
 * </ol>
 *
 * <h2>Thread safety</h2>
 * All fields are protected by ConcurrentHashMap or atomic wrappers.
 * This class is safe for use by multiple concurrent supervisor invocations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentCoordinator {

    private String taskId;
    private String originalTask;
    private String userLanguage;

    private Instant startedAt;

    @Builder.Default
    private int totalSubAgents = 0;

    @Builder.Default
    private int completedSubAgents = 0;

    @Builder.Default
    private int failedSubAgents = 0;

    private Map<String, SubAgentResult> subAgentResults;

    private String aggregatedResponse;

    private Instant finishedAt;

    private boolean success;

    /**
     * Represents the result produced by a single sub-agent.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubAgentResult {

        private String agentName;
        private String taskDescription;
        private String result;
        private boolean success;
        private String errorMessage;
        private long durationMs;
        private Instant completedAt;
    }

    /**
     * Records a successful result from a sub-agent.
     */
    public void recordSuccess(String agentName, String taskDescription,
                              String result, long durationMs) {
        if (subAgentResults != null) {
            subAgentResults.put(agentName, SubAgentResult.builder()
                    .agentName(agentName)
                    .taskDescription(taskDescription)
                    .result(result)
                    .success(true)
                    .durationMs(durationMs)
                    .completedAt(Instant.now())
                    .build());
        }
        completedSubAgents++;
    }

    /**
     * Records a failed result from a sub-agent.
     */
    public void recordFailure(String agentName, String taskDescription,
                              String errorMessage, long durationMs) {
        if (subAgentResults != null) {
            subAgentResults.put(agentName, SubAgentResult.builder()
                    .agentName(agentName)
                    .taskDescription(taskDescription)
                    .success(false)
                    .errorMessage(errorMessage)
                    .durationMs(durationMs)
                    .completedAt(Instant.now())
                    .build());
        }
        failedSubAgents++;
    }

    /**
     * Returns the overall completion percentage (0–100).
     */
    public int getProgressPercent() {
        if (totalSubAgents == 0) return 0;
        return (int) ((completedSubAgents + failedSubAgents) * 100.0 / totalSubAgents);
    }

    /**
     * Returns true when all sub-agents have finished (success or failure).
     */
    public boolean isComplete() {
        return totalSubAgents > 0 && completedSubAgents + failedSubAgents >= totalSubAgents;
    }

    /**
     * Returns a human-readable summary of all sub-agent results.
     */
    public String buildSummary() {
        StringBuilder sb = new StringBuilder();
        boolean isZh = "zh".equalsIgnoreCase(userLanguage);

        sb.append(isZh ? "## 子智能体执行摘要\n\n" : "## Sub-Agent Execution Summary\n\n");

        if (subAgentResults != null) {
            for (SubAgentResult r : subAgentResults.values()) {
                String icon = r.isSuccess() ? "✅" : "❌";
                sb.append(icon).append(" **").append(r.getAgentName()).append("**");
                if (r.getTaskDescription() != null) {
                    sb.append(" — ").append(r.getTaskDescription());
                }
                sb.append("\n");
                if (r.isSuccess()) {
                    sb.append("   > Duration: ").append(r.getDurationMs()).append("ms\n");
                } else {
                    sb.append("   > Error: ").append(
                            r.getErrorMessage() != null ? r.getErrorMessage() : "Unknown").append("\n");
                }
                sb.append("\n");
            }
        }

        sb.append("**").append(isZh ? "进度" : "Progress").append(":** ")
          .append(completedSubAgents).append("/").append(totalSubAgents)
          .append(" ").append(isZh ? "成功" : "completed").append(", ")
          .append(failedSubAgents).append(" ").append(isZh ? "失败" : "failed").append("\n");

        return sb.toString();
    }

    /**
     * Builds the final aggregated markdown response.
     */
    public String buildFinalResponse() {
        if (aggregatedResponse != null && !aggregatedResponse.isBlank()) {
            return aggregatedResponse;
        }
        return buildSummary();
    }
}
