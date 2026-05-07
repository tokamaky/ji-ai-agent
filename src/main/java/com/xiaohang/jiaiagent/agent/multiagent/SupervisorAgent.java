package com.xiaohang.jiaiagent.agent.multiagent;

import cn.hutool.core.lang.UUID;
import cn.hutool.core.util.StrUtil;
import com.xiaohang.jiaiagent.agent.ToolCallAgent;
import com.xiaohang.jiaiagent.agent.model.AgentSSEMessage;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

/**
 * The SupervisorAgent is the central orchestrator of the multi-agent system.
 *
 * <p>Given a complex user task, the supervisor:
 * <ol>
 *   <li>Analyse the task intent and decompose it into agent-appropriate subtasks</li>
 *   <li>Route each subtask to the most suitable specialist sub-agent
 *       ({@link ResearcherAgent} or {@link CoderAgent})</li>
 *   <li>Execute independent subtasks in <b>parallel</b> via {@link CompletableFuture}</li>
 *   <li>Collect and aggregate all sub-agent results through {@link AgentCoordinator}</li>
 *   <li>Stream progress updates and the final response to the frontend via SSE</li>
 * </ol>
 *
 * <h2>Architecture</h2>
 * <pre>
 *  User request
 *      │
 *      ▼
 *  SupervisorAgent.analyse()   ← decides which sub-agents to invoke
 *      │
 *      ├──────────────────► ResearcherAgent  (parallel)
 *      │                         └── CompletableFuture
 *      │
 *      └──────────────────► CoderAgent  (parallel)
 *                                └── CompletableFuture
 *      │
 *      ▼
 *  AgentCoordinator.aggregate()  ← merges results
 *      │
 *      ▼
 *  SSE stream ──► Frontend
 * </pre>
 *
 * <h2>Thread safety</h2>
 * SupervisorAgent is a Spring {@code @Component} (singleton). Each incoming request
 * gets its own {@link SseEmitter}, message queue, and coordinator instance,
 * so concurrent users do not interfere with each other.
 *
 * <p>The supervisor itself is stateless — all per-request state lives in
 * local variables or thread-local constructs (no shared mutable fields).
 */
@Component
@Slf4j
public class SupervisorAgent implements AgentRegistry.BaseAgentWrapper {

    private static final int AGGREGATION_TIMEOUT_SECONDS = 300;
    private static final int SUB_AGENT_TIMEOUT_SECONDS = 240;

    private final MessageQueue messageQueue;
    private final AgentProfileRegistry profileRegistry;
    private final AgentRegistry agentRegistry;

    private final ThreadPoolExecutor coordinatorExecutor;

    private final ChatModel chatModel;

    private static final String SUPERVISOR_SYSTEM_PROMPT = """
            You are the Supervisor of a multi-agent AI system. Your role is to:
            1. Understand the user's complex request.
            2. Identify which specialist agents to involve.
            3. Synthesize a final, cohesive response from all specialist results.

            Available specialist agents:
            - researcher  → web search, information gathering, page scraping, image search
            - coder      → code writing, file operations, command execution

            ## Routing rules
            - If the task requires finding information, facts, or images → route to "researcher".
            - If the task requires writing, editing, or executing code → route to "coder".
            - Complex tasks that need both should be split: invoke "researcher" first,
              then "coder" once research results are available.
            - Simple questions that need no tool use → answer directly.

            ## Response format
            When aggregating sub-agent results, present them as:
            1. Research findings (if researcher was invoked)
            2. Code / file results (if coder was invoked)
            3. A clear final answer or recommendation

            Always respond in the same language as the user's original message.
            Use markdown formatting throughout.
            """;

    public SupervisorAgent(MessageQueue messageQueue,
                          AgentProfileRegistry profileRegistry,
                          AgentRegistry agentRegistry,
                          ChatModel chatModel) {
        this.messageQueue = messageQueue;
        this.profileRegistry = profileRegistry;
        this.agentRegistry = agentRegistry;
        this.chatModel = chatModel;

        this.coordinatorExecutor = new ThreadPoolExecutor(
                4, 8, 60L, TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(64),
                r -> {
                    Thread t = new Thread(r, "Supervisor-Coordinator");
                    t.setDaemon(true);
                    return t;
                },
                new ThreadPoolExecutor.CallerRunsPolicy()
        );

        agentRegistry.register("supervisor", this);
    }

