import React , { useState} from 'react';
import { ReactSortable } from "react-sortablejs";
import { Spin, Carousel } from '@arco-design/web-react';
import wrapHOC from '../../hoc/wrap';
import Widget from "../../";
import './style/index.less';

function ImgComponent(props) {
  const { src, style, className } = props;
  return (
    <div style={style} className={className}>
      <img
        src={src}
        style={{
            width: '100%',
            height: '100%'
        }}
      />
    </div>
  );
}

class ModoCarousel extends React.Component {
    constructor(props: any) {
        super(props);
        this.carousel = React.createRef();
    }
    setRef = (name) => {
        this.props.dispatch({
            type: 'SETREF',
            name: name,
            ref: this
        });
    };
    deleteRef = (name) => {
        this.props.dispatch({
            type: 'DELETEREF',
            name: name,
            ref: this
        });
    };
    componentDidMount() {
        this.setRef(this.props.name);
    }
    componentWillUnmount() {
        this.deleteRef(this.props.name)
    }
    render() {
        if (window.abc) {
            console.log(`render-carousel-${this.props.nodeKey}`);
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
            loading,

            editable,
            inForm,
            titleVisible,
            get$this,
            initVars,
            appModels,
            appModelMap,
            appServices,
            appServiceMap,
            globalStore,
            $inner,

            ...rest
        } = this.props;

        const node = nodes.byId[nodeKey];
        let list = (
            <>
                {node.children.map((key : string) => {
                    return (
                        <div style={{height: '100%'}}>
                            <Widget
                                key={key}
                                nodeKey={key}
                                parentNodeKey={nodeKey}
                                editable={editable}
                                inForm={inForm}
                                $inner={this.props.$inner}
                                get$this={this.props.get$this}>
                            </Widget>
                        </div>
                    )
                })}
            </>
        );
        /* if (this.props.editable) {
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
            );
        } */
        return (
            <div
                className={className}
                style={rest.style}
                onMouseLeave={rest.onMouseLeave}
                onMouseOver={rest.onMouseOver}
                onClick={rest.onClick}>
                {this.props.children}
                <Carousel
                    carousel={this.carousel}
                    className={className}
                    {...rest}
                    autoPlay={rest.autoPlay ? {
                        interval: 2000,
                        hoverToPause: true
                    } : false}>
                    {node.children.map((key : string) => {
                        return (
                            <div
                                key={key}
                                style={{height: '100%'}}>
                                <Widget
                                    key={key}
                                    nodeKey={key}
                                    parentNodeKey={nodeKey}
                                    editable={editable}
                                    inForm={inForm}
                                    $inner={this.props.$inner}
                                    get$this={this.props.get$this}>
                                </Widget>
                            </div>
                        )
                    })}
                </Carousel>
            </div>
        )
    }
}

export default wrapHOC(ModoCarousel, 'carousel');
