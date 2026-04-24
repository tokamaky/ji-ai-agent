package com.xiaohang.jiaiagent.agent;


import com.xiaohang.jiaiagent.advisor.MyLoggerAdvisor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 鱼皮的 AI 超级智能体（拥有自主规划能力，可以直接使用）
 */
@Component
public class JiManus extends ToolCallAgent {

    public JiManus(ToolCallback[] allTools,
                   ChatModel chatModel,
                   @Value("${app.prompts.manus.system}") String systemPrompt,
                   @Value("${app.prompts.manus.next-step}") String nextStepPrompt) {
        super(allTools);
        this.setName("jiManus");
        this.setSystemPrompt(systemPrompt);
        this.setNextStepPrompt(nextStepPrompt);
        this.setMaxSteps(20);
        ChatClient chatClient = ChatClient.builder(chatModel)
                .defaultAdvisors(new MyLoggerAdvisor())
                .build();
        this.setChatClient(chatClient);
    }
}