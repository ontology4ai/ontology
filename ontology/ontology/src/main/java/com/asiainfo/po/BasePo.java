package com.asiainfo.po;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * PO基础抽象类，包含通用字段
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BasePo {

    /**
     * 创建时间
     */
    @Column(name = "create_time")
    @CreatedDate
    @Comment("创建时间")
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @Column(name = "last_update")
    @LastModifiedDate
    @Comment("修改时间")
    private LocalDateTime lastUpdate;

    /**
     * 待同步状态，1为新建，2为修改，3为删除，0为已同步
     */
    @Column(name = "sync_status")
    @Comment("待同步状态，1为新建，2为修改，3为删除，0为已同步")
    private Integer syncStatus;

    /**
     * 操作状态
     */
    @Column(name = "oper_status")
    @Comment("操作状态：0 - 新建，1 - 修改，2 - 同步，3 - 删除")
    private Integer operStatus;
}