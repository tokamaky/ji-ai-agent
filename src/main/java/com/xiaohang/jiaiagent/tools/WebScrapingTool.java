package com.xiaohang.jiaiagent.tools;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;

public class WebScrapingTool {

    @Tool(description = "Scrape the content of a web page")
    public String scrapeWebPage(@ToolParam(description = "URL of the web page to scrape") String url) {
        try {
            Document document = Jsoup.connect(url).get();
            // Limit content length to avoid overly large responses
            String text = document.text();
            if (text.length() > 5000) {
                text = text.substring(0, 5000) + "... (truncated)";
            }
            return ToolResponse.data("Web page scraped successfully from: " + url, text);
        } catch (Exception e) {
            return ToolResponse.error("Error scraping web page: " + e.getMessage());
        }
    }
}
