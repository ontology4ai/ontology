import React from 'react';

const ModoReact = global?.parent?.React || global?.React || React;

export const {
	useEffect,
	useState
} = ModoReact

export default ModoReact;