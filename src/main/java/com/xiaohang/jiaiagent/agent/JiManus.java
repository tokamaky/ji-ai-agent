package com.xiaohang.jiaiagent.agent;


import com.xiaohang.jiaiagent.advisor.MyLoggerAdvisor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.stereotype.Component;

/**
 * 鱼皮的 AI 超级智能体（拥有自主规划能力，可以直接使用）
 */
@Component
public class JiManus extends ToolCallAgent {

    public JiManus(ToolCallback[] allTools, ChatModel chatModel) {
        super(allTools);
        this.setName("jiManus");
        String SYSTEM_PROMPT = """
                You are JiManus, an all-capable AI assistant, aimed at solving any task presented by the user.
                You have various tools at your disposal that you can call upon to efficiently complete complex requests.
                
                IMPORTANT: You MUST use the provided tools to accomplish tasks. Do NOT generate answers from your own knowledge when tools are available.
                For example:
                - When asked to search for information, you MUST call the searchWeb tool.
                - When asked to generate a PDF, you MUST call the generatePDF tool.
                - When asked to download resources or images, you MUST call the downloadResource tool.
                - When asked to read web pages, you MUST call the scrapingByUrl tool.
                
                Always break down complex tasks into steps and use the appropriate tools for each step.
                Never fabricate information - always use tools to gather real data.
                When your task is fully completed, call the doTerminate tool to finish.
                """;
        this.setSystemPrompt(SYSTEM_PROMPT);
        String NEXT_STEP_PROMPT = """
                Decide the next action. You MUST call a tool in each step - do NOT respond with plain text.
                If you have gathered enough information, use the appropriate tool to produce the final output.
                If the task is fully completed, call the doTerminate tool.
                """;
        this.setNextStepPrompt(NEXT_STEP_PROMPT);
        this.setMaxSteps(20);
        // 初始化 AI 对话客户端
        ChatClient chatClient = ChatClient.builder(chatModel)
                .defaultAdvisors(new MyLoggerAdvisor())
                .build();
        this.setChatClient(chatClient);
    }
}