import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import Renderer from './renderer';

function mapStateToProps(state, ownProps) {
    return {
    	state,
    	viewKey: ownProps.viewKey
    }
}

const VisualDesigner = connect(mapStateToProps)(Renderer);
export default VisualDesigner
