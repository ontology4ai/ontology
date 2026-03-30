package com.asiainfo.serivce;

import com.asiainfo.common.OperStatusEnum;
import com.asiainfo.po.*;
import com.asiainfo.repo.OntologyChangeLogRepository;
import com.asiainfo.repo.OntologyRepository;
import io.github.suanchou.utils.StringUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Slf4j
public class OntologyChangeLogService {
    @Autowired
    private OntologyRepository ontologyRepository;

    @Autowired
    OntologyChangeLogRepository ontologyChangeLogRepository;

    @Transactional
    public void saveChangeLog(String changeType, Object targetPo) {
        OntologyChangeLogPo changeLogPo = buildChangeLogPo(changeType, targetPo);
        if (changeLogPo == null) {
            return;
        }

        log.info("{}{}", changeLogPo.getOwnerId(), changeLogPo.getChangeTargetDesc());

        if (!(targetPo instanceof OntologyPo)) {
            ontologyRepository.updateLastUpdateById(LocalDateTime.now(), changeLogPo.getOntologyId());
        }

        ontologyChangeLogRepository.save(changeLogPo);
    }

    private OntologyChangeLogPo buildChangeLogPo(String changeType, Object targetPo) {
        if (targetPo == null) {
            return null;
        }

        if (targetPo instanceof OntologyPo) {
            return buildOntologyChangeLog(changeType, (OntologyPo) targetPo);
        }
        if (targetPo instanceof OntologyObjectTypePo) {
            return buildOntologyObjectTypeChangeLog(changeType, (OntologyObjectTypePo) targetPo);
        }

        if (targetPo instanceof OntologyLogicTypePo) {
            return buildOntologyLogicTypeChangeLog(changeType, (OntologyLogicTypePo) targetPo);
        }

        if (targetPo instanceof OntologyLinkTypePo) {
            return buildOntologyLinkTypeChangeLog(changeType, (OntologyLinkTypePo) targetPo);
        }

        if (targetPo instanceof OntologyInterfacePo) {
            return buildOntologyInterfaceChangeLog(changeType, (OntologyInterfacePo) targetPo);
        }

        if (targetPo instanceof OntologyObjectTypeActionPo) {
            return buildOntologyObjectTypeActionChangeLog(changeType, (OntologyObjectTypeActionPo) targetPo);
        }

        if (targetPo instanceof OntologyFunctionPo) {
            return buildOntologyFunctionChangeLog(changeType, (OntologyFunctionPo) targetPo);
        }

        if (targetPo instanceof OntologySharedAttributePo) {
            return buildOntologySharedAttributeChangeLog(changeType, (OntologySharedAttributePo) targetPo);
        }

        return null;
    }

    private OntologyChangeLogPo buildOntologySharedAttributeChangeLog(String changeType, OntologySharedAttributePo targetPo) {
        OntologyChangeLogPo changeLogPo = new OntologyChangeLogPo();
        changeLogPo.setId(StringUtil.genUuid(32));
        changeLogPo.setOperStatus(targetPo.getOperStatus());
        changeLogPo.setSyncStatus(targetPo.getSyncStatus());
        changeLogPo.setOntologyId(targetPo.getOntologyId());
        changeLogPo.setChangeTargetType(targetPo.getClass().getSimpleName());
        changeLogPo.setChangeTargetId(targetPo.getId());
        changeType = translateChangeType(changeType, targetPo.getOperStatus());
        changeLogPo.setChangeType(changeType);
        changeLogPo.setChangeTargetDesc(String.format("%s共享属性“%s”", changeType, targetPo.getAttributeName()));
        return changeLogPo;
    }

    private OntologyChangeLogPo buildOntologyFunctionChangeLog(String changeType, OntologyFunctionPo targetPo) {
        OntologyChangeLogPo changeLogPo = new OntologyChangeLogPo();
        changeLogPo.setId(StringUtil.genUuid(32));
        changeLogPo.setOperStatus(targetPo.getOperStatus());
        changeLogPo.setSyncStatus(targetPo.getSyncStatus());
        changeLogPo.setOwnerId(targetPo.getOwnerId());
        changeLogPo.setOntologyId(targetPo.getOntologyId());
        changeLogPo.setChangeTargetType(targetPo.getClass().getSimpleName());
        changeLogPo.setChangeTargetId(targetPo.getId());
        changeType = translateChangeType(changeType, targetPo.getOperStatus());
        changeLogPo.setChangeType(changeType);
        changeLogPo.setChangeTargetDesc(String.format("%s函数“%s”", changeType, targetPo.getName()));
        return changeLogPo;
    }

    private String translateChangeType(String changeType, Integer operStatus) {
        if (StringUtils.equals(changeType, "删除")) {
            return "删除";
        }
        if (operStatus == null) {
            return changeType;
        }
        if (OperStatusEnum.CREATED.getCode() == operStatus) {
            return "新增";
        }
        if (OperStatusEnum.UPDATED.getCode() == operStatus) {
            return "修改";
        }
        if (OperStatusEnum.DELETED.getCode() == operStatus) {
            return "删除";
        }
        if (OperStatusEnum.PUBLISHED.getCode() == operStatus) {
            return "发布";
        }
        return changeType;
    }

