package com.asiainfo.event;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString
public class OntologyRegisterInfoChangeEvent {
    private String agentType;
    private String host;
    private String port;
    private String reg;
}
