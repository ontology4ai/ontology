package com.asiainfo.serivce;

import com.asiainfo.common.PromptTypeEnum;
import com.asiainfo.vo.operation.CaseTemplateVo;
import com.asiainfo.repo.OntologyPromptRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class OntologyImportCaseService {

    @Autowired
    OntologyPromptRepository promptRepository;

    public List<CaseTemplateVo> importFile(MultipartFile file) throws IOException {
        List<CaseTemplateVo> attributeDtoList = new ArrayList<>();
        // 使用 XSSFWorkbook 读取 .xlsx 文件
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            // 获取第一个 Sheet（工作表）
            Sheet sheet = workbook.getSheetAt(0);
            // 通常第一行是标题,从第1行开始遍历
            for (int rowNum = 3; rowNum <= sheet.getLastRowNum(); rowNum++) {
                Row row = sheet.getRow(rowNum);
                // 跳过空行
                if (null == row || isInvalidRow(row)) continue;

                CaseTemplateVo promptVo = new CaseTemplateVo();
                // 遍历每个单元格
                for (int cellNum = 0; cellNum < row.getLastCellNum(); cellNum++) {
                    Cell cell = row.getCell(cellNum);
                    String cellValue = getCellValueAsString(cell);
                    switch (cellNum) {
                        case 0:
                            if (StringUtils.isBlank(cellValue)) throw new IOException("问题不能为空");
                            promptVo.setQuestion(cellValue);
                            break;
                        case 1:
                            if (StringUtils.isBlank(cellValue)) throw new IOException("预期结果不能为空");
                            promptVo.setExpectedResult(cellValue);
                            break;
                        case 2:
                            if (StringUtils.isBlank(cellValue)) throw new IOException("普通提示词名称不能为空");
                            promptVo.setNormalPromptName(cellValue);
                            break;
                        case 3:
                            if (StringUtils.isBlank(cellValue)) throw new IOException("OAG提示词名称不能为空");
                            promptVo.setOagPromptName(cellValue);
                            break;
                        default:
                            break;
                    }
                }

                attributeDtoList.add(promptVo);
            }

            return attributeDtoList;
        }
    }

    public boolean validateTemplate(String ontologyId, List<CaseTemplateVo> templateList) {
        boolean isValid = true;
        for (CaseTemplateVo templateVo : templateList) {
            if (promptRepository.countByPromptName(ontologyId, PromptTypeEnum.NORMAL.getValue(), templateVo.getNormalPromptName()) == 0) {
                isValid = false;
                templateVo.setNormalPromptName(String.format("提示词[%s]不存在", templateVo.getNormalPromptName()));
            }

            if (promptRepository.countByPromptName(ontologyId, PromptTypeEnum.OAG.getValue(), templateVo.getOagPromptName()) == 0) {
                isValid = false;
                templateVo.setOagPromptName(String.format("提示词[%s]不存在", templateVo.getOagPromptName()));
            }
        }

        return isValid;
    }

    /**
     * 将 Excel 单元格内容转换为字符串（兼容各种类型：文本、数字、日期、布尔值等）
     */
    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }

        switch (cell.getCellTypeEnum()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    return String.valueOf((long) cell.getNumericCellValue());
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return "";
        }
    }

    private boolean isInvalidRow(Row row) {
        for (int cellNum = 0; cellNum < row.getLastCellNum(); cellNum++) {
            Cell cell = row.getCell(cellNum);
            if(StringUtils.isNotEmpty(getCellValueAsString(cell))) {
                return false;
            }
        }

        return true;
    }

}
