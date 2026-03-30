package com.asiainfo.vo.operation;

import com.asiainfo.vo.search.BaseSearchVo;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.util.List;

/**
 * 本体接口约束对象
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyInterfaceConstraintVo extends BaseSearchVo {
    private String id;

    private String interfaceId;

    private Integer constraintType;

    private String constraintRelation;

    private String objectTypeId;

    private Integer status;

    private Integer operStatus;

}
