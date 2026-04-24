package com.xiaohang.jiaiagent.agent;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import com.xiaohang.jiaiagent.agent.model.AgentSSEMessage;
import com.xiaohang.jiaiagent.agent.model.AgentState;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.ToolResponseMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.model.tool.ToolCallingManager;
import org.springframework.ai.model.tool.ToolExecutionResult;
import org.springframework.ai.tool.ToolCallback;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 处理工具调用的基础代理类，具体实现了 think 和 act 方法，可以用作创建实例的父类
 */
@EqualsAndHashCode(callSuper = true)
@Data
@Slf4j
public class ToolCallAgent extends ReActAgent {

    // 可用的工具
    private final ToolCallback[] availableTools;

    // 保存工具调用信息的响应结果（要调用那些工具）
    private ChatResponse toolCallChatResponse;

    // 工具调用管理者
    private final ToolCallingManager toolCallingManager;

    // 禁用 Spring AI 内置的工具调用机制，自己维护选项和消息上下文
    private final ChatOptions chatOptions;

    //
    private int noToolCallCount = 0;
    private static final int MAX_NO_TOOL_CALLS = 3;

    /** 记录每次 think 产生的最新一条非空思考文本，用于终止时作为最终回复 */
    private String lastThinkingText = "";

    public ToolCallAgent(ToolCallback[] availableTools) {
        super();
        this.availableTools = availableTools;
        this.toolCallingManager = ToolCallingManager.builder().build();
        // 禁用 Spring AI 内置的工具调用机制，自己维护选项和消息上下文
        this.chatOptions = GoogleGenAiChatOptions.builder()
                .internalToolExecutionEnabled(false)
                .build();
    }

