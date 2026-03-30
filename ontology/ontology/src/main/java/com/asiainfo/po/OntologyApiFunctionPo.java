package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_api_function")
@EntityListeners(AuditingEntityListener.class)
public class OntologyApiFunctionPo {
    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 100)
    @Comment("函数唯一ID")
    private String id;

    @Column(name = "function_name", length = 100)
    @Comment("函数名称")
    private String functionName;

    @Column(name = "function_label", length = 100)
    @Comment("函数标签")
    private String functionLabel;

    @Column(name = "function_params")
    @Lob
    @Comment("函数参数")
    private String functionParams;
}
