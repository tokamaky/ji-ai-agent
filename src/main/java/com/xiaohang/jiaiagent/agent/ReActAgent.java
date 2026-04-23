package com.xiaohang.jiaiagent.agent;

import com.xiaohang.jiaiagent.agent.model.AgentState;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.Message;

import java.util.List;

/**
 * ReAct (Reasoning and Acting) 模式的代理抽象类
 * 实现了思考-行动的循环模式
 */
@EqualsAndHashCode(callSuper = true)
@Data
@Slf4j
public abstract class ReActAgent extends BaseAgent {

    /**
     * 处理当前状态并决定下一步行动
     *
     * @return 是否需要执行行动，true表示需要执行，false表示不需要执行
     */
    public abstract boolean think();

    /**
     * 执行决定的行动
     *
     * @return 行动执行结果
     */
    public abstract String act();

    /**
     * 执行单个步骤：思考和行动
     *
     * @return 步骤执行结果
     */
    @Override
    public String step() {
        try {
            // 先思考
            boolean shouldAct = think();
            if (!shouldAct) {
                // 无需行动时，如果状态已经是 FINISHED（由子类处理），则不重复发送 final_response
                // 注意：子类通过 sendFinalResponseAndStop 已经在 think() 中发送了最终响应
                if (getState() == AgentState.FINISHED) {
                    log.info("Agent state already FINISHED after think(), skipping duplicate final_response");
                    return "任务已完成";
                }
                // 否则获取最后一条助手消息作为最终回复
                List<Message> messages = getMessageList();
                String lastContent = "";
                for (int i = messages.size() - 1; i >= 0; i--) {
                    if (messages.get(i) instanceof org.springframework.ai.chat.messages.AssistantMessage am) {
                        lastContent = am.getText();
                        break;
                    }
                }
                String response = lastContent != null && !lastContent.isEmpty() ? lastContent : "思考完成";
                sendSSE(com.xiaohang.jiaiagent.agent.model.AgentSSEMessage.finalResponse(response));
                return response;
            }
            // 再行动（act 内部会通过 sendSSE 发送 tool_call 和 tool_result）
            return act();
        } catch (IllegalStateException e) {
            // SSE 连接已关闭，可能是正常的结束信号，重新抛出以中断循环
            log.warn("SSE connection closed during step (IllegalStateException): {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            try {
                sendSSE(com.xiaohang.jiaiagent.agent.model.AgentSSEMessage.error("步骤执行失败：" + e.getMessage()));
            } catch (IllegalStateException sseError) {
                // SSE 已关闭，忽略
            }
            return "步骤执行失败：" + e.getMessage();
        }
    }

}