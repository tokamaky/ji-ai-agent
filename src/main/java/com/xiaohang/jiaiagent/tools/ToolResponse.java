package com.xiaohang.jiaiagent.tools;

import cn.hutool.json.JSONUtil;

import java.util.HashMap;
import java.util.Map;

/**
 * 工具返回值包装器 —— 保证返回合法 JSON 字符串，
 * 避免 VertexAiGeminiChatModel.jsonToStruct 解析失败。
 */
public class ToolResponse {

    public static String success(String message) {
        Map<String, Object> map = new HashMap<>();
        map.put("status", "success");
        map.put("message", message);
        return JSONUtil.toJsonStr(map);
    }

    public static String error(String message) {
        Map<String, Object> map = new HashMap<>();
        map.put("status", "error");
        map.put("message", message);
        return JSONUtil.toJsonStr(map);
    }

    public static String data(String message, Object data) {
        Map<String, Object> map = new HashMap<>();
        map.put("status", "success");
        map.put("message", message);
        map.put("data", data);
        return JSONUtil.toJsonStr(map);
    }
}
