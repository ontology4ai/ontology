package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 共享中心对象
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyCenterDto extends BaseDto {

    private String id;

    private String parentId;

    private String centerName;

    private String centerLabel;

    private String centerDesc;

    private String workspaceId;

    private String ownerId;

    private Integer status;

    private Integer syncLabel;

    private Integer isLeaf;

    private List<OntologyCenterDto> children;

    public List<String> getChildrenIdList() {
        if (null != children) {
            List<String> list = new ArrayList<>();
            for (OntologyCenterDto dto: children) {
                list.addAll(dto.toIdList());
            }

            return list;
        }

        return Collections.emptyList();
    }

    public List<String> toIdList() {
        List<String> list = new ArrayList<>();
        list.add(id);
        list.addAll(this.getChildrenIdList());
        return list;
    }

}