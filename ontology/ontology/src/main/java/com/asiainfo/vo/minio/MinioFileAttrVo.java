package com.asiainfo.vo.minio;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.minio.StatObjectResponse;
import lombok.Data;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.MediaType;

import java.util.Collections;
import java.util.Date;
import java.util.Map;

/**
 * Minio 文件属性信息
 */
@Data
public class MinioFileAttrVo {

    /**
     * 对象完整路径
     */
    private String objectName;

    /**
     * 所属桶
     */
    private String bucket;

    /**
     * 文件大小（字节）
     */
    private long filesize;

    /**
     * Content-Type
     */
    private String contentType;

    /**
     * etag
     */
    private String etag;

    /**
     * 最后修改时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date lastModified;

    /**
     * 自定义元数据
     */
    private Map<String, String> metadata;

    public static MinioFileAttrVo fromStat(String objectName, String bucket, StatObjectResponse stat) {
        MinioFileAttrVo vo = new MinioFileAttrVo();
        vo.setObjectName(objectName);
        vo.setBucket(bucket);
        vo.setFilesize(stat.size());
        vo.setContentType(StringUtils.defaultIfBlank(stat.contentType(), MediaType.APPLICATION_OCTET_STREAM_VALUE));
        vo.setEtag(stat.etag());
        vo.setLastModified(stat.lastModified() == null ? null : Date.from(stat.lastModified().toInstant()));
        vo.setMetadata(stat.userMetadata() == null ? Collections.emptyMap() : stat.userMetadata());
        return vo;
    }
}

