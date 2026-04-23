package com.xiaohang.jiaiagent.agent;

import cn.hutool.core.util.StrUtil;
import com.xiaohang.jiaiagent.agent.model.AgentSSEMessage;
import com.xiaohang.jiaiagent.agent.model.AgentState;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * 抽象基础代理类，用于管理代理状态和执行流程。
 * <p>
 * 提供状态转换、内存管理和基于步骤的执行循环的基础功能。
 * 子类必须实现step方法。
 */
@Data
@Slf4j
public abstract class BaseAgent {

    // 核心属性
    private String name;

    // 提示词
    private String systemPrompt;
    private String nextStepPrompt;

    // 代理状态
    private AgentState state = AgentState.IDLE;

    // 执行步骤控制
    private int currentStep = 0;
    private int maxSteps = 10;

    // LLM 大模型
    private ChatClient chatClient;

    // Memory 记忆（需要自主维护会话上下文）
    private List<Message> messageList = new ArrayList<>();

    // SSE 发射器（流式输出时使用）
    private SseEmitter sseEmitter;
    // SSE 连接已关闭标志
    private volatile boolean sseClosed = false;

    /**
     * 向前端发送 SSE 消息（JSON 格式）
     * @throws IllegalStateException 如果 SSE 连接已关闭
     */
    protected void sendSSE(String jsonMessage) {
        // 检查 SSE 是否已标记为关闭
        if (this.sseClosed) {
            log.warn("SSE connection already marked as closed, skipping send");
            throw new IllegalStateException("SSE connection already closed");
        }

        // 检查 sseEmitter 是否存在
        SseEmitter emitter = this.sseEmitter;
        if (emitter == null) {
            log.warn("SSE emitter is null, cannot send");
            throw new IllegalStateException("SSE emitter is null");
        }

        try {
            log.info("SSE SEND: {}", jsonMessage);
            emitter.send(jsonMessage);

            // 发送后再次检查连接状态（如果发送成功，连接应该是打开的）
        } catch (IOException e) {
            // SSE 连接已关闭
            log.warn("SSE connection IO error: {}, marking as closed", e.getMessage());
            this.sseClosed = true;
            this.sseEmitter = null; // 清除引用
            throw new IllegalStateException("SSE connection closed", e);
        } catch (IllegalStateException e) {
            // Spring 可能在内部检测到连接已关闭
            log.warn("SSE connection IllegalStateException: {}, marking as closed", e.getMessage());
            this.sseClosed = true;
            this.sseEmitter = null;
            throw e;
        }
    }

    /**
     * 发送最终响应并标记 SSE 连接为已关闭，用于完成任务后停止执行循环
     * 关键：先标记为已关闭，再发送消息并抛出异常
     *
     * 同时发送 "[DONE]" 标记作为流结束信号，前端在收到此标记后会主动关闭连接，
     * 避免依赖底层 connection close 触发浏览器的自动重连。
     */
    protected void sendFinalResponseAndStop(String content) {
        log.info("Sending final response and marking SSE as closed");
        // 先标记为已关闭，防止后续循环继续
        this.sseClosed = true;
        // 尝试发送最终响应
        if (this.sseEmitter != null) {
            try {
                this.sseEmitter.send(AgentSSEMessage.finalResponse(content));
                // 发送明确的流结束标记（OpenAI 风格的 [DONE] sentinel）
                this.sseEmitter.send("[DONE]");
            } catch (IOException e) {
                log.warn("Failed to send final response (SSE likely closed): {}", e.getMessage());
            } catch (IllegalStateException e) {
                log.warn("SSE already closed when sending final response");
            }
        }
        // 抛出异常以中断执行循环
        throw new IllegalStateException("Final response sent, stopping execution");
    }

    /**
     * 运行代理
     *
     * @param userPrompt 用户提示词
     * @return 执行结果
     */
    public String run(String userPrompt) {
        // 1、基础校验
        if (this.state != AgentState.IDLE) {
            throw new RuntimeException("Cannot run agent from state: " + this.state);
        }
        if (StrUtil.isBlank(userPrompt)) {
            throw new RuntimeException("Cannot run agent with empty user prompt");
        }
        // 2、执行，更改状态
        this.state = AgentState.RUNNING;
        // 记录消息上下文
        messageList.add(new UserMessage(userPrompt));
        // 保存结果列表
        List<String> results = new ArrayList<>();
        try {
            // 执行循环
            for (int i = 0; i < maxSteps && state != AgentState.FINISHED; i++) {
                int stepNumber = i + 1;
                currentStep = stepNumber;
                log.info("Executing step {}/{}", stepNumber, maxSteps);
                // 单步执行
                String stepResult = step();
                String result = "Step " + stepNumber + ": " + stepResult;
                results.add(result);
            }
            // 检查是否超出步骤限制
            if (currentStep >= maxSteps) {
                state = AgentState.FINISHED;
                results.add("Terminated: Reached max steps (" + maxSteps + ")");
            }
            return String.join("\n", results);
        } catch (Exception e) {
            state = AgentState.ERROR;
            log.error("error executing agent", e);
            return "执行错误" + e.getMessage();
        } finally {
            // 3、清理资源
            this.cleanup();
        }
    }

