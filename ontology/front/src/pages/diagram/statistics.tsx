import React, {useEffect, useState} from 'react';
import {Button, Dropdown, Tag} from '@arco-design/web-react';
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowLeft,
  IconDArrowRight,
  IconDataResDirColor,
  IconNodeTreeColor,
  IconTopologyColor,
  IconLinkColor,
  IconServerNodeColor,
  IconAddColor,
  IconEditColor,
  IconDeleteColor, IconRight,IconCross
} from 'modo-design/icon';
import './style/statistics.less';
import fx from './icons/fx.svg';
import inherit from './icons/inherit.svg';
import noInherit from './icons/no-inherit.svg';
import noInherit2 from './icons/no-inherit2.svg';
import inherit2 from './icons/inherit2.svg';
import noLink from './icons/no-link.svg';
import quote from './icons/quote.svg';
import noQuote from './icons/no-quote.svg';
import leftSideIcon from './icons/leftSideIcon.svg';
const GraphStatistics = (props) => {
  const {data} = props;
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const list = [
    {
      label: '对象',
      icon: (
        <div
          className="node-icon"
          style={{
            background: 'var(--color-primary-light-1)',
            color: 'var(--color-primary-6)',
          }}
        >
          <IconDataResDirColor />
        </div>
      ),
      key:'objectTypes',
      children: [
        {
          label: '关联数据源',
          icon: <IconLinkColor />,
          key:'datasourceObjectTypes',
        },
        {
          label: '未关联数据源',
          icon: <img src={noLink} alt="" />,
          key:'notDatasourceObjectTypes',
        },
        {
          label: '继承接口',
          icon: <img src={inherit} alt="" />,
          key:'interfaceObjectTypes',
        },
        {
          label: '未继承接口',
          icon: <img src={noInherit} alt="" />,
          key:'notInterfaceObjectTypes',
        },
      ],
    },
    {
      label: '逻辑',
      icon: (
        <div
          className="node-icon"
          style={{
            background: '#E9F8EE',
            color: 'var(--color-success-6)',
          }}
        >
          <IconNodeTreeColor />
        </div>
      ),
      key:'logicTypes',
      children: [
        {
          label: '引用对象',
          icon: <img src={quote} alt="" />,
          key:'refObjectLogicTypes',
        },
        {
          label: '未引用对象',
          icon: <img src={noQuote} alt="" />,
          key:'notRefObjectLogicTypes',
        },
        {
          label: '基于函数构建',
          icon: <img src={fx} alt="" />,
          key:'functionLogicTypes',
        },
      ],
    },
    {
      label: '动作',
      icon: (
        <div
          className="node-icon"
          style={{
            background: 'var(--color-purple-1)',
            color: 'var(--color-purple-6)',
          }}
        >
          <IconTopologyColor />
        </div>
      ),
      key:'objectActions',
      children: [
        {
          label: '基于函数构建',
          icon: <img src={fx} alt="" />,
          key:'functionObjectActions',
        },
        {
          label: '新增',
          icon: <IconAddColor />,
          key:'createObjectActions',
        },
        {
          label: '修改',
          icon: <IconEditColor />,
          key:'updateObjectActions',
        },
        {
          label: '删除',
          icon: <IconDeleteColor />,
          key:'deleteObjectActions',
        },
      ],
    },
    {
      label: '接口',
      icon: (
        <div
          className="node-icon"
          style={{
            background: '#FBEFF7',
            color: 'var(--color-magenta-6)',
          }}
        >
          <IconServerNodeColor />
        </div>
      ),
      key:'interfaces',
      children: [
        {
          label: '继承对象',
          icon: <img src={inherit2} alt="" />,
          key:'extendObjectInterfaces',
        },
        {
          label: '未继承对象',
          icon: <img src={noInherit2} alt="" />,
          key:'notExtendObjectInterfaces',
        },
      ],
    },
  ];
  const dropList = (
    <div className={`statistics-drop-list ${open?'':'hide'}`} style={{maxHeight:props.height||'auto',overflow:'auto'}}>
      {list.map(item => (
        <div className="node-wrap" key={item.label}>
          <div className="node">
            {item.icon}
            <div className="node-label">{item.label}</div>
            <Tag>{data[item.key]?data[item.key]:0}</Tag>
          </div>
          {item.children.map(i => (
            <div className="leaf" key={i.label}>
              <div className="leaf-icon">{i.icon}</div>
              <div className="leaf-label">{i.label}</div>
              <Tag>{data[i.key]?data[i.key]:0}</Tag>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
  useEffect(()=>{
    const ele = document.querySelector(`#graph-${props.ontology.id} .g6-toolbar`);
    if(open){
      ele?.classList.add('left200')
    }else{
      ele?.classList.remove('left200')
    }
  },[open]);
  return (
    <div style={{height:'100%'}}>
      {/*<Dropdown
        droplist={dropList}

        trigger="click"
        position="top"
        onVisibleChange={visible => setDropdownVisible(visible)}
      >
        <div className="graph-statistics" style={{width:dropdownVisible?'0px':''}}>
          <div className="label">统计</div>
          {dropdownVisible ? <IconArrowLeft /> : <IconDArrowRight />}
        </div>
      </Dropdown>*/}

      {/*<div className="graph-statistics" style={{width:dropdownVisible?'0px':''}}>
        <div className="label">统计</div>
        {dropdownVisible ? <IconArrowLeft /> : <IconDArrowRight />}
      </div>*/}


      <div className={`statistics-drop-list ${open?'':'hide'}`}>
        <div className="graph-statistics">
          <div className="label">统计</div>
          <div className="line" />
        </div>
        <div className={`statistics-drop-list-container`}>
          {list.map(item => (
          <div className="node-wrap" key={item.label}>
            <div className="node">
              {item.icon}
              <div className="node-label">{item.label}</div>
              <Tag>{data[item.key]?data[item.key]:0}</Tag>
            </div>
            {item.children.map(i => (
              <div className="leaf" key={i.label}>
                <div className="leaf-icon">{i.icon}</div>
                <div className="leaf-label">{i.label}</div>
                <Tag>{data[i.key]?data[i.key]:0}</Tag>
              </div>
            ))}
          </div>
        ))}
        </div>
      </div>
      <div className={`open-statics-icon ${open?'open':''}`} onClick={() => setOpen(!open)}>
        <img src={leftSideIcon} alt=""/>
        <IconArrowLeft/>
      </div>
      {/*<Button type='outline' className='open-statics-icon' style={{opacity:open?0:1}}
              onClick={() => {setOpen(!open)}}>
        <IconArrowLeft/>
      </Button>*/}
    </div>
  );
};

export default GraphStatistics;
