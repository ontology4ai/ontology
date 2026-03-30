package com.asiainfo.vo.search;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @Author luchao
 * @Date 2025/8/29
 * @Description
 */

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SharedAttributeCountVo {

    private String sharedAttributeId;

    private long count;


}