    /**
     * 运行代理（流式输出）
     *
     * @param userPrompt 用户提示词
     * @return 执行结果
     */
    public SseEmitter runStream(String userPrompt) {
        // 创建一个超时时间较长的 SseEmitter
        SseEmitter sseEmitter = new SseEmitter(300000L); // 5 分钟超时
        // 使用线程异步处理，避免阻塞主线程
        CompletableFuture.runAsync(() -> {
            // 1、基础校验
            try {
                if (this.state != AgentState.IDLE) {
                    sseEmitter.send(AgentSSEMessage.error("Cannot run agent from state: " + this.state));
                    sseEmitter.complete();
                    return;
                }
                if (StrUtil.isBlank(userPrompt)) {
                    sseEmitter.send(AgentSSEMessage.error("Cannot run agent with empty prompt"));
                    sseEmitter.complete();
                    return;
                }
            } catch (Exception e) {
                sseEmitter.completeWithError(e);
            }
            // 2、执行，更改状态
            this.state = AgentState.RUNNING;
            this.sseEmitter = sseEmitter;
            // 记录消息上下文
            messageList.add(new UserMessage(userPrompt));
            try {
                // 执行循环
                for (int i = 0; i < maxSteps && state != AgentState.FINISHED && !sseClosed; i++) {
                    // 每次循环开始时检查 SSE 连接状态
                    log.info("Loop iteration {}/{}, sseClosed={}, state={}", i + 1, maxSteps, sseClosed, state);
                    if (sseClosed) {
                        log.info("SSE connection closed (flag check), stopping execution");
                        break;
                    }
                    int stepNumber = i + 1;
                    currentStep = stepNumber;
                    log.info("Executing step {}/{}", stepNumber, maxSteps);
                    // 单步执行（step 内部通过 sendSSE 直接发送消息）
                    try {
                        step();
                    } catch (IllegalStateException e) {
                        // SSE 连接已关闭，停止执行循环
                        log.warn("SSE connection closed during step (exception), stopping execution");
                        break;
                    }
                    // 如果状态已设置为 FINISHED，提前退出循环
                    if (state == AgentState.FINISHED || sseClosed) {
                        log.info("Exiting loop: FINISHED={}, sseClosed={}", state == AgentState.FINISHED, sseClosed);
                        break;
                    }
                }
                // 检查是否超出步骤限制
                if (currentStep >= maxSteps && state != AgentState.FINISHED) {
                    state = AgentState.FINISHED;
                    try {
                        sseEmitter.send(AgentSSEMessage.error("Reached max steps (" + maxSteps + ")"));
                    } catch (IOException ignored) {
                        // SSE connection may already be closed
                    }
                }
                // 正常完成
                try {
                    sseEmitter.complete();
                } catch (Exception e) {
                    log.warn("SSE emitter already completed: {}", e.getMessage());
                }
            } catch (Exception e) {
                state = AgentState.ERROR;
                log.error("error executing agent", e);
                try {
                    sseEmitter.send(AgentSSEMessage.error(e.getMessage()));
                    sseEmitter.complete();
                } catch (IOException ex) {
                    sseEmitter.completeWithError(ex);
                }
            } finally {
                // 3、清理资源
                this.cleanup();
            }
        });

        // 设置超时回调
        sseEmitter.onTimeout(() -> {
            this.state = AgentState.ERROR;
            this.cleanup();
            log.warn("SSE connection timeout");
        });
        // 设置完成回调
        sseEmitter.onCompletion(() -> {
            if (this.state == AgentState.RUNNING) {
                this.state = AgentState.FINISHED;
            }
            this.cleanup();
            log.info("SSE connection completed");
        });
        return sseEmitter;
    }

    /**
     * 定义单个步骤
     *
     * @return
     */
    public abstract String step();

    /**
     * 清理资源
     */
    protected void cleanup() {
        // 子类可以重写此方法来清理资源
    }
}