package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 * 接口属性对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_interface_attribute")
@EntityListeners(AuditingEntityListener.class)
public class OntologyInterfaceAttributePo extends BasePo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("接口属性唯一id")
    private String id;

    /**
     * 接口属性类型
     */
    @Column(name = "type", length = 100)
    @Comment("接口属性类型")
    private String type;

    /**
     * 接口属性英文名
     */
    @Column(name = "name", length = 100)
    @Comment("接口属性英文名")
    private String name;

    /**
     * 接口属性中文名
     */
    @Column(name = "label", length = 100)
    @Comment("接口属性中文名")
    private String label;

    /**
     * 描述
     */
    @Column(name = "description", columnDefinition = "text")
    @Comment("接口属性描述")
    private String description;

    /**
     * 所属接口id
     */
    @Column(name = "interface_id", length = 32)
    @Comment("接口属性唯一id")
    private String interfaceId;

    /**
     * 接口属性是否必要
     */
    @Column(name = "is_required")
    @Comment("接口属性唯一id")
    private Integer isRequired;

    public boolean equalsWith(OntologyInterfaceAttributePo interfaceAttributePo) {
        if (!interfaceAttributePo.getId().equals(this.id)) {
            return false;
        }
        if (!interfaceAttributePo.getInterfaceId().equals(this.interfaceId)) {
            return false;
        }
        if (!interfaceAttributePo.getType().equals(this.type)
                || !interfaceAttributePo.getName().equals(this.name)
                || !interfaceAttributePo.getLabel().equals(this.label)) {
            return false;
        }

        if (StringUtils.isNotBlank(description) && StringUtils.isBlank(interfaceAttributePo.getDescription())) {
            return false;
        }

        if (StringUtils.isBlank(description) && StringUtils.isNotBlank(interfaceAttributePo.getDescription())) {
            return false;
        }

        if (StringUtils.isNotBlank(description)
                && StringUtils.isNotBlank(interfaceAttributePo.getDescription())
                && ! interfaceAttributePo.getDescription().equals(description)) {
            return false;
        }

        return true;
    }

}