import React, { useState } from 'react';
import {IconKeyModel} from 'modo-design/icon'
import './style/index.less'

interface MenuItem {
  label: string,
  id: string,
  parentId?: string | undefined,
  parentName?: string | undefined,
  children?: Array<MenuItem>,
  [props: string]: any
}

interface IQuickMenu {
  menu: Array<MenuItem>,
  columnCount?: number,
  handleClickMenu?: (e, menu) => void,
  menuClassName?: string
}

type ActiveNode = {level: number} & MenuItem



export const QuickMenu = ({menu, columnCount = 6, handleClickMenu, menuClassName}: IQuickMenu) => {
  const [activeNode, setActiveNode] = useState<ActiveNode>({
    id: '',
    label: '',
    level: 0,
    name: '',
    parentId: undefined,
  })

  const clearActiveNode = () => {
    setActiveNode({
      id: '',
      label: '',
      level: 0,
      name: '',
      parentId: undefined,
    })
  }

  const renderMenuNode = (i: MenuItem) => {
    return <div
      className='quick-menu-node'
      onMouseLeave={() => clearActiveNode()}
      onClick={(e) => {
        handleClickMenu && handleClickMenu(e, activeNode)
      }}
    >
      <div className={`quick-menu-node-label ${activeNode.id === i.id || activeNode.parentId === i.id ? 'active' : ''}`}
           onMouseEnter={() => setActiveNode(Object.assign({}, {level: 1}, i))}>
        <IconKeyModel className='icon'/>
        <div className={`line ${activeNode.id === i.id || activeNode.parentId === i.id ? 'line-active' : ''}`}/>
        {i.label}
      </div>
      <div className='quick-menu-node-submenu'>
      {i.children && i.children.map((child) =>
        <div className={`quick-menu-node-submenu-label ${activeNode.id === child.id ? 'active' : ''}`}
             onMouseEnter={() => {
               setActiveNode(Object.assign({}, {level: 2}, child))
             }}>
          {child.label}
        </div>)}
      </div>
    </div>
  }

  return <>
    <div className={`quick-menu-wrap ${menuClassName || ''}`}>
      <div style={{'columnCount': columnCount}}>
        {menu.map((i: MenuItem) => renderMenuNode(i))}
      </div>
    </div>
  </>
}
