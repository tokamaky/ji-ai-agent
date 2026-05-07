package com.xiaohang.jiaiagent.agent.multiagent;

import com.xiaohang.jiaiagent.agent.ToolCallAgent;
import com.xiaohang.jiaiagent.advisor.MyLoggerAdvisor;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * A specialist sub-agent dedicated to code generation, file operations, and
 * command execution.
 *
 * <p>Responsibilities:
 * <ul>
 *   <li>Accept routing tasks from the {@link SupervisorAgent}</li>
 *   <li>Read, write, and edit code files via tools</li>
 *   <li>Execute shell commands when required</li>
 *   <li>Return structured results (code snippets, file paths, command output)</li>
 * </ul>
 *
 * <p>Tool whitelist: {@code readFile}, {@code writeFile}, {@code executeTerminalCommand}
 *
 * <h2>Messaging contract</h2>
 * <ul>
 *   <li>Receives: REQUEST messages from the supervisor</li>
 *   <li>Sends: RESPONSE messages back to the sender</li>
 * </ul>
 */
@Component
public class CoderAgent extends ToolCallAgent implements AgentRegistry.BaseAgentWrapper {

    private static final String CODER_SYSTEM_PROMPT = """
            You are an expert Software Engineer. Your mission is to write clean,
            correct, and well-documented code, and to perform file operations
            requested by the supervisor.

            ## Your tools
            - readFile             → read any file from the server
            - writeFile            → write or overwrite a file on the server
            - executeTerminalCommand → run shell commands (git, npm, javac, etc.)

            ## Workflow
            1. Understand the coding task.
            2. Read any relevant existing files before modifying them.
            3. Write the code file(s).
            4. If a build or test step is required, use executeTerminalCommand.
            5. Report the result clearly: file paths, command output, any errors.
            6. Call doTerminate when done.

            ## Quality rules
            - Always include appropriate comments and documentation.
            - Follow language-specific best practices (imports, types, error handling).
            - For executeTerminalCommand: prefer read-only operations; confirm
              destructive commands with the user before executing.
            - Return file paths as markdown links: [filename](path).
            """;

    private static final String NEXT_STEP_PROMPT = """
            Review the previous step's result.
            DECISION TREE:
            (a) If the task is complete (file written, command succeeded), call doTerminate.
            (b) If you need to read an existing file first, call readFile.
            (c) If you need to execute a build/test command, call executeTerminalCommand.
            (d) If the previous command failed, diagnose the error and retry.
            Always present file paths and results in the user's language using markdown.
            """;

    public CoderAgent(ToolCallback[] allTools,
                      ChatModel chatModel,
                      AgentRegistry agentRegistry) {
        super(filterCoderTools(allTools));
        this.setName("coder");
        this.setSystemPrompt(CODER_SYSTEM_PROMPT);
        this.setNextStepPrompt(NEXT_STEP_PROMPT);
        this.setMaxSteps(20);
        ChatClient chatClient = ChatClient.builder(chatModel)
                .defaultAdvisors(new MyLoggerAdvisor())
                .build();
        this.setChatClient(chatClient);

        agentRegistry.register("coder", this);
    }

    @PostConstruct
    public void init() {
        log.info("CoderAgent initialised — maxSteps={}, toolWhitelist={}",
                getMaxSteps(),
                Set.of("readFile", "writeFile", "executeTerminalCommand"));
    }

    /**
     * Convenience entry point for direct (non-message-queue) invocation.
     */
    public String writeCode(String task, String userLanguage) {
        log.info("CoderAgent: Starting coding task: {}", task);
        try {
            return run(task);
        } catch (IllegalStateException e) {
            if ("Final response sent, stopping execution".equals(e.getMessage())) {
                return extractFinalContent();
            }
            throw e;
        }
    }

    private String extractFinalContent() {
        return getMessageList().stream()
                .filter(m -> m instanceof org.springframework.ai.chat.messages.AssistantMessage am && am.getText() != null)
                .map(m -> ((org.springframework.ai.chat.messages.AssistantMessage) m).getText())
                .reduce((a, b) -> b)
                .orElse("Coding task complete.");
    }

    private static ToolCallback[] filterCoderTools(ToolCallback[] allTools) {
        Set<String> allowed = Set.of("readFile", "writeFile", "executeTerminalCommand", "doTerminate");
        return java.util.Arrays.stream(allTools)
                .filter(t -> allowed.contains(t.getToolDefinition().name()))
                .toArray(ToolCallback[]::new);
    }

    @Override
    public String getName() {
        return "coder";
    }
}