    @PostConstruct
    public void init() {
        log.info("SupervisorAgent initialised — registered '{}', coordinatorExecutor corePool={}",
                getName(), coordinatorExecutor.getCorePoolSize());
    }

    @Override
    public String getName() {
        return "supervisor";
    }

    /**
     * Entry point called by the controller. Synchronously creates an SSE emitter
     * and starts async processing.
     *
     * @param message      the user's task
     * @param userLanguage detected language code ("zh" or "en")
     * @return an SSE emitter the controller can return
     */
    public SseEmitter handle(String message, String userLanguage) {
        String taskId = UUID.randomUUID().toString();
        SseEmitter emitter = new SseEmitter(360_000L); // 6 min timeout

        log.info("SupervisorAgent[{}]: New task: {}", taskId, message);

        CompletableFuture.runAsync(() -> {
            try {
                processTask(taskId, message, userLanguage, emitter);
            } catch (Exception e) {
                log.error("SupervisorAgent[{}]: Processing error: {}", taskId, e.getMessage(), e);
                sendSafe(emitter, AgentSSEMessage.error("处理失败: " + e.getMessage()));
                completeSafe(emitter);
            }
        }, coordinatorExecutor);

        emitter.onCompletion(() -> log.info("SupervisorAgent[{}]: SSE completed", taskId));
        emitter.onTimeout(() -> log.warn("SupervisorAgent[{}]: SSE timed out", taskId));
        emitter.onError(e -> log.warn("SupervisorAgent[{}]: SSE error: {}", taskId, e.getMessage()));

        return emitter;
    }

