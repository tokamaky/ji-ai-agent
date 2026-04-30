package com.xiaohang.jiaiagent.agent.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Represents a single executable step within an execution plan.
 *
 * <p>Each step contains a unique identifier, a human-readable description,
 * the tool to be invoked, optional parameters, and a list of step IDs
 * that must complete before this step can execute (dependency tracking).
 * A step also carries its execution result once completed.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanStep {

    /**
     * Unique identifier for this step within the plan (e.g., "step_1").
     */
    private String id;

    /**
     * Step sequence number (1-based). Steps are executed in order unless
     * they belong to the same dependency group and are parallelizable.
     */
    private int order;

    /**
     * Human-readable description of what this step does.
     */
    private String description;

    /**
     * The tool to invoke for this step (e.g., "searchWeb", "generatePDF").
     * Null if this is a logical/analysis step with no tool.
     */
    private String toolName;

    /**
     * Tool invocation parameters as key-value pairs.
     */
    private Object arguments;

    /**
     * IDs of steps that must complete before this step can start.
     * Empty list means no dependencies — step can run immediately.
     */
    private List<String> dependsOn;

    /**
     * Whether this step can run in parallel with other steps in the same group.
     * Set to true when multiple steps share the same dependency root and
     * have no cross-dependencies between each other.
     */
    private boolean parallelizable;

    /**
     * The execution result returned by the tool, populated after execution.
     */
    private String executionResult;

    /**
     * Execution status: PENDING, RUNNING, COMPLETED, FAILED, SKIPPED.
     */
    private StepStatus status;

    /**
     * Error message if the step failed.
     */
    private String errorMessage;

    public enum StepStatus {
        PENDING,
        RUNNING,
        COMPLETED,
        FAILED,
        SKIPPED
    }
}
