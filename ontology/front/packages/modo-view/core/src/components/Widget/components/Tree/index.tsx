import React from 'react';
import wrapHOC from '../../hoc/wrap';
import { Tree, Input, Dropdown, Menu } from '@arco-design/web-react';
import useClassLocale from '@/utils/useClassLocale';
import { GlobalContext } from '@/utils/context';
import Renderer from 'packages/modo-view/renderer';
import * as Icon from 'modo-design/icon';
import './style/index.less';

const TreeNode = Tree.Node;

class ModoTree extends React.Component {
    constructor(props: any) {
        super(props);
        this.state={
            treeDataO: props.data,
            treeData: props.data,
            inputValue: '',
            expandedKeys: [],
            selectedKeys: []
        };
    }

    searchData = (inputValue) => {
      const title = (this.props.fieldNames && this.props.fieldNames.title) || 'title';
      const children = (this.props.fieldNames && this.props.fieldNames.children) || 'children';
      const key = (this.props.fieldNames && this.props.fieldNames.key) || 'key';
      const loop = (data) => {
        const result = [];
        data.forEach((item) => {
          if (item[title] && item[title].toLowerCase().indexOf(inputValue.toLowerCase()) > -1) {
            result.push({ ...item });
          } else if (item.children) {
            const filterData = loop(item[children]);
            if (filterData.length) {
              result.push({ ...item, children: filterData });
            }
          }
        });
        return result;
      };
      //return loop(TreeData);
      if(!inputValue){
          this.setState({
              treeData: this.state.treeDataO,
              inputValue: inputValue
          });
      } else {
          const result = loop(this.state.treeDataO);
          this.setState({
              treeData: result,
              inputValue: inputValue
          });
      }

    };
    setSelectedKeys = (keys, extra) => {
      this.setState({
        selectedKeys: keys
      });
      typeof this.props.onSelect === 'function' && this.props.onSelect(keys, extra);
    };
    setExpandedKeys = (keys, extra) => {
      this.setState({
        expandedKeys: keys
      });
      typeof this.props.onExpand === 'function' && this.props.onExpand(keys, extra);
    };
    expandAll = () => {
      let keys = [];
      const getExpandKeys = (data) => {
          for (let i in data) {
              if (data[i].children) {
                 keys = [...keys, data[i][this.props.fieldNames.key]];
                 getExpandKeys(data[i].children);
              }
          }
      };
      getExpandKeys(this.props.data);
      this.setState({
        expandedKeys : keys
      });
    };
    componentDidMount() {
        this.setState({
            treeData: this.props.data,
            treeDataO: this.props.data,
        });
        if(this.props.isExpandedAll){
          this.expandAll()
        }
        this.props.dispatch({
            type: 'SETREF',
            name: this.props.name,
            ref: this
        });
    }

    componentDidUpdate() {
      if (!_.isEqual(this.state.treeDataO, this.props.data)) {
        this.setState({
            treeData: this.props.data,
            treeDataO: this.props.data,
        });
        if(this.props.isExpandedAll){
          this.expandAll()
        }
      }
    }

    componentWillUnmount() {
        this.props.dispatch({
            type: 'DELETEREF',
            name: this.props.name
        });
    }

    static getDerivedStateFromProps(props, state) {
        return props;
    }

    render() {
        if (window.abc) {
            console.log(`render-tree-${this.props.nodeKey}`);
        }
        const t = useClassLocale(this.context);
        const {
            showLine,
            onMouseLeave,
            onMouseOver,
            onClick,
            style,
            className,
            actions
        } = this.props;

        const {
          treeData,
          inputValue,
          expandedKeys,
          selectedKeys
        } = this.state;

        return (
            <div
                className={className}
                style={{
                    ...style
                }}
                onMouseLeave={onMouseLeave}
                onMouseOver={onMouseOver}
                onClick={onClick}>
              <Input.Search
                style={{
                  marginBottom: 8,
                  maxWidth: 240,
                }}
                placeholder={t("请输入关键字")}
                onChange={(val)=>{this.searchData(val)}}
              />

              <Tree
                {...this.props}
                className={[this.props.className, this.props.indent? this.props.indent : ''].join(' ')}
                treeData={treeData}
                defaultExpandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                expandedKeys={expandedKeys}
                virtualListProps={{ height: '100%' }}
                renderTitle={(props) => {
                  const title = props.title;
                  let currentTitle = title;
                  if (inputValue) {
                    const index = currentTitle.toLowerCase().indexOf(inputValue.toLowerCase());

                    if (index === -1) {
                      return title;
                    }

                    const prefix = title.substr(0, index);
                    const suffix = title.substr(index + inputValue.length);
                    currentTitle =  (
                      <span>
                        {prefix}
                        <span style={{ color: 'var(--color-primary-light-4)' }}>
                          {title.substr(index, inputValue.length)}
                        </span>
                        {suffix}
                      </span>
                    );
                  }
                  return (
                    <Dropdown
                      trigger='contextMenu'
                      position='bl'
                      droplist={
                        <Menu className="tree-drop-menu">
                          {
                            actions && actions.map((action, index) => {
                                const BtnIcon = Icon[action.icon];
                                return (
                                    <Menu.Item
                                        key={index}
                                        onClick={() =>this.props.dispatchEvent(action.event, props)}>
                                        <span
                                          style={{
                                            marginRight: BtnIcon ? '4px' : '0px'
                                          }}>
                                          {(action.icon && BtnIcon) ? <BtnIcon/> : null}
                                         </span>
                                        {action.label}
                                    </Menu.Item>
                                );
                            })
                          }
                        </Menu>
                      }>
                      {typeof this.props.renderTitle === 'function' ? this.props.renderTitle(currentTitle, props) : currentTitle}
                    </Dropdown>
                  )
                }}
                onSelect={(keys, extra) => {
                  this.setSelectedKeys(keys, extra);
                }}
                onExpand={(keys, extra) => {
                  this.setExpandedKeys(keys, extra);
                }}
              ></Tree>
            </div>
        )
    }
}

ModoTree.contextType = GlobalContext;

export default wrapHOC(ModoTree, 'tree');
