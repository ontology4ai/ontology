package com.asiainfo.serivce;

import com.asiainfo.minio.MinioConfig;
import com.asiainfo.vo.minio.MinioDirectoryEntryVo;
import com.asiainfo.vo.minio.MinioFileAttrVo;
import io.minio.GetObjectArgs;
import io.minio.GetObjectResponse;
import io.minio.ListObjectsArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.Result;
import io.minio.StatObjectArgs;
import io.minio.StatObjectResponse;
import io.minio.errors.ErrorResponseException;
import io.minio.errors.InsufficientDataException;
import io.minio.errors.InternalException;
import io.minio.errors.InvalidResponseException;
import io.minio.errors.ServerException;
import io.minio.errors.XmlParserException;
import io.minio.messages.Item;
import io.minio.RemoveObjectArgs;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * @Author luchao
 * @Date 2025/8/19
 * @Description Minio 文件代理服务
 */
@Service
@Slf4j
public class MinioProxyService {

    private static final String ONTOLOGY_ROOT_PREFIX = "ontology";
    private static final String PATH_DELIMITER = "/";
    private static final String DIRECTORY_PLACEHOLDER = ".placeholder";

    private final MinioConfig minioConfig;

    private volatile MinioClient minioClient;

    public MinioProxyService(MinioConfig minioConfig) {
        this.minioConfig = minioConfig;
    }

    private MinioClient getClient() {
        if (Objects.isNull(minioClient)) {
            synchronized (this) {
                if (Objects.isNull(minioClient)) {
                    minioClient = MinioClient.builder()
                            .endpoint(minioConfig.getEndpoint())
                            .credentials(minioConfig.getAccessKey(), minioConfig.getSecretKey())
                            .build();
                }
            }
        }
        return minioClient;
    }

    /**
     * 获取绑定在“/ontology/{teamId}/{ontologyName}/”路径下的文件
     *
     * @param teamId        团队 ID
     * @param ontologyName  本体英文名
     * @param filePath      文件相对路径（包含文件名）
     * @param bucketName    自定义桶名，允许为空使用默认桶
     * @return MinioFileObject
     */
    public MinioFileObject getOntologyFile(String teamId, String ontologyName, String filePath, String bucketName) {
        String prefix = buildOntologyPrefix(teamId, ontologyName);
        String normalizedPath = normalizeRelativePath(filePath);
        String objectName = prefix + normalizedPath;
        return getFileObject(bucketName, objectName);
    }

    /**
     * 查询绑定路径下指定文件的属性
     */
    public MinioFileAttrVo getOntologyFileAttr(String teamId, String ontologyName, String filePath, String bucketName) {
        String prefix = buildOntologyPrefix(teamId, ontologyName);
        String normalizedPath = normalizeRelativePath(filePath);
        String objectName = prefix + normalizedPath;
        return getFileAttr(bucketName, objectName);
    }

    /**
     * 获取 Minio 文件流及元数据
     *
     * @param bucketName 桶名，允许为空（默认配置）
     * @param objectName 对象路径
     * @return MinioFileObject
     */
    public MinioFileObject getFileObject(String bucketName, String objectName) {
        if (StringUtils.isBlank(objectName)) {
            throw new IllegalArgumentException("对象路径不能为空");
        }
        final String finalBucket = StringUtils.defaultIfBlank(bucketName, minioConfig.getBucketName());
        try {
            StatObjectArgs statArgs = StatObjectArgs.builder()
                    .bucket(finalBucket)
                    .object(objectName)
                    .build();
            StatObjectResponse stat = getClient().statObject(statArgs);

            GetObjectArgs getArgs = GetObjectArgs.builder()
                    .bucket(finalBucket)
                    .object(objectName)
                    .build();
            GetObjectResponse response = getClient().getObject(getArgs);

            String contentType = StringUtils.defaultIfBlank(stat.contentType(), MediaType.APPLICATION_OCTET_STREAM_VALUE);
            long fileSize = stat.size();
            Map<String, String> userMetadata = stat.userMetadata();
            return new MinioFileObject(objectName, finalBucket, contentType, fileSize, response,
                    userMetadata == null ? Collections.emptyMap() : userMetadata);
        } catch (ErrorResponseException e) {
            // 业务可感知的错误，例如文件不存在
            log.warn("获取 Minio 文件失败，对象不存在。bucket={}, object={}", finalBucket, objectName, e);
            throw new MinioFileNotFoundException(String.format("Minio 中不存在对象：%s", objectName), e);
        } catch (InsufficientDataException | InternalException | InvalidResponseException | NoSuchAlgorithmException
                 | XmlParserException | IOException | InvalidKeyException | ServerException e) {
            log.error("获取 Minio 文件失败，bucket={}, object={}", finalBucket, objectName, e);
            throw new MinioProxyException("获取 Minio 文件失败，请稍后重试", e);
        }
    }

