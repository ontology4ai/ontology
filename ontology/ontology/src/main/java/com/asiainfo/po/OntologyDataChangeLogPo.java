package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

import javax.persistence.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_data_change_log")
@EntityListeners(AuditingEntityListener.class)
public class OntologyDataChangeLogPo {
    /**
     * 唯一id
     */
    @Id
    @Column(name = "id")
    @Comment("数据变更唯一id")
    private Long id;

    @Column(name = "track_id", length = 100)
    @Comment("跟踪id")
    private String trackId;

    @Column(name = "operation_type", length = 20)
    @Comment("操作类型")
    private String operationType;

    @Column(name = "object_type_name", length = 100)
    @Comment("对象类型名称")
    private String objectTypeName;

    @Column(name = "affected_rows")
    @Comment("影响的行数")
    private Integer affectedRows;

    @Column(name = "record_count_before")
    @Comment("操作前记录总数")
    private Integer recordCountBefore;

    @Column(name = "record_count_after")
    @Comment("操作后记录总数")
    private Integer recordCountAfter;

    @Column(name = "change_details", length = 1000)
    @Comment("变更详情JSON")
    private String changeDetails;

    @Column(name = "created_at")
    @Comment("记录创建时间")
    private LocalDateTime createdAt;

    @Column(name = "full_data", length = 1000)
    @Comment("完整记录数据")
    private String fullData;
}
