package com.xiaohang.jiaiagent.agent;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.xiaohang.jiaiagent.agent.model.ExecutionPlan;
import com.xiaohang.jiaiagent.agent.model.PlanStep;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.SystemPromptTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * A specialized LLM-based agent whose sole responsibility is task decomposition.
 *
 * <p>Given a complex user request, the PlannerAgent analyzes the intent,
 * identifies required capabilities, and produces a structured {@link ExecutionPlan}
 * containing ordered {@link PlanStep}s with dependency tracking.
 *
 * <h2>Why separate planning from execution?</h2>
 * <p>In a naive ReAct agent, the same LLM instance both decides <em>what</em> to do
 * and <em>does</em> it. This creates a tension: planning reasoning pollutes the
 * execution context, and failed plans cannot be easily reviewed or reused.
 * By decoupling the two concerns, we gain:
 * <ul>
 *   <li><b>Plannable</b> — users can review, edit, and approve a plan before execution begins</li>
 *   <li><b>Reusable</b> — the same plan can be executed by a different agent or re-run later</li>
 *   <li><b>Debuggable</b> — plan failures reveal which decomposition was wrong, not just that execution failed</li>
 *   <li><b>Parallelizable</b> — steps without cross-dependencies can be scheduled concurrently</li>
 * </ul>
 *
 * <h2>Dependency analysis</h2>
 * <p>The Planner assigns a {@code dependsOn} list to each step. Steps sharing
 * the same dependency root are identified as {@code parallelizable}, enabling
 * the executor to run them concurrently via {@code CompletableFuture}.
 *
 * <h2>Output format</h2>
 * <p>The Planner uses a structured JSON output format parsed by this agent.
 * The LLM is instructed to return a JSON array of step objects conforming
 * to the {@link PlanStep} schema. If the LLM deviates, a best-effort
 * JSON extraction is attempted before falling back to a single-step plan.
 */
@Component
@Slf4j
public class PlannerAgent {

    private final ChatClient chatClient;

    private static final String PLANNER_SYSTEM_PROMPT = """
            You are a meticulous task decomposition specialist. Your job is to break down complex user requests
            into a precise, ordered sequence of executable steps.

            ## Your capabilities
            You have access to the following tools. Always select the most appropriate one:
            - searchWeb       → real-time web search for facts, news, prices, reviews
            - scrapeWebPage   → extract full content from a specific URL (use after searchWeb)
            - searchImage     → find images (via MCP, returns image URLs)
            - generatePDF     → create a PDF report, returns a /api/files/pdf/xxx.pdf download link
            - downloadResource→ download any file from a URL to the server disk
            - readFile / writeFile → read or write local files on the server
            - executeTerminalCommand → run shell commands (use sparingly, only when needed)
            - doTerminate     → signal that the task is fully complete (call this LAST)

            ## Output format — STRICT JSON
            You MUST respond with ONLY a valid JSON array. No preamble, no explanation, no markdown.
            Each element in the array represents one step and must contain these fields:

            {
              "id": "step_1",           // unique string id within this plan
              "order": 1,               // 1-based execution order
              "description": "...",     // human-readable description of what this step does
              "toolName": "...",        // exact tool name to invoke (or null if no tool needed)
              "arguments": {             // tool parameters as key-value pairs (or null)
                "param_name": "value"
              },
              "dependsOn": [],           // array of step IDs that must complete first (empty = no dependencies)
              "parallelizable": false    // true only if this step has NO cross-dependencies with other steps in the same group
            }

            ## Dependency rules
            - Step A depends on Step B if and only if A needs the OUTPUT of B.
            - If two steps can run independently (neither needs the other's output), set parallelizable: true for both.
            - The FIRST step always has dependsOn: [].
            - If step N needs data from step N-1, step N depends on step N-1.
            - Maximum recommended steps: 8. Combine semantically similar actions into one step.

            ## Quality guidelines
            - Be specific in descriptions: "Search for Beijing 3-day itinerary" not "Search info"
            - Arguments must be concrete values, not placeholders.
            - Every "action" step (search, scrape, generate) must have a corresponding tool.
            - Include a final step with doTerminate once all information is gathered.
            - If the task is ambiguous, make a reasonable assumption and note it in the description.
            """;

    private static final String PLANNER_USER_TEMPLATE = """
            Decompose the following task into an ordered execution plan.

            Task: {task}
            User language: {language}

            Respond with ONLY a valid JSON array of steps. Each step must have:
            id, order, description, toolName, arguments, dependsOn, parallelizable.

            Respond with ONLY JSON. No markdown, no explanation, no preamble.
            """;

    public PlannerAgent(ChatModel chatModel) {
        this.chatClient = ChatClient.builder(chatModel)
                .defaultSystem(PLANNER_SYSTEM_PROMPT)
                .defaultAdvisors(new SimpleLoggerAdvisor())
                .build();
    }

