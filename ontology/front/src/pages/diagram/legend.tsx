import React, { useState } from 'react';
import { Dropdown } from '@arco-design/web-react';
import { IconArrowDown, IconArrowUp } from 'modo-design/icon';
import './style/legend.less';
const GraphLegend = (props) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const legends = [{
    label: '对象',
    color: '#3261CE',
  },{
    label: '逻辑',
    color: '#55BC8A',
  },{
    label: '动作',
    color: '#9C76EE',
  },{
    label: '接口',
    color: '#D451A8',
  }];
  const list = [
    {
      label: '对象',
      children: [
        {
          label: '关联数据源 & 继承接口',
          color: '#3261CE',
        },
        {
          label: '关联数据源 & 未继承接口',
          color: '#329DCE',
        },
        {
          label: '未关联数据源 & 继承接口',
          color: '#35C9C0',
        },
        {
          label: '未继承接口',
          color: '#5B86EA',
        },
      ],
    },
    {
      label: '逻辑',
      children: [
        {
          label: '基于函数构建',
          color: '#55BC8A',
        },
      ],
    },
    {
      label: '动作',
      children: [
        {
          label: '基于函数构建',
          color: '#9C76EE',
        },
        {
          label: '基于对象构建',
          color: '#724BC5',
        },
      ],
    },
    {
      label: '接口',
      children: [
        {
          label: '接口',
          color: '#D451A8',
        },
      ],
    },
  ];
  const dropList = (
    <div className="legend-drop-list" style={{maxHeight:props.height||'auto',overflow:'auto'}}>
      {list.map(item => (
        <div className="node-wrap" key={item.label}>
          <div className="node">
            <div className="node-label">{item.label}</div>
          </div>
          {item.children.map(i => (
            <div className="leaf" key={i.label}>
              <div className="leaf-icon" style={{ backgroundColor: i.color }}></div>
              <div className="leaf-label">{i.label}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
  return (
    <div className='legend-container'>
     {/* <Dropdown
        droplist={dropList}
        trigger="click"
        position="top"
        onVisibleChange={visible => setDropdownVisible(visible)}
      >
        <div className="graph-legend">
          <div className="label">图例</div>
          {dropdownVisible ? <IconArrowUp /> : <IconArrowDown />}
        </div>
      </Dropdown>*/}
      {legends.map((item,index)=>(
        <div className="legend-leaf" key={index}>
          <div className="leaf-icon" style={{ backgroundColor: item.color }}></div>
          <div className="leaf-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
};

export default GraphLegend;
