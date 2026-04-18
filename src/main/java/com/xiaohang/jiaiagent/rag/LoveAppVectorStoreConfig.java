package com.xiaohang.jiaiagent.rag;

import jakarta.annotation.Resource;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * 恋爱大师向量数据库配置（初始化基于内存的向量数据库 Bean）
 */
@Configuration
public class LoveAppVectorStoreConfig {

    @Resource
    private LoveAppDocumentLoader loveAppDocumentLoader;

    @Resource
    private MyKeywordEnricher myKeywordEnricher;

    @Bean
    VectorStore loveAppVectorStore(EmbeddingModel embeddingModel) {
        // 把 dashscopeEmbeddingModel 改成 embeddingModel
        SimpleVectorStore simpleVectorStore = SimpleVectorStore.builder(embeddingModel).build();
        // 加载文档
        List<Document> documentList = loveAppDocumentLoader.loadMarkdowns();
        // 自动补充关键词元信息
        List<Document> enrichedDocuments = myKeywordEnricher.enrichDocuments(documentList);
        //simpleVectorStore.add(enrichedDocuments);
        return simpleVectorStore;
    }
}