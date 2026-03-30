import React, { useState, useEffect, useMemo } from 'react';
import Widget from '../Widget';
import './style/index.less';

class View extends React.Component {
    constructor(props: any) {
  	 	super(props);
  	}
  	render() {
        const {data} = this.props;
  		return (<div className="modo-view">
            {data.map((node: any) => {
                return <Widget key={node.id} node={node}></Widget>
            })}
        </div>)
  	}
}

export default View;
