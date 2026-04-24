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
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;

@Slf4j
public class PDFGenerationTool {

    /**
     * Path to the bundled CJK-capable TTF font (relative to classpath).
     * Place the file at: src/main/resources/fonts/NotoSansSC-Regular.ttf
     */
    private static final String FONT_RESOURCE_PATH = "fonts/NotoSansCJKsc-Regular.otf";

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
            log.info("PDF generated successfully: {}", filePath);
            return ToolResponse.success("PDF generated successfully. Download URL: /api/files/pdf/" + fileName);
        } catch (Exception e) {
            // Log the FULL stack trace so we can see exactly what failed
            log.error("PDF generation failed for file: {}", filePath, e);
            return ToolResponse.error("Error generating PDF: "
                    + e.getClass().getSimpleName() + " - " + e.getMessage());
        }
    }

    /**
     * Load the bundled TTF font and embed it into the PDF.
     */
    private PdfFont loadEmbeddedFont() throws IOException {
        ClassPathResource resource = new ClassPathResource(FONT_RESOURCE_PATH);

        // Loud diagnostics: prove whether the resource can be located at all
        URL url = this.getClass().getClassLoader().getResource(FONT_RESOURCE_PATH);
        log.info("Looking for font at classpath: {} | exists={} | url={}",
                FONT_RESOURCE_PATH, resource.exists(), url);

        if (!resource.exists()) {
            throw new IOException(
                    "Font file NOT found on classpath: " + FONT_RESOURCE_PATH +
                            ". Make sure NotoSansSC-Regular.ttf is at " +
                            "src/main/resources/fonts/ and `mvn clean compile` has been run."
            );
        }

        try (InputStream in = resource.getInputStream()) {
            byte[] fontBytes = in.readAllBytes();
            log.info("Font loaded, size = {} bytes", fontBytes.length);
            return PdfFontFactory.createFont(
                    fontBytes,
                    PdfEncodings.IDENTITY_H,
                    PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED
            );
        }
    }
}