import { Empty } from '@arco-design/web-react';
import React, { useState, useEffect } from 'react';
import './index.less';
import { IconArrowDown, IconFullscreen, IconFullscreenExit } from 'modo-design/icon';
import { set } from 'lodash';

interface OntologySimulationResultHistoryProps {}

const OntologySimulationResultHistory: React.FC<OntologySimulationResultHistoryProps> = () => {
  return (
    <div className="ontology-simulation-result-history">
      <Empty />
    </div>
  );
};

export default OntologySimulationResultHistory;
