package com.asiainfo.dto;

import com.asiainfo.modo.app.datasource.rela.ModoTeamDs;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @Author luchao
 * @Date 2025/8/20
 * @Description
 */
@AllArgsConstructor
@Data
@NoArgsConstructor
public class TeamDsDto {
    public ModoTeamDs modoTeamDs;
    public String label;
    public String dsType;

    public TeamDsDto(ModoTeamDs modoTeamDs, String label) {
        this.modoTeamDs = modoTeamDs;
        this.label = label;
    }

}