import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import Designer from './designer';

function mapStateToProps(state, ownProps) {
    return state
}

const VisualDesigner = connect(mapStateToProps)(Designer);
export default VisualDesigner