    /**
     * 处理当前状态并决定下一步行动
     *
     * @return 是否需要执行行动
     */
    @Override
    public boolean think() {
        // 1、只在第二步及之后添加下一步提示词
        if (getCurrentStep() > 1 && StrUtil.isNotBlank(getNextStepPrompt())) {
            getMessageList().add(new UserMessage("[INSTRUCTION] " + getNextStepPrompt()));
        }
        // 2、调用 AI 大模型，获取工具调用结果
        List<Message> messageList = getMessageList();
        Prompt prompt = new Prompt(messageList, this.chatOptions);
        try {
            ChatResponse chatResponse = getChatClient().prompt(prompt)
                    .system(getSystemPrompt())
                    .toolCallbacks(availableTools)
                    .call()
                    .chatResponse();
            this.toolCallChatResponse = chatResponse;
            // 3、解析工具调用结果
            AssistantMessage assistantMessage = chatResponse.getResult().getOutput();
            List<AssistantMessage.ToolCall> toolCallList = assistantMessage.getToolCalls();
            String thinkingText = assistantMessage.getText();
            log.info(getName() + "选择了 " + toolCallList.size() + " 个工具来使用");

            // 记录思考文本（用于后续可能的最终回复）
            if (StrUtil.isNotBlank(thinkingText)) {
                lastThinkingText = thinkingText;
            }

            String toolCallInfo = toolCallList.stream()
                    .map(toolCall -> String.format("工具名称：%s，参数：%s", toolCall.name(), toolCall.arguments()))
                    .collect(Collectors.joining("\n"));
            log.info(toolCallInfo);

            if (toolCallList.isEmpty()) {
                getMessageList().add(assistantMessage);
                if (getCurrentStep() <= 1) {
                    setState(AgentState.FINISHED);
                    // 使用 sendFinalResponseAndStop 来发送最终响应并标记 SSE 为已关闭
                    String content = StrUtil.isNotBlank(thinkingText) ? thinkingText : "任务完成";
                    sendFinalResponseAndStop(content);
                    return false; // 不会执行到这里
                }
                noToolCallCount++;
                if (noToolCallCount >= MAX_NO_TOOL_CALLS) {
                    log.warn("连续 {} 次未调用工具，强制终止", MAX_NO_TOOL_CALLS);
                    setState(AgentState.FINISHED);
                }
                return false;
            } else {
                noToolCallCount = 0;
                // 发送每个工具调用信息到前端（跳过 doTerminate）
                for (AssistantMessage.ToolCall toolCall : toolCallList) {
                    if ("doTerminate".equals(toolCall.name())) {
                        continue;
                    }
                    try {
                        cn.hutool.json.JSONObject argsJson = cn.hutool.json.JSONUtil.parseObj(toolCall.arguments());
                        sendSSE(AgentSSEMessage.toolCall(toolCall.name(), argsJson));
                    } catch (Exception e) {
                        java.util.Map<String, Object> argsMap = new java.util.HashMap<>();
                        argsMap.put("raw", toolCall.arguments());
                        sendSSE(AgentSSEMessage.toolCall(toolCall.name(), argsMap));
                    }
                }
                return true;
            }
        } catch (IllegalStateException e) {
            // SSE 连接已关闭，重新抛出以中断循环
            log.warn("SSE connection closed during think, re-throwing: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error(getName() + "的思考过程遇到了问题：" + e.getMessage());
            try {
                sendSSE(AgentSSEMessage.error("思考过程出错：" + e.getMessage()));
            } catch (IllegalStateException sseError) {
                // SSE 已关闭，忽略
            }
            setState(AgentState.FINISHED);
            return false;
        }
    }

    @Override
    public String act() {
        try {
            if (!toolCallChatResponse.hasToolCalls()) {
                sendSSE(AgentSSEMessage.finalResponse("没有工具需要调用"));
                return "没有工具需要调用";
            }
            // 调用工具
            Prompt prompt = new Prompt(getMessageList(), this.chatOptions);
            ToolExecutionResult toolExecutionResult = toolCallingManager.executeToolCalls(prompt, toolCallChatResponse);
            setMessageList(toolExecutionResult.conversationHistory());
            ToolResponseMessage toolResponseMessage = (ToolResponseMessage) CollUtil.getLast(toolExecutionResult.conversationHistory());

            // 判断是否调用了终止工具
            boolean terminateToolCalled = toolResponseMessage.getResponses().stream()
                    .anyMatch(response -> response.name().equals("doTerminate"));

            // 发送每个工具的执行结果到前端（跳过 doTerminate 本身）
            for (ToolResponseMessage.ToolResponse response : toolResponseMessage.getResponses()) {
                log.info("工具 " + response.name() + " 返回的结果：" + response.responseData());
                if (!"doTerminate".equals(response.name())) {
                    sendSSE(AgentSSEMessage.toolResult(response.name(), response.responseData()));
                }
            }

            if (terminateToolCalled) {
                setState(AgentState.FINISHED);
                // 任务结束时，如果已经有过思考内容，直接用最后一次思考作为最终回复；
                // 否则才调用 AI 生成总结
                if (StrUtil.isNotBlank(lastThinkingText)) {
                    sendSSE(AgentSSEMessage.finalResponse(lastThinkingText));
                } else {
                    generateFinalSummary();
                }
            }

            return "工具执行完成";
        } catch (IllegalStateException e) {
            // SSE 连接已关闭，重新抛出以中断循环
            log.warn("SSE connection closed during act, re-throwing: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * 任务结束时，让 AI 根据所有上下文生成一段用户友好的总结
     * 仅在整个对话过程中 AI 没有产生过思考文本时调用
     */
    private void generateFinalSummary() {
        try {
            getMessageList().add(new UserMessage(
                    "[INSTRUCTION] The task is now complete. Please provide a concise, helpful summary of the results in the user's language. Do NOT call any tools."
            ));
            ChatResponse summaryResponse = getChatClient()
                    .prompt(new Prompt(getMessageList()))
                    .system(getSystemPrompt())
                    .call()
                    .chatResponse();
            String summary = summaryResponse.getResult().getOutput().getText();
            if (StrUtil.isNotBlank(summary)) {
                log.info(getName() + "的最终总结：" + summary);
                sendSSE(AgentSSEMessage.finalResponse(summary));
            }
        } catch (IllegalStateException e) {
            // SSE 已关闭，忽略
            log.warn("SSE connection closed during generateFinalSummary");
        } catch (Exception e) {
            log.warn("生成最终总结失败：" + e.getMessage());
        }
    }
}