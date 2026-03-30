import React from 'react';
import {Space, Tooltip} from "@arco-design/web-react";
import {
    IconCalendarColor,
    IconCounterColor,
    IconDataIntegrationColor,
    IconTextareaColor,
    IconUnitMgrColor
} from "modo-design/icon";

const renderIcon = (option) => {
    let labelIcon = '';
    switch (option) {
        case 'string':
            labelIcon = <IconTextareaColor/>;
            break;
        case 'int':
            labelIcon = <IconCounterColor/>;
            break;
        case 'decimal':
            labelIcon = <IconDataIntegrationColor/>;
            break;
        case 'bool':
            labelIcon = <IconUnitMgrColor/>;
            break;
        case 'date':
            labelIcon = <IconCalendarColor/>;
            break
    }
    return labelIcon
};
const updateAttr = (props)=>{
    const {data} = props;
    return (
      <div className="update-tooltip">
          <div className="head">修改属性</div>
          <div className="attr-list-container">
              {data.attr?.map((attr, idx) => {
                  return (
                    <div className="attr-list" key={idx}>
                        <Space size='mini'>
                            {renderIcon(attr.fieldType)}
                            <Tooltip content={attr.attributeName}>
                                <span>{attr.attributeName}</span>
                            </Tooltip>
                        </Space>
                    </div>
                  )
              })}
          </div>
      </div>
    )
};
export default updateAttr;