    /**
     * 获取 Minio 对象属性
     */
    public MinioFileAttrVo getFileAttr(String bucketName, String objectName) {
        if (StringUtils.isBlank(objectName)) {
            throw new IllegalArgumentException("对象路径不能为空");
        }
        final String finalBucket = StringUtils.defaultIfBlank(bucketName, minioConfig.getBucketName());
        try {
            StatObjectResponse stat = getClient().statObject(StatObjectArgs.builder()
                    .bucket(finalBucket)
                    .object(objectName)
                    .build());
            return MinioFileAttrVo.fromStat(objectName, finalBucket, stat);
        } catch (ErrorResponseException e) {
            log.warn("获取 Minio 对象属性失败，对象不存在。bucket={}, object={}", finalBucket, objectName, e);
            throw new MinioFileNotFoundException(String.format("Minio 中不存在对象：%s", objectName), e);
        } catch (InsufficientDataException | InternalException | InvalidResponseException | NoSuchAlgorithmException
                 | XmlParserException | IOException | InvalidKeyException | ServerException e) {
            log.error("获取 Minio 对象属性失败，bucket={}, object={}", finalBucket, objectName, e);
            throw new MinioProxyException("获取文件属性失败，请稍后重试", e);
        }
    }

    /**
     * 保存文件到 Minio
     *
     * @param teamId        团队 ID
     * @param ontologyName  本体英文名
     * @param filePath      文件保存路径（包含文件名）
     * @param inputStream   文件输入流
     * @param size          文件大小
     * @param bucketName    桶名
     * @param contentType   内容类型
     * @param metadata      自定义元数据
     */
    public void saveOntologyFile(String teamId,
                                 String ontologyName,
                                 String filePath,
                                 InputStream inputStream,
                                 long size,
                                 String bucketName,
                                 String contentType,
                                 Map<String, String> metadata) {
        if (inputStream == null) {
            throw new IllegalArgumentException("文件流不能为空");
        }
        if (size < 0) {
            throw new IllegalArgumentException("文件大小非法");
        }
        String prefix = buildOntologyPrefix(teamId, ontologyName);
        String normalizedPath = normalizeRelativePath(filePath);
        if (normalizedPath.endsWith(PATH_DELIMITER)) {
            throw new IllegalArgumentException("文件路径不能以 / 结尾");
        }
        String objectName = prefix + normalizedPath;
        final String finalBucket = StringUtils.defaultIfBlank(bucketName, minioConfig.getBucketName());
        try {
            PutObjectArgs.Builder builder = PutObjectArgs.builder()
                    .bucket(finalBucket)
                    .object(objectName)
                    .stream(inputStream, size, -1);
            if (StringUtils.isNotBlank(contentType)) {
                builder.contentType(contentType);
            }
            if (metadata != null && !metadata.isEmpty()) {
                builder.userMetadata(metadata);
            }
            getClient().putObject(builder.build());
        } catch (ErrorResponseException e) {
            log.warn("上传 Minio 文件失败，对象={}/{}", finalBucket, objectName, e);
            throw new MinioProxyException("上传文件失败：" + e.errorResponse().message(), e);
        } catch (InsufficientDataException | InternalException | InvalidResponseException | NoSuchAlgorithmException
                 | XmlParserException | IOException | InvalidKeyException | ServerException e) {
            log.error("上传 Minio 文件失败，对象={}/{}", finalBucket, objectName, e);
            throw new MinioProxyException("上传文件失败，请稍后重试", e);
        }
    }