    private OntologyChangeLogPo buildOntologyObjectTypeActionChangeLog(String changeType, OntologyObjectTypeActionPo targetPo) {
        OntologyChangeLogPo changeLogPo = new OntologyChangeLogPo();
        changeLogPo.setId(StringUtil.genUuid(32));
        changeLogPo.setOperStatus(targetPo.getOperStatus());
        changeLogPo.setSyncStatus(targetPo.getSyncStatus());
        changeLogPo.setOwnerId(targetPo.getOwnerId());
        changeLogPo.setOntologyId(targetPo.getOntologyId());
        changeLogPo.setChangeTargetType(targetPo.getClass().getSimpleName());
        changeLogPo.setChangeTargetId(targetPo.getId());
        changeType = translateChangeType(changeType, targetPo.getOperStatus());
        changeLogPo.setChangeType(changeType);
        changeLogPo.setChangeTargetDesc(String.format("%s动作“%s”", changeType, targetPo.getActionName()));
        return changeLogPo;
    }

    private OntologyChangeLogPo buildOntologyInterfaceChangeLog(String changeType, OntologyInterfacePo targetPo) {
        OntologyChangeLogPo changeLogPo = new OntologyChangeLogPo();
        changeLogPo.setId(StringUtil.genUuid(32));
        changeLogPo.setOperStatus(targetPo.getOperStatus());
        changeLogPo.setSyncStatus(targetPo.getSyncStatus());
        changeLogPo.setOwnerId(targetPo.getOwnerId());
        changeLogPo.setOntologyId(targetPo.getOntologyId());
        changeLogPo.setChangeTargetType(targetPo.getClass().getSimpleName());
        changeLogPo.setChangeTargetId(targetPo.getId());
        changeType = translateChangeType(changeType, targetPo.getOperStatus());
        changeLogPo.setChangeType(changeType);
        changeLogPo.setChangeTargetDesc(String.format("%s接口“%s”", changeType, targetPo.getName()));
        return changeLogPo;
    }

    private OntologyChangeLogPo buildOntologyLinkTypeChangeLog(String changeType, OntologyLinkTypePo targetPo) {
        OntologyChangeLogPo changeLogPo = new OntologyChangeLogPo();
        changeLogPo.setId(StringUtil.genUuid(32));
        changeLogPo.setOperStatus(targetPo.getOperStatus());
        changeLogPo.setSyncStatus(targetPo.getSyncStatus());
        changeLogPo.setOwnerId(targetPo.getOwnerId());
        changeLogPo.setOntologyId(targetPo.getOntologyId());
        changeLogPo.setChangeTargetType(targetPo.getClass().getSimpleName());
        changeLogPo.setChangeTargetId(targetPo.getId());
        changeType = translateChangeType(changeType, targetPo.getOperStatus());
        changeLogPo.setChangeType(changeType);
        changeLogPo.setChangeTargetDesc(String.format("%s连接", changeType));
        return changeLogPo;
    }

    private OntologyChangeLogPo buildOntologyLogicTypeChangeLog(String changeType, OntologyLogicTypePo targetPo) {
        OntologyChangeLogPo changeLogPo = new OntologyChangeLogPo();
        changeLogPo.setId(StringUtil.genUuid(32));
        changeLogPo.setOperStatus(targetPo.getOperStatus());
        changeLogPo.setSyncStatus(targetPo.getSyncStatus());
        changeLogPo.setOwnerId(targetPo.getOwnerId());
        changeLogPo.setOntologyId(targetPo.getOntologyId());
        changeLogPo.setChangeTargetType(targetPo.getClass().getSimpleName());
        changeLogPo.setChangeTargetId(targetPo.getId());
        changeType = translateChangeType(changeType, targetPo.getOperStatus());
        changeLogPo.setChangeType(changeType);
        changeLogPo.setChangeTargetDesc(String.format("%s逻辑“%s”", changeType, targetPo.getLogicTypeName()));
        return changeLogPo;
    }

    private OntologyChangeLogPo buildOntologyObjectTypeChangeLog(String changeType, OntologyObjectTypePo targetPo) {
        OntologyChangeLogPo changeLogPo = new OntologyChangeLogPo();
        changeLogPo.setId(StringUtil.genUuid(32));
        changeLogPo.setOperStatus(targetPo.getOperStatus());
        changeLogPo.setSyncStatus(targetPo.getSyncStatus());
        changeLogPo.setOwnerId(targetPo.getOwnerId());
        changeLogPo.setOntologyId(targetPo.getOntologyId());
        changeLogPo.setChangeTargetType(targetPo.getClass().getSimpleName());
        changeLogPo.setChangeTargetId(targetPo.getId());
        changeType = translateChangeType(changeType, targetPo.getOperStatus());
        changeLogPo.setChangeType(changeType);
        changeLogPo.setChangeTargetDesc(String.format("%s对象“%s”", changeType, targetPo.getObjectTypeName()));
        return changeLogPo;
    }

    @NotNull
    private OntologyChangeLogPo buildOntologyChangeLog(String changeType, OntologyPo targetPo) {
        OntologyChangeLogPo changeLogPo = new OntologyChangeLogPo();
        changeLogPo.setId(StringUtil.genUuid(32));
        changeLogPo.setOperStatus(targetPo.getOperStatus());
        changeLogPo.setSyncStatus(targetPo.getSyncStatus());
        changeLogPo.setOwnerId(targetPo.getOwnerId());
        changeLogPo.setOntologyId(targetPo.getId());
        changeLogPo.setChangeTargetType(targetPo.getClass().getSimpleName());
        changeLogPo.setChangeTargetId(targetPo.getId());
        changeType = translateChangeType(changeType, targetPo.getOperStatus());
        changeLogPo.setChangeType(changeType);
        changeLogPo.setChangeTargetDesc(String.format("%s本体“%s”", changeType, targetPo.getOntologyName()));
        return changeLogPo;
    }
}