    /**
     * Core processing logic: analyse → route → parallel execute → aggregate → stream.
     */
    private void processTask(String taskId, String message, String userLanguage, SseEmitter emitter) {
        Instant start = Instant.now();

        sendSafe(emitter, AgentSSEMessage.thinking("分析任务中..."));

        // ── Step 1: Analyse and decide routing ────────────────────────────────
        List<AgentRoute> routes = analyseTask(message, userLanguage);

        if (routes.isEmpty()) {
            // No sub-agent needed — supervisor answers directly
            sendSafe(emitter, AgentSSEMessage.thinking("直接回答中..."));
            String answer = answerDirectly(message, userLanguage);
            sendSafe(emitter, AgentSSEMessage.finalResponse(answer));
            completeSafe(emitter);
            return;
        }

        sendSafe(emitter, AgentSSEMessage.thinking(
                "任务已分解，将调度 " + routes.size() + " 个子智能体并行执行..."));

        // ── Step 2: Execute sub-agents in parallel ────────────────────────────
        Map<String, String> subAgentResults = new ConcurrentHashMap<>();
        Map<String, String> subAgentErrors = new ConcurrentHashMap<>();

        List<CompletableFuture<Void>> futures = new ArrayList<>();

        for (AgentRoute route : routes) {
            CompletableFuture<Void> f = CompletableFuture.runAsync(() -> {
                executeSubAgent(taskId, route, subAgentResults, subAgentErrors, userLanguage);
            }, coordinatorExecutor);
            futures.add(f);
        }

        // Wait for all sub-agents to complete
        try {
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
                    .get(SUB_AGENT_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            log.warn("SupervisorAgent[{}]: Sub-agent timeout, proceeding with partial results", taskId);
            sendSafe(emitter, AgentSSEMessage.toolResult("timeout",
                    "部分子智能体执行超时，以可用结果继续。"));
        } catch (Exception e) {
            log.error("SupervisorAgent[{}]: Sub-agent execution error: {}", taskId, e.getMessage());
        }

        // ── Step 3: Aggregate results ────────────────────────────────────────
        sendSafe(emitter, AgentSSEMessage.thinking("聚合子智能体结果中..."));
        String aggregated = aggregateResults(message, routes, subAgentResults, subAgentErrors, userLanguage);

        // ── Step 4: Stream final response ─────────────────────────────────────
        sendSafe(emitter, AgentSSEMessage.finalResponse(aggregated));
        completeSafe(emitter);

        long elapsed = Duration.between(start, Instant.now()).toMillis();
        log.info("SupervisorAgent[{}]: Task complete in {}ms, routes={}, results={}",
                taskId, elapsed, routes.size(), subAgentResults.size());
    }

    /**
     * Decides which sub-agents to route the task to, based on keyword matching
     * against registered profiles.
     *
     * @param task         the user's request
     * @param userLanguage language hint
     * @return ordered list of routes (may be empty)
     */
    private List<AgentRoute> analyseTask(String task, String userLanguage) {
        sendThinking("正在分析任务路由...");

        String prompt = String.format("""
                Analyse this task and determine which specialist agents to use.

                Task: %s
                Language: %s

                Respond with ONLY a JSON object:
                {
                  "routes": [
                    { "agent": "agent-name", "subtask": "what to ask this agent to do" }
                  ]
                }

                Rules:
                - researcher: for search, research, scraping, images, information gathering
                - coder: for code writing, file editing, command execution
                - Omit an agent if no part of the task needs it
                - If the task is a simple question needing no tools, return routes=[]
                - Use the agent's exact registered name (researcher / coder)
                - Return valid JSON only, no markdown, no explanation.
                """, task, "zh".equalsIgnoreCase(userLanguage) ? "Chinese" : "English");

        try {
            ChatClient client = buildChatClient();
            AssistantMessage response = client.prompt(new Prompt(new UserMessage(prompt)))
                    .call()
                    .chatResponse()
                    .getResult()
                    .getOutput();

            return parseRoutes(response.getText());
        } catch (Exception e) {
            log.warn("SupervisorAgent: Route analysis failed, falling back to keyword heuristics: {}",
                    e.getMessage());
            return fallbackRouteAnalysis(task);
        }
    }

    private List<AgentRoute> parseRoutes(String rawText) {
        List<AgentRoute> routes = new ArrayList<>();
        try {
            cn.hutool.json.JSONObject obj = cn.hutool.json.JSONUtil.parseObj(rawText);
            cn.hutool.json.JSONArray arr = obj.getJSONArray("routes");
            if (arr == null || arr.isEmpty()) return routes;

            for (Object item : arr) {
                cn.hutool.json.JSONObject routeObj = (cn.hutool.json.JSONObject) item;
                String agent = routeObj.getStr("agent");
                String subtask = routeObj.getStr("subtask");
                if (StrUtil.isNotBlank(agent) && StrUtil.isNotBlank(subtask)) {
                    routes.add(new AgentRoute(agent.trim(), subtask.trim()));
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse routes JSON: {}", e.getMessage());
        }
        return routes;
    }

    private List<AgentRoute> fallbackRouteAnalysis(String task) {
        List<AgentRoute> routes = new ArrayList<>();
        String lower = task.toLowerCase();
        if (lower.contains("search") || lower.contains("找") || lower.contains("搜索") ||
                lower.contains("research") || lower.contains("调研") ||
                lower.contains("scrape") || lower.contains("爬") ||
                lower.contains("information") || lower.contains("信息")) {
            routes.add(new AgentRoute("researcher", task));
        }
        if (lower.contains("code") || lower.contains("写") || lower.contains("编程") ||
                lower.contains("program") || lower.contains("script") ||
                lower.contains("execute") || lower.contains("执行") ||
                lower.contains("command") || lower.contains("命令") ||
                lower.contains("build") || lower.contains("编译")) {
            routes.add(new AgentRoute("coder", task));
        }
        return routes;
    }

    /**
     * Executes a single sub-agent call and records the result.
     */
    private void executeSubAgent(String taskId, AgentRoute route,
                                 Map<String, String> results,
                                 Map<String, String> errors,
                                 String userLanguage) {
        String agentName = route.agent();
        Instant stepStart = Instant.now();
        log.info("SupervisorAgent[{}]: Dispatching to sub-agent '{}'", taskId, agentName);

        try {
            AgentRegistry.BaseAgentWrapper agent = agentRegistry.getAgent(agentName);
            if (agent == null) {
                log.warn("Agent '{}' not found in registry, skipping", agentName);
                errors.put(agentName, "Agent not registered: " + agentName);
                return;
            }

            String result;
            if (agent instanceof ResearcherAgent researcher) {
                result = researcher.research(route.subtask(), userLanguage);
            } else if (agent instanceof CoderAgent coder) {
                result = coder.writeCode(route.subtask(), userLanguage);
            } else {
                result = "Agent type not supported for direct invocation: " + agent.getClass().getSimpleName();
            }

            results.put(agentName, result);
            long ms = Duration.between(stepStart, Instant.now()).toMillis();
            log.info("SupervisorAgent[{}]: Sub-agent '{}' completed in {}ms", taskId, agentName, ms);

        } catch (Exception e) {
            log.error("SupervisorAgent[{}]: Sub-agent '{}' failed: {}", taskId, agentName, e.getMessage());
            errors.put(agentName, e.getMessage());
        }
    }

    /**
     * Aggregates all sub-agent results into a final response.
     */
    private String aggregateResults(String originalTask, List<AgentRoute> routes,
                                    Map<String, String> results,
                                    Map<String, String> errors,
                                    String userLanguage) {
        boolean isZh = "zh".equalsIgnoreCase(userLanguage);

        String prompt = String.format("""
                You are the supervisor of a multi-agent system. Aggregate the results
                from specialist agents into a single, coherent response.

                Original user task: %s
                Language: %s

                Sub-agent results:
                %s

                Errors (if any):
                %s

                Instructions:
                - Present research findings clearly with any URLs as markdown links.
                - Present code results with the code wrapped in markdown fences.
                - If any agents failed, acknowledge it briefly and provide what was accomplished.
                - Respond in %s.
                - Use markdown formatting throughout.
                - End with a clear conclusion or next-step recommendation.
                - Do NOT call any tools.
                """,
                originalTask,
                isZh ? "Chinese" : "English",
                formatSubAgentResults(results),
                errors.isEmpty() ? "None" : formatSubAgentErrors(errors),
                isZh ? "Chinese" : "English"
        );

        try {
            ChatClient client = buildChatClient();
            AssistantMessage response = client.prompt(new Prompt(new UserMessage(prompt)))
                    .call()
                    .chatResponse()
                    .getResult()
                    .getOutput();
            return response.getText();
        } catch (Exception e) {
            log.error("Aggregation LLM call failed: {}", e.getMessage());
            return fallbackAggregate(results, errors, isZh);
        }
    }

    private String formatSubAgentResults(Map<String, String> results) {
        if (results.isEmpty()) return "No results.";
        StringBuilder sb = new StringBuilder();
        results.forEach((agent, result) -> {
            sb.append("=== Agent: ").append(agent).append(" ===\n");
            sb.append(result).append("\n\n");
        });
        return sb.toString();
    }

    private String formatSubAgentErrors(Map<String, String> errors) {
        if (errors.isEmpty()) return "None";
        StringBuilder sb = new StringBuilder();
        errors.forEach((agent, error) -> {
            sb.append("- ").append(agent).append(": ").append(error).append("\n");
        });
        return sb.toString();
    }

    private String fallbackAggregate(Map<String, String> results,
                                    Map<String, String> errors,
                                    boolean isZh) {
        StringBuilder sb = new StringBuilder();
        sb.append(isZh ? "## 执行结果\n\n" : "## Execution Results\n\n");
        results.forEach((agent, result) -> {
            sb.append("### ").append(agent).append("\n\n").append(result).append("\n\n");
        });
        if (!errors.isEmpty()) {
            sb.append("### ").append(isZh ? "错误" : "Errors").append("\n\n");
            errors.forEach((agent, err) ->
                    sb.append("- **").append(agent).append("**: ").append(err).append("\n"));
        }
        return sb.toString();
    }

    /**
     * Direct supervisor answer for tasks that need no sub-agents.
     */
    private String answerDirectly(String task, String userLanguage) {
        boolean isZh = "zh".equalsIgnoreCase(userLanguage);
        String prompt = String.format(
                "User request: %s\n\nAnswer this question directly in %s. Use markdown formatting. Do NOT call any tools.",
                task, isZh ? "Chinese" : "English");

        try {
            ChatClient client = buildChatClient();
            return client.prompt(new Prompt(new UserMessage(prompt)))
                    .call()
                    .chatResponse()
                    .getResult()
                    .getOutput()
                    .getText();
        } catch (Exception e) {
            log.error("Direct answer failed: {}", e.getMessage());
            return isZh ? "抱歉，处理您的请求时遇到问题。" : "Sorry, I encountered an issue processing your request.";
        }
    }

    private void sendThinking(String message) {
        log.info("SupervisorAgent: {}", message);
    }

    private void sendSafe(SseEmitter emitter, String jsonMessage) {
        try {
            emitter.send(jsonMessage);
        } catch (IOException e) {
            log.warn("Failed to send SSE message: {}", e.getMessage());
        }
    }

    private void completeSafe(SseEmitter emitter) {
        try {
            emitter.send("[DONE]");
            emitter.complete();
        } catch (IOException e) {
            log.warn("Failed to complete SSE: {}", e.getMessage());
        }
    }

    private ChatClient buildChatClient() {
        return ChatClient.builder(chatModel).build();
    }

    private record AgentRoute(String agent, String subtask) {}
}
