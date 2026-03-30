package com.asiainfo.serivce;

import com.asiainfo.vo.operation.OntologyInterfaceAttributeVo;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class OntologyInterfaceAttributeService {

    public List<OntologyInterfaceAttributeVo> importFile(MultipartFile file) throws IOException {
        List<OntologyInterfaceAttributeVo> attributeDtoList = new ArrayList<>();
        // 使用 XSSFWorkbook 读取 .xlsx 文件
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            // 获取第一个 Sheet（工作表）
            Sheet sheet = workbook.getSheetAt(0);
            // 通常第一行是标题,从第1行开始遍历
            for (int rowNum = 1; rowNum <= sheet.getLastRowNum(); rowNum++) {
                Row row = sheet.getRow(rowNum);
                // 跳过空行
                if (null == row || isInvalidRow(row)) continue;

                OntologyInterfaceAttributeVo attributeDto = new OntologyInterfaceAttributeVo();
                // 遍历每个单元格
                for (int cellNum = 0; cellNum < row.getLastCellNum(); cellNum++) {
                    Cell cell = row.getCell(cellNum);
                    String cellValue = getCellValueAsString(cell);
                    switch (cellNum) {
                        case 0:
                            if (StringUtils.isBlank(cellValue)) throw new IOException("属性类型不能为空");
                            attributeDto.setType(cellValue);
                            break;
                        case 1:
                            if (StringUtils.isBlank(cellValue)) throw new IOException("属性中文名不能为空");
                            attributeDto.setLabel(cellValue);
                            break;
                        case 2:
                            if (StringUtils.isBlank(cellValue)) throw new IOException("属性英文名不能为空");
                            attributeDto.setName(cellValue);
                            break;
                        case 3:
                            attributeDto.setDescription(cellValue);
                            break;
                        default:
                            break;
                    }
                }

                attributeDtoList.add(attributeDto);
            }

            return attributeDtoList;
        }
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
