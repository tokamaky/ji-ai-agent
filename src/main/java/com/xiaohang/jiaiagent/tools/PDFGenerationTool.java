package com.xiaohang.jiaiagent.tools;

import cn.hutool.core.io.FileUtil;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.xiaohang.jiaiagent.constant.FileConstant;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;

public class PDFGenerationTool {

    /**
     * Path to the bundled CJK-capable TTF font (relative to classpath).
     * Place the file at: src/main/resources/fonts/NotoSansSC-Regular.ttf
     */
    private static final String FONT_RESOURCE_PATH = "fonts/NotoSansSC-Regular.ttf";

    @Tool(description = "Generate a PDF file with given content", returnDirect = false)
    public String generatePDF(
            @ToolParam(description = "Name of the file to save the generated PDF") String fileName,
            @ToolParam(description = "Content to be included in the PDF") String content) {
        String fileDir = FileConstant.FILE_SAVE_DIR + "/pdf";
        String filePath = fileDir + "/" + fileName;
        try {
            FileUtil.mkdir(fileDir);
            try (PdfWriter writer = new PdfWriter(filePath);
                 PdfDocument pdf = new PdfDocument(writer);
                 Document document = new Document(pdf)) {

                PdfFont font = loadEmbeddedFont();
                document.setFont(font);
                document.add(new Paragraph(content));
            }
            return ToolResponse.success("PDF generated successfully to: " + filePath);
        } catch (IOException e) {
            return ToolResponse.error("Error generating PDF: " + e.getMessage());
        }
    }

    /**
     * Load the bundled TTF font and embed it into the PDF.
     * Embedding (EMBEDDED = true) ensures correct rendering on any system
     * regardless of installed fonts — important for Docker/Railway deployments.
     */
    private PdfFont loadEmbeddedFont() throws IOException {
        try (InputStream in = new ClassPathResource(FONT_RESOURCE_PATH).getInputStream()) {
            byte[] fontBytes = in.readAllBytes();
            return PdfFontFactory.createFont(
                    fontBytes,
                    PdfEncodings.IDENTITY_H,
                    PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED
            );
        }
    }
}