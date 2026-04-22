package com.xiaohang.jiaiagent.agent.model;

import cn.hutool.json.JSONUtil;

import java.util.HashMap;
import java.util.Map;

/**
 * SSE 消息格式封装，匹配前端 ManusSSEMessage 接口：
 * { type, content?, toolName?, status?, result?, args?, error? }
 */
public class AgentSSEMessage {

    public static String thinking(String content) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "thinking");
        msg.put("content", content);
        return JSONUtil.toJsonStr(msg);
    }

    public static String toolCall(String toolName, Map<String, Object> args) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "tool_call");
        msg.put("toolName", toolName);
        msg.put("args", args);
        return JSONUtil.toJsonStr(msg);
    }

    public static String toolResult(String toolName, String result) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "tool_result");
        msg.put("toolName", toolName);
        msg.put("result", result);
        return JSONUtil.toJsonStr(msg);
    }

    public static String finalResponse(String content) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "final_response");
        msg.put("content", content);
        return JSONUtil.toJsonStr(msg);
    }

    public static String error(String errorMessage) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "error");
        msg.put("error", errorMessage);
        return JSONUtil.toJsonStr(msg);
    }
}
