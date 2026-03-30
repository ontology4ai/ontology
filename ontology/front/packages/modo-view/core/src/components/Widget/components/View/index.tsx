import React from 'react';
import { ReactSortable } from "react-sortablejs";
import { Spin } from '@arco-design/web-react';
import { IconLoading } from '@arco-design/web-react/icon';
import wrapHOC from '../../hoc/wrap';
import Widget from 'packages/modo-view/core/src/components/Widget';
import initStore from 'packages/modo-view/designer/src/utils/store';
import initServices from 'packages/modo-view/designer/src/utils/services';
// import initStores from 'packages/modo-report/designer/src/utils/stores';
import initModels from 'packages/modo-view/designer/src/utils/models';
import { initAllStyle, destroyAllStyle } from 'packages/modo-view/core/src/utils/processStyles';
import './style/index.less';
require('static/guid');

interface ViewInterface {
  onMount?: (e) => void;
}
class View extends React.Component {
  constructor(props: ViewInterface) {
    super(props);
    this.state = {
      mount: false
    };
  }
  componentDidUpdate(prevProps, prevState) {
    if ((this.props.initVars !== prevProps.initVars && this.state.mount) ||
      (this.state.mount !== prevState.mount && this.props.initVars)) {
      initServices(this, this.props.node.options.services);
      // initStores(this);
    }
  }
  setParentChild() {
    const { setParentChild }= this.props;
    if (typeof setParentChild === 'function') {
      setParentChild(this, this.props.renderKey);
    }
  }
  deleteParentChild() {
    const { deleteParentChild }= this.props;
    if (typeof deleteParentChild === 'function') {
      deleteParentChild(this, this.props.renderKey);
    }
  }
  componentDidMount() {
    if (!this.props.editable) {
      initAllStyle(this.props.nodes.byId, this.props.viewName);
    }
    const {
      viewKey,
      renderKey
    } = this.props;
    window.viewInstMap[viewKey] = this;
    if (this.props.renderKey !== null && this.props.renderKey !== undefined) {
      this.setParentChild(this, this.props.renderKey);
    }

    setTimeout(() => {
      initStore(this, this.props.node.options.vars);
      initModels(this, this.props.node.options.models);
      this.setState({
        mount: true
      });
      typeof this.props.onMount === 'function' && this.props.onMount();
    })
  }
  componentWillUnmount() {
    typeof this.props.onUnMount === 'function' && this.props.onUnMount();
    const {
      viewKey,
      renderKey
    } = this.props;
    const {
      stateViewKey
    } = this.props;
    delete window.viewInstMap[viewKey];
    delete window.viewInstMap[stateViewKey];
    delete window.nodeVarMap[viewKey];
    delete window.nodeRenderer[viewKey];
    delete window.stateChange[viewKey];

    if (renderKey !== null && renderKey !== undefined) {
      this.deleteParentChild(this, renderKey);
    }
    if (!this.props.editable) {
      destroyAllStyle(this.props.nodes.byId, this.props.viewName);
    }
  }
  render() {
    if (window.abc) {
      console.log(`render-view-${this.props.nodeKey}`);
    }
    const {
      nodeKey,
      parentNodeKey,
      viewKey,
      nodes,
      dispatch,
      dispatchEvent,

      cloneWidget,
      setList,

      className,
      canvasClassName,

      editable,
      inForm,
      titleVisible,
      $this,
      initVars,
      appModels,
      appModelMap,
      appServices,
      appServiceMap,
      globalStore,

      onMount,

      ...rest
    } = this.props;

    const node = nodes.byId[nodeKey];

    if (!this.props.initVars) {
      return <Spin
        loading={true}
        size={30}
        block
        style={{
          width: '100%',
          height: '100%',
          minHeight: '50px',
          ...this.props.style
        }}
        icon={<IconLoading />}>
        <div
          style={{
            width: '100%',
            height: '100%'
          }}>
        </div>
      </Spin>
    }

    let list = (
      <>
        {node.children.map((key) => {
          return <Widget
            key={key}
            nodeKey={key}
            parentNodeKey={nodeKey}
            editable={editable}
            $inner={this.props.$inner}
            get$this={this.props.get$this}>
          </Widget>;
        })}
      </>
    );


    if (this.props.editable) {
      list = (
        <ReactSortable
          className={canvasClassName}
          list={node.children}
          setList={setList}
          animation={150}
          group={{ name: "cloning-group-name" }}
          sort={true}
          clone={cloneWidget}>
          {list}
        </ReactSortable>
      )
    }

    return (
      <div
        {...rest}
        className={className}>
        {this.props.children}
        {list}
      </div>
    )
  }
}

export default wrapHOC(View, 'view');