    /**
     * 创建目录（通过写入0字节的占位对象实现）
     */
    public void createOntologyDirectory(String teamId,
                                        String ontologyName,
                                        String directoryPath,
                                        String bucketName) {
        String normalizedDir = normalizeDirectoryPath(directoryPath);
        if (StringUtils.isBlank(normalizedDir)) {
            throw new IllegalArgumentException("目录路径不能为空");
        }
        String effectiveBucket = StringUtils.defaultIfBlank(bucketName, minioConfig.getBucketName());
        log.info("Minio createDir 调用配置: endpoint={}, bucket={}, accessKey={}, secretKey={}",
                minioConfig.getEndpoint(),
                effectiveBucket,
                maskValue(minioConfig.getAccessKey()),
                maskValue(minioConfig.getSecretKey()));
        String prefix = buildOntologyPrefix(teamId, ontologyName);
        String dirPrefix = prefix + normalizedDir;
        if (!dirPrefix.endsWith(PATH_DELIMITER)) {
            dirPrefix = dirPrefix + PATH_DELIMITER;
        }
        String placeholderObject = dirPrefix + DIRECTORY_PLACEHOLDER;

        final String finalBucket = effectiveBucket;
        try (ByteArrayInputStream emptyStream = new ByteArrayInputStream(new byte[0])) {
            PutObjectArgs.Builder builder = PutObjectArgs.builder()
                    .bucket(finalBucket)
                    .object(placeholderObject)
                    .stream(emptyStream, 0, -1)
                    .contentType("application/octet-stream");
            log.info("Minio createDir putObject 参数: bucket={}, object={}, contentType={}",
                    finalBucket, placeholderObject, "application/octet-stream");
            getClient().putObject(builder.build());
            log.info("Minio createDir putObject 成功: bucket={}, object={}", finalBucket, placeholderObject);
        } catch (ErrorResponseException e) {
            log.warn("创建 Minio 目录失败，对象={}/{}", finalBucket, placeholderObject, e);
            throw new MinioProxyException("创建目录失败：" + e.errorResponse().message(), e);
        } catch (InsufficientDataException | InternalException | InvalidResponseException | NoSuchAlgorithmException
                 | XmlParserException | IOException | InvalidKeyException | ServerException e) {
            log.error("创建 Minio 目录失败，对象={}/{}", finalBucket, placeholderObject, e);
            throw new MinioProxyException("创建目录失败，请稍后重试", e);
        }
    }

    /**
     * 删除文件
     */
    public void deleteOntologyFile(String teamId,
                                   String ontologyName,
                                   String filePath,
                                   String bucketName) {
        String prefix = buildOntologyPrefix(teamId, ontologyName);
        String normalizedPath = normalizeRelativePath(filePath);
        String objectName = prefix + normalizedPath;
        final String finalBucket = StringUtils.defaultIfBlank(bucketName, minioConfig.getBucketName());
        removeObjectInternal(finalBucket, objectName, false);
    }

    /**
     * 删除目录（递归删除目录下所有对象）
     */
    public void deleteOntologyDirectory(String teamId,
                                        String ontologyName,
                                        String directoryPath,
                                        String bucketName) {
        String normalizedDir = normalizeDirectoryPath(directoryPath);
        if (StringUtils.isBlank(normalizedDir)) {
            throw new IllegalArgumentException("目录路径不能为空");
        }
        String prefix = buildOntologyPrefix(teamId, ontologyName);
        String targetPrefix = prefix + normalizedDir;
        if (!targetPrefix.endsWith(PATH_DELIMITER)) {
            targetPrefix = targetPrefix + PATH_DELIMITER;
        }
        final String finalBucket = StringUtils.defaultIfBlank(bucketName, minioConfig.getBucketName());
        List<String> objects = new ArrayList<>();
        try {
            Iterable<Result<Item>> results = getClient().listObjects(
                    ListObjectsArgs.builder()
                            .bucket(finalBucket)
                            .prefix(targetPrefix)
                            .recursive(true)
                            .build());
            for (Result<Item> result : results) {
                Item item = result.get();
                objects.add(item.objectName());
            }
        } catch (ErrorResponseException e) {
            log.warn("列举目录内容失败，对象不存在。bucket={}, prefix={}", finalBucket, targetPrefix, e);
            throw new MinioFileNotFoundException(String.format("Minio 中不存在目录：%s", targetPrefix), e);
        } catch (InsufficientDataException | InternalException | InvalidResponseException | NoSuchAlgorithmException
                 | XmlParserException | IOException | InvalidKeyException | ServerException e) {
            log.error("列举目录内容失败，bucket={}, prefix={}", finalBucket, targetPrefix, e);
            throw new MinioProxyException("删除目录失败，请稍后重试", e);
        }

        if (objects.isEmpty()) {
            throw new MinioFileNotFoundException(String.format("Minio 中不存在目录：%s", targetPrefix), null);
        }

        // 逐个删除目录下的对象
        for (String objectName : objects) {
            removeObjectInternal(finalBucket, objectName, false);
        }
        log.info("Minio deleteDir 已删除对象数量: bucket={}, prefix={}, removed={}", finalBucket, targetPrefix, objects.size());
    }

