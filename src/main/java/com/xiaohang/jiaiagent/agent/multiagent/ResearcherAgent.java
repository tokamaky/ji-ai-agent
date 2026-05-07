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
 * A specialist sub-agent dedicated to web research and information gathering.
 *
 * <p>Responsibilities:
 * <ul>
 *   <li>Accept routing tasks from the {@link SupervisorAgent}</li>
 *   <li>Execute web searches, page scraping, and fact-checking via tools</li>
 *   <li>Return structured results to the coordinator</li>
 * </ul>
 *
 * <p>Tool whitelist: {@code searchWeb}, {@code scrapeWebPage}, {@code searchImage}
 *
 * <h2>Messaging contract</h2>
 * <ul>
 *   <li>Receives: REQUEST messages from the supervisor</li>
 *   <li>Sends: RESPONSE messages back to the sender (supervisor / coordinator)</li>
 * </ul>
 */
@Component
public class ResearcherAgent extends ToolCallAgent implements AgentRegistry.BaseAgentWrapper {

    private static final String RESEARCHER_SYSTEM_PROMPT = """
            You are a meticulous Research Specialist. Your sole mission is to gather
            accurate, comprehensive information from the web.

            ## Your tools
            - searchWeb       → real-time Google search (facts, prices, news, reviews)
            - scrapeWebPage   → extract full content from a specific URL (use after searchWeb)
            - searchImage     → find relevant images (via MCP / Pexels)

            ## Workflow
            1. Analyse the research question.
            2. Use searchWeb to find authoritative sources.
            3. Use scrapeWebPage to extract key details from the most relevant URLs.
            4. Synthesise findings into a concise, structured report.
            5. Call doTerminate when your report is ready.

            ## Output rules
            - Respond in the same language as the task.
            - Cite sources with their URLs where possible.
            - Use markdown formatting: headers, bullet points, bold for key facts.
            - Never fabricate URLs or facts.
            """;

    private static final String NEXT_STEP_PROMPT = """
            Review the search / scrape results from the previous step.
            DECISION TREE:
            (a) If results are sufficient, write a synthesis report and call doTerminate.
            (b) If you need more sources, call searchWeb again with a refined query.
            (c) If a specific URL contains the answer, call scrapeWebPage.
            Always respond in the user's language and present URLs as markdown links.
            """;

    public ResearcherAgent(ToolCallback[] allTools,
                           ChatModel chatModel,
                           AgentRegistry agentRegistry) {
        super(filterResearchTools(allTools));
        this.setName("researcher");
        this.setSystemPrompt(RESEARCHER_SYSTEM_PROMPT);
        this.setNextStepPrompt(NEXT_STEP_PROMPT);
        this.setMaxSteps(15);
        ChatClient chatClient = ChatClient.builder(chatModel)
                .defaultAdvisors(new MyLoggerAdvisor())
                .build();
        this.setChatClient(chatClient);

        agentRegistry.register("researcher", this);
    }

    @PostConstruct
    public void init() {
        log.info("ResearcherAgent initialised — maxSteps={}, toolWhitelist={}",
                getMaxSteps(),
                Set.of("searchWeb", "scrapeWebPage", "searchImage"));
    }

    /**
     * Convenience entry point for direct (non-message-queue) invocation.
     */
    public String research(String task, String userLanguage) {
        log.info("ResearcherAgent: Starting research task: {}", task);
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
                .orElse("Research complete.");
    }

    private static ToolCallback[] filterResearchTools(ToolCallback[] allTools) {
        Set<String> allowed = Set.of("searchWeb", "scrapeWebPage", "searchImage", "doTerminate");
        return java.util.Arrays.stream(allTools)
                .filter(t -> allowed.contains(t.getToolDefinition().name()))
                .toArray(ToolCallback[]::new);
    }

    @Override
    public String getName() {
        return "researcher";
    }
}
