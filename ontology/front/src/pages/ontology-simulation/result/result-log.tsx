import { Empty } from '@arco-design/web-react';
import React, { useState, useEffect } from 'react';
import './index.less';
import { IconArrowDown, IconFullscreen, IconFullscreenExit } from 'modo-design/icon';
import { set } from 'lodash';

interface OntologySimulationResultLogProps {
  log: string;
}

const OntologySimulationResultLog: React.FC<OntologySimulationResultLogProps> = ({ log }) => {
  return <div className="ontology-simulation-result-log">{log || <Empty />}</div>;
};

export default OntologySimulationResultLog;