    public List<String> listBucketObjects(String bucketName) {
        final String finalBucket = StringUtils.defaultIfBlank(bucketName, minioConfig.getBucketName());
        List<String> objectNames = new ArrayList<>();
        try {
            Iterable<Result<Item>> results = getClient().listObjects(
                    ListObjectsArgs.builder()
                            .bucket(finalBucket)
                            .recursive(true)
                            .build());
            for (Result<Item> result : results) {
                Item item = result.get();
                objectNames.add(item.objectName());
            }
            log.info("Minio listBucketObjects 成功: bucket={}, count={}", finalBucket, objectNames.size());
            return objectNames;
        } catch (ErrorResponseException e) {
            log.warn("列举 Minio 桶失败，对象不存在。bucket={}", finalBucket, e);
            throw new MinioProxyException("列举桶对象失败：" + e.errorResponse().message(), e);
        } catch (InsufficientDataException | InternalException | InvalidResponseException | NoSuchAlgorithmException
                 | XmlParserException | IOException | InvalidKeyException | ServerException e) {
            log.error("列举 Minio 桶失败，bucket={}", finalBucket, e);
            throw new MinioProxyException("列举桶对象失败，请稍后重试", e);
        }
    }

    public void uploadObject(String bucketName,
                             String objectPath,
                             InputStream inputStream,
                             long size,
                             String contentType,
                             Map<String, String> metadata) {
        if (inputStream == null) {
            throw new IllegalArgumentException("文件流不能为空");
        }
        if (size < 0) {
            throw new IllegalArgumentException("文件大小非法");
        }
        String normalizedObject = normalizeObjectPath(objectPath);
        if (StringUtils.isBlank(normalizedObject)) {
            throw new IllegalArgumentException("对象路径不能为空");
        }
        final String finalBucket = StringUtils.defaultIfBlank(bucketName, minioConfig.getBucketName());
        try {
            PutObjectArgs.Builder builder = PutObjectArgs.builder()
                    .bucket(finalBucket)
                    .object(normalizedObject)
                    .stream(inputStream, size, -1);
            if (StringUtils.isNotBlank(contentType)) {
                builder.contentType(contentType);
            }
            if (metadata != null && !metadata.isEmpty()) {
                builder.userMetadata(metadata);
            }
            log.info("Minio uploadObject 参数: bucket={}, object={}, contentType={}", finalBucket, normalizedObject, contentType);
            getClient().putObject(builder.build());
            log.info("Minio uploadObject 成功: bucket={}, object={}", finalBucket, normalizedObject);
        } catch (ErrorResponseException e) {
            log.warn("上传 Minio 对象失败，对象={}/{}", finalBucket, normalizedObject, e);
            throw new MinioProxyException("上传对象失败：" + e.errorResponse().message(), e);
        } catch (InsufficientDataException | InternalException | InvalidResponseException | NoSuchAlgorithmException
                 | XmlParserException | IOException | InvalidKeyException | ServerException e) {
            log.error("上传 Minio 对象失败，对象={}/{}", finalBucket, normalizedObject, e);
            throw new MinioProxyException("上传对象失败，请稍后重试", e);
        }
    }

