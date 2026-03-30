package com.asiainfo.repo;

import com.asiainfo.common.OperStatusEnum;
import com.asiainfo.po.OntologyInterfaceAttributePo;
import org.springframework.data.jpa.domain.Specification;

public class InterfaceAttributeSpecifications {
    public static Specification<OntologyInterfaceAttributePo> labelContains(String label) {
        return (root, query, cb) ->
                label == null ? null : cb.like(root.get("label"), "%" + label + "%");
    }

    public static Specification<OntologyInterfaceAttributePo> equalInterfaceId(String interfaceId) {
        return (root, query, cb) ->
                interfaceId == null ? null : cb.equal(root.get("interfaceId").as(String.class), interfaceId);
    }

    public static Specification<OntologyInterfaceAttributePo> notDeleted() {
        return (root, query, cb) ->
                cb.notEqual(root.get("operStatus").as(Integer.class), OperStatusEnum.DELETED.getCode());
    }
}
