package com.xiaohang.jiaiagent.tools;

import cn.hutool.core.io.FileUtil;
import com.xiaohang.jiaiagent.constant.FileConstant;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;

public class FileOperationTool {

    private final String FILE_DIR = FileConstant.FILE_SAVE_DIR + "/file";

    @Tool(description = "Read content from a file")
    public String readFile(@ToolParam(description = "Name of a file to read") String fileName) {
        String filePath = FILE_DIR + "/" + fileName;
        try {
            String content = FileUtil.readUtf8String(filePath);
            return ToolResponse.data("File read successfully", content);
        } catch (Exception e) {
            return ToolResponse.error("Error reading file: " + e.getMessage());
        }
    }

    @Tool(description = "Write content to a file")
    public String writeFile(@ToolParam(description = "Name of the file to write") String fileName,
                            @ToolParam(description = "Content to write to the file") String content) {
        String filePath = FILE_DIR + "/" + fileName;
        try {
            FileUtil.mkdir(FILE_DIR);
            FileUtil.writeUtf8String(content, filePath);
            return ToolResponse.success("File written successfully to: " + filePath);
        } catch (Exception e) {
            return ToolResponse.error("Error writing to file: " + e.getMessage());
        }
    }
}