    /**
     * 获取指定目录下的文件与子目录列表（只返回一级）
     *
     * @param teamId       团队 ID
     * @param ontologyName 本体英文名
     * @param directory    目标目录，允许为空表示根目录
     * @param bucketName   自定义桶名
     * @return 目录项列表
     */
    public List<MinioDirectoryEntryVo> listOntologyDirectory(String teamId, String ontologyName, String directory, String bucketName) {
        String prefix = buildOntologyPrefix(teamId, ontologyName);
        String normalizedDir = normalizeDirectoryPath(directory);

        String targetPrefix = prefix;
        if (StringUtils.isNotBlank(normalizedDir)) {
            targetPrefix = prefix + normalizedDir + PATH_DELIMITER;
        }

        final String finalBucket = StringUtils.defaultIfBlank(bucketName, minioConfig.getBucketName());
        try {
            Iterable<Result<Item>> results = getClient().listObjects(
                    ListObjectsArgs.builder()
                            .bucket(finalBucket)
                            .prefix(targetPrefix)
                            .delimiter(PATH_DELIMITER)
                            .recursive(false)
                            .build());

            List<MinioDirectoryEntryVo> entries = new ArrayList<>();
            for (Result<Item> result : results) {
                Item item = result.get();
                String objectName = item.objectName();
                if (StringUtils.equals(objectName, targetPrefix)) {
                    // 略过目录占位对象
                    continue;
                }

                String relativeName = extractRelativeName(objectName, targetPrefix);
                if (StringUtils.isBlank(relativeName)) {
                    continue;
                }

                if (item.isDir()) {
                    String dirName = trimTrailingSlash(relativeName);
                    if (StringUtils.isBlank(dirName) || dirName.contains(PATH_DELIMITER)) {
                        continue;
                    }
                    entries.add(MinioDirectoryEntryVo.directory(dirName));
                } else {
                    if (relativeName.contains(PATH_DELIMITER)) {
                        continue;
                    }
                    if (DIRECTORY_PLACEHOLDER.equals(relativeName)) {
                        continue;
                    }
                    entries.add(MinioDirectoryEntryVo.file(relativeName, item.size(), item.lastModified()));
                }
            }

            entries.sort(Comparator
                    .comparing(MinioDirectoryEntryVo::isDir, Comparator.reverseOrder())
                    .thenComparing(MinioDirectoryEntryVo::getName, String.CASE_INSENSITIVE_ORDER));
            return entries;
        } catch (ErrorResponseException e) {
            log.warn("列举 Minio 目录失败，对象不存在。bucket={}, prefix={}", finalBucket, targetPrefix, e);
            throw new MinioFileNotFoundException(String.format("Minio 中不存在目录：%s", targetPrefix), e);
        } catch (InsufficientDataException | InternalException | InvalidResponseException | NoSuchAlgorithmException
                 | XmlParserException | IOException | InvalidKeyException | ServerException e) {
            log.error("列举 Minio 目录失败，bucket={}, prefix={}", finalBucket, targetPrefix, e);
            throw new MinioProxyException("获取目录文件列表失败，请稍后重试", e);
        }
    }

    private String buildOntologyPrefix(String teamId, String ontologyName) {
        String normalizedTeamId = sanitizeSegment(teamId, "团队ID");
        String normalizedOntology = sanitizeSegment(ontologyName, "本体英文名");
        return String.join(PATH_DELIMITER, ONTOLOGY_ROOT_PREFIX, normalizedTeamId, normalizedOntology) + PATH_DELIMITER;
    }

    /**
     * 规范化文件相对路径，防止目录穿越
     */
    private String normalizeRelativePath(String filePath) {
        if (StringUtils.isBlank(filePath)) {
            throw new IllegalArgumentException("文件路径不能为空");
        }
        String normalized = filePath.trim().replace("\\", PATH_DELIMITER);
        while (normalized.startsWith(PATH_DELIMITER)) {
            normalized = normalized.substring(1);
        }
        if (StringUtils.isBlank(normalized)) {
            throw new IllegalArgumentException("文件路径不能为空");
        }
        if (normalized.contains("..")) {
            throw new IllegalArgumentException("文件路径不允许包含“..”");
        }
        return normalized;
    }

