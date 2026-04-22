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
                
                When the user asks you to perform a task that requires tools (searching, downloading, generating files, etc.),
                break down the task into steps and use the appropriate tools for each step.
                
                For simple greetings or questions that don't require tools, you may respond directly with text.
                When your task is fully completed, call the doTerminate tool to finish.
                """;
        this.setSystemPrompt(SYSTEM_PROMPT);
        String NEXT_STEP_PROMPT = """
                Based on the user's original request and the results so far, decide what to do next.
                If there are remaining steps to complete the user's task, call the appropriate tool.
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