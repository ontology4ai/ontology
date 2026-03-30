import React, { useState, useEffect, useMemo } from 'react';
import View from 'packages/modo-view/src/views/core/src/components/View';
import './style/index.less';

const demo = require('./mock/form.json');

class FormDesigner extends React.Component {
  	constructor(props: any) {
  	 	super(props);
  	 	this.state = {
  	 		data: demo
  	 	};
  	}
  	render() {
  		const { data } = this.state;
	    return (
		    <div className="form-designer">
		    	
		    </div>
	  	);
	}
}

export default FormDesigner;
