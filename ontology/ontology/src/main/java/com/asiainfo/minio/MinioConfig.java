package com.asiainfo.minio;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MinioConfig {

    @Value("${modo.file-upload.minio.address}")
    String endpoint;

    @Value("${modo.file-upload.minio.accessKey}")
    String accessKey;

    @Value("${modo.file-upload.minio.secretKey}")
    String secretKey;

    @Value("${modo.file-upload.minio.defaultBucketName}")
    String bucketName;

    public MinioConfig() {
    }

    @javax.annotation.PostConstruct
    public void logConfig() {
        // 避免泄露密码，仅打印必要信息
        org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(MinioConfig.class);
        logger.info("Minio配置: endpoint={}, bucket={} accessKey={}****", endpoint, bucketName,
                accessKey != null && accessKey.length() > 2 ? accessKey.substring(0, 2) : accessKey);
    }

    public String getEndpoint() {
        return endpoint;
    }

    public String getAccessKey() {
        return accessKey;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public String getBucketName() {
        return bucketName;
    }
}