    /**
     * Decomposes a user task into a structured execution plan.
     *
     * <p>The Planner sends the task to the LLM with strict JSON output instructions,
     * then parses the response into {@link ExecutionPlan} / {@link PlanStep} objects.
     * If parsing fails, a best-effort single-step fallback is returned.
     *
     * @param task          the user's complex request
     * @param userLanguage  the detected language code ("zh" or "en"), used for plan summary
     * @return a fully populated {@link ExecutionPlan} ready for execution
     */
    public ExecutionPlan plan(String task, String userLanguage) {
        log.info("PlannerAgent: Starting plan decomposition for task: {}", task);

        String languageHint = "zh".equalsIgnoreCase(userLanguage) ? "Chinese (中文)" : "English";

        Prompt prompt = new Prompt(
                new UserMessage(
                        new SystemPromptTemplate(PLANNER_USER_TEMPLATE)
                                .render(Map.of("task", task, "language", languageHint))
                )
        );

        AssistantMessage response = chatClient.prompt(prompt)
                .call()
                .chatResponse()
                .getResult()
                .getOutput();

        String rawText = response.getText();
        log.info("PlannerAgent raw LLM response:\n{}", rawText);

        return parseToExecutionPlan(task, rawText, userLanguage);
    }

    /**
     * Parses the LLM's raw JSON text into a structured {@link ExecutionPlan}.
     *
     * <p>The method first tries to extract a clean JSON array, handling common
     * LLM formatting issues (surrounding markdown code fences, trailing commas, etc.).
     * If JSON parsing fails entirely, a single-step fallback plan is returned
     * so the executor is never left without a plan.
     */
    private ExecutionPlan parseToExecutionPlan(String task, String rawText, String language) {
        String planId = UUID.randomUUID().toString();
        List<PlanStep> steps;

        try {
            String jsonText = extractJsonArray(rawText);
            JSONArray jsonArray = JSONUtil.parseArray(jsonText);

            steps = new ArrayList<>();
            for (int i = 0; i < jsonArray.size(); i++) {
                JSONObject obj = jsonArray.getJSONObject(i);
                PlanStep step = PlanStep.builder()
                        .id(obj.getStr("id", "step_" + (i + 1)))
                        .order(obj.getInt("order", i + 1))
                        .description(obj.getStr("description", ""))
                        .toolName(obj.getStr("toolName", null))
                        .arguments(parseArguments(obj.get("arguments")))
                        .dependsOn(parseStringList(obj.get("dependsOn")))
                        .parallelizable(obj.getBool("parallelizable", false))
                        .status(PlanStep.StepStatus.PENDING)
                        .build();
                steps.add(step);
            }

            log.info("PlannerAgent: Successfully parsed {} steps from LLM response", steps.size());

        } catch (Exception e) {
            log.warn("PlannerAgent: JSON parsing failed, falling back to single-step plan. Error: {}", e.getMessage());
            // Fallback: wrap the entire task as a single step
            steps = List.of(PlanStep.builder()
                    .id("step_1")
                    .order(1)
                    .description("Execute the user's task: " + task)
                    .toolName(null)
                    .arguments(null)
                    .dependsOn(List.of())
                    .parallelizable(false)
                    .status(PlanStep.StepStatus.PENDING)
                    .build());
        }

        // Build summary
        String summary = buildSummary(steps, language);
        int totalSteps = steps.size();
        List<String> tags = inferTags(task, steps);

        ExecutionPlan plan = ExecutionPlan.builder()
                .planId(planId)
                .originalTask(task)
                .summary(summary)
                .steps(steps)
                .totalSteps(totalSteps)
                .completedSteps(0)
                .failedSteps(0)
                .status(ExecutionPlan.PlanStatus.CREATED)
                .createdAt(Instant.now())
                .tags(tags)
                .build();

        log.info("PlannerAgent: Plan created — id={}, steps={}, tags={}", planId, totalSteps, tags);
        return plan;
    }

    /**
     * Extracts a clean JSON array string from LLM output.
     *
     * <p>Handles:
     * <ul>
     *   <li>Markdown code fences (```json ... ```)</li>
     *   <li>Trailing commas before closing bracket</li>
     *   <li>Text before/after the JSON array</li>
     * </ul>
     */
    private String extractJsonArray(String text) {
        String trimmed = text.trim();

        // Remove markdown code fences
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            if (firstNewline > 0) {
                trimmed = trimmed.substring(firstNewline + 1);
            }
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }

        // Find the first '[' and last ']'
        int start = trimmed.indexOf('[');
        int end = trimmed.lastIndexOf(']');

        if (start >= 0 && end > start) {
            String json = trimmed.substring(start, end + 1);
            // Remove trailing commas (invalid JSON)
            json = json.replaceAll(",\\s*([\\]\\}])", "$1");
            return json;
        }

        throw new IllegalArgumentException("No JSON array found in LLM response");
    }

    /**
     * Parses the "arguments" field from a step JSON object.
     * Returns a Map if the field is a JSON object, or null otherwise.
     */
    private Object parseArguments(Object args) {
        if (args == null) return null;
        if (args instanceof JSONObject jo) {
            return jo;
        }
        // If it's a string, try to parse as JSON
        if (args instanceof String s) {
            try {
                return JSONUtil.parse(s);
            } catch (Exception ignored) {
                return null;
            }
        }
        return null;
    }

    /**
     * Parses a JSON array of strings into a Java List.
     */
    private List<String> parseStringList(Object array) {
        if (array == null) return List.of();
        if (array instanceof JSONArray ja) {
            return ja.stream()
                    .map(Object::toString)
                    .collect(Collectors.toList());
        }
        if (array instanceof List<?> list) {
            return list.stream().map(Object::toString).collect(Collectors.toList());
        }
        return List.of();
    }

    /**
     * Builds a human-readable summary of the plan in the user's language.
     */
    private String buildSummary(List<PlanStep> steps, String language) {
        if (steps.isEmpty()) return "No steps required.";

        StringBuilder sb = new StringBuilder();
        boolean isZh = "zh".equalsIgnoreCase(language);

        sb.append(isZh ? "执行计划（共" : "Execution Plan (total ")
          .append(steps.size())
          .append(isZh ? "步）：\n" : " steps):\n");

        for (PlanStep step : steps) {
            sb.append(step.getOrder())
              .append(". ")
              .append(step.getDescription());
            if (StrUtil.isNotBlank(step.getToolName())) {
                sb.append(" [")
                  .append(step.getToolName())
                  .append("]");
            }
            if (!step.getDependsOn().isEmpty()) {
                sb.append(" (")
                  .append(isZh ? "依赖: " : "depends on: ")
                  .append(String.join(", ", step.getDependsOn()))
                  .append(")");
            }
            sb.append("\n");
        }

        return sb.toString().trim();
    }

    /**
     * Infers semantic tags from the task and selected tools.
     */
    private List<String> inferTags(String task, List<PlanStep> steps) {
        Set<String> tags = new LinkedHashSet<>();

        // Tag by tool presence
        Set<String> toolsUsed = steps.stream()
                .map(PlanStep::getToolName)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (toolsUsed.contains("searchWeb") || toolsUsed.contains("scrapeWebPage")) {
            tags.add("research");
        }
        if (toolsUsed.contains("generatePDF")) {
            tags.add("report");
        }
        if (toolsUsed.contains("readFile") || toolsUsed.contains("writeFile")) {
            tags.add("file-ops");
        }
        if (toolsUsed.contains("executeTerminalCommand")) {
            tags.add("code-execution");
        }
        if (toolsUsed.contains("searchImage")) {
            tags.add("image-search");
        }

        // Tag by keywords in task
        String lowerTask = task.toLowerCase();
        if (lowerTask.contains("analyze") || lowerTask.contains("analysis")) tags.add("analysis");
        if (lowerTask.contains("compare") || lowerTask.contains("comparison")) tags.add("comparison");
        if (lowerTask.contains("travel") || lowerTask.contains("trip") || lowerTask.contains("itinerary")) tags.add("travel");
        if (lowerTask.contains("recipe") || lowerTask.contains("cook") || lowerTask.contains("food")) tags.add("lifestyle");

        return new ArrayList<>(tags);
    }

    /**
     * Re-plans the remaining steps after a failure.
     *
     * <p>Called when a step fails. The Planner receives the original task,
     * the failed steps, and the partial results, then generates a new plan
     * for the remaining work.
     *
     * @param originalTask   the original user request
     * @param failedStep     the step that failed
     * @param partialResults map of stepId → execution result for completed steps
     * @param userLanguage   detected language code
     * @return a new {@link ExecutionPlan} for the remaining work
     */
    public ExecutionPlan replan(String originalTask, PlanStep failedStep,
                                 Map<String, String> partialResults, String userLanguage) {
        log.info("PlannerAgent: Re-planning after step failure: {}", failedStep.getId());

        String replanPrompt = String.format("""
                The original task "%s" partially failed during execution.

                Completed steps and their results:
                %s

                Failed step: %s (description: %s, tool: %s, error: %s)

                Please create a new execution plan that:
                1. Does NOT repeat any already-completed steps
                2. Uses the partial results from completed steps where relevant
                3. Provides an alternative approach for the failed step
                4. Leads to completing the original task

                Respond with ONLY a valid JSON array of steps.
                """,
                originalTask,
                partialResults.entrySet().stream()
                        .map(e -> "  " + e.getKey() + ": " + e.getValue())
                        .collect(Collectors.joining("\n")),
                failedStep.getId(),
                failedStep.getDescription(),
                failedStep.getToolName(),
                failedStep.getErrorMessage()
        );

        String languageHint = "zh".equalsIgnoreCase(userLanguage) ? "Chinese (中文)" : "English";

        Prompt prompt = new Prompt(new UserMessage(
                new SystemPromptTemplate(PLANNER_USER_TEMPLATE)
                        .render(Map.of("task", replanPrompt, "language", languageHint))
        ));

        AssistantMessage response = chatClient.prompt(prompt)
                .call()
                .chatResponse()
                .getResult()
                .getOutput();

        ExecutionPlan newPlan = parseToExecutionPlan(originalTask, response.getText(), userLanguage);
        newPlan.setStatus(ExecutionPlan.PlanStatus.RE_PLANNED);
        return newPlan;
    }
}
