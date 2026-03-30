package com.asiainfo.vo.minio;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.ZonedDateTime;
import java.util.Date;

/**
 * @Author luchao
 * @Date 2025/8/19
 * @Description Minio 目录节点信息
 */
@Data
public class MinioDirectoryEntryVo {

    /**
     * 文件或目录名称
     */
    private String name;

    /**
     * 是否目录
     */
    private boolean dir;

    /**
     * 文件大小，目录固定为 0
     */
    private long filesize;

    /**
     * 最近更新时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date time;

    public static MinioDirectoryEntryVo directory(String name) {
        MinioDirectoryEntryVo vo = new MinioDirectoryEntryVo();
        vo.setName(name);
        vo.setDir(true);
        vo.setFilesize(0L);
        vo.setTime((Date) null);
        return vo;
    }

    public static MinioDirectoryEntryVo file(String name, long size, ZonedDateTime lastModified) {
        MinioDirectoryEntryVo vo = new MinioDirectoryEntryVo();
        vo.setName(name);
        vo.setDir(false);
        vo.setFilesize(size);
        vo.setTime(lastModified == null ? null : Date.from(lastModified.toInstant()));
        return vo;
    }
}

