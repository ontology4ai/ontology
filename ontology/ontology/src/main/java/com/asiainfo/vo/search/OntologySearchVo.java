package com.asiainfo.vo.search;

import lombok.Data;

/**
 * 本体对象
 */
@Data
public class OntologySearchVo extends BaseSearchVo {

    private String keyword;

    private Integer status;

    private Integer isFavorite;

    private Integer published;

    private Integer isRecommend;

}