    /**
     * 规范化目录路径（允许空串）
     */
    private String normalizeDirectoryPath(String directoryPath) {
        if (StringUtils.isBlank(directoryPath)) {
            return "";
        }
        String normalized = directoryPath.trim().replace("\\", PATH_DELIMITER);
        while (normalized.startsWith(PATH_DELIMITER)) {
            normalized = normalized.substring(1);
        }
        while (normalized.endsWith(PATH_DELIMITER)) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        if (StringUtils.isBlank(normalized)) {
            return "";
        }
        if (normalized.contains("..")) {
            throw new IllegalArgumentException("目录路径不允许包含“..”");
        }
        return normalized;
    }

    private String extractRelativeName(String objectName, String prefix) {
        if (StringUtils.startsWith(objectName, prefix)) {
            return objectName.substring(prefix.length());
        }
        return objectName;
    }

    private String trimTrailingSlash(String value) {
        if (StringUtils.isBlank(value)) {
            return value;
        }
        String result = value;
        while (result.endsWith(PATH_DELIMITER)) {
            result = result.substring(0, result.length() - 1);
        }
        return result;
    }

    private void removeObjectInternal(String bucketName, String objectName, boolean suppressNotFound) {
        try {
            getClient().removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build());
        } catch (ErrorResponseException e) {
            if (e.errorResponse() != null && "NoSuchKey".equals(e.errorResponse().code())) {
                if (suppressNotFound) {
                    return;
                }
                log.warn("删除 Minio 对象失败，对象不存在。bucket={}, object={}", bucketName, objectName, e);
                throw new MinioFileNotFoundException(String.format("Minio 中不存在对象：%s", objectName), e);
            }
            log.error("删除 Minio 对象失败，bucket={}, object={}", bucketName, objectName, e);
            throw new MinioProxyException("删除对象失败，请稍后重试", e);
        } catch (InsufficientDataException | InternalException | InvalidResponseException | NoSuchAlgorithmException
                 | XmlParserException | IOException | InvalidKeyException | ServerException e) {
            log.error("删除 Minio 对象失败，bucket={}, object={}", bucketName, objectName, e);
            throw new MinioProxyException("删除对象失败，请稍后重试", e);
        }
    }

    private String maskValue(String value) {
        if (StringUtils.isBlank(value)) {
            return value;
        }
        if (value.length() <= 4) {
            return value.charAt(0) + "***" + value.charAt(value.length() - 1);
        }
        return value.substring(0, 2) + "***" + value.substring(value.length() - 2);
    }

    private String normalizeObjectPath(String objectPath) {
        if (StringUtils.isBlank(objectPath)) {
            return objectPath;
        }
        String normalized = objectPath.trim().replace("\\", PATH_DELIMITER);
        while (normalized.startsWith(PATH_DELIMITER)) {
            normalized = normalized.substring(1);
        }
        if (normalized.contains("..")) {
            throw new IllegalArgumentException("对象路径不允许包含“..”");
        }
        return normalized;
    }

    /**
     * 校验单段路径，确保不含非法字符
     */
    private String sanitizeSegment(String value, String fieldName) {
        if (StringUtils.isBlank(value)) {
            throw new IllegalArgumentException(fieldName + "不能为空");
        }
        String trimmed = value.trim();
        if (trimmed.contains(PATH_DELIMITER) || trimmed.contains("\\") || trimmed.contains("..")) {
            throw new IllegalArgumentException(fieldName + "包含非法字符");
        }
        return trimmed;
    }

    /**
     * Minio 文件对象封装
     */
    @Getter
    public static class MinioFileObject {
        private final String objectName;
        private final String bucketName;
        private final String contentType;
        private final long size;
        private final GetObjectResponse response;
        private final Map<String, String> userMetadata;

        public MinioFileObject(String objectName, String bucketName, String contentType, long size,
                               GetObjectResponse response, Map<String, String> userMetadata) {
            this.objectName = objectName;
            this.bucketName = bucketName;
            this.contentType = contentType;
            this.size = size;
            this.response = response;
            this.userMetadata = userMetadata;
        }
    }

    public static class MinioProxyException extends RuntimeException {
        public MinioProxyException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    public static class MinioFileNotFoundException extends RuntimeException {
        public MinioFileNotFoundException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
