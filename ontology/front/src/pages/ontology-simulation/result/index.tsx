import {} from '@arco-design/web-react';
import React, { useState, useEffect } from 'react';
import './index.less';
import { IconArrowDown, IconFullscreen, IconFullscreenExit } from 'modo-design/icon';
import OntologySimulationResultEffect from './result-effect';
import OntologySimulationResultSummary from './result-summary';
import OntologySimulationResultLog from './result-log';
import OntologySimulationResultHistory from './result-history';

interface OntologySimulationResultProps {
  logData: {
    trackId: string;
    objectName: string;
    objectLabel: string;
    log: string;
    params: object;
    actionName: string;
    ontologyId: string;
  };
}

const OntologySimulationResult: React.FC<OntologySimulationResultProps> = ({ logData }) => {
  const { trackId, objectName, params, log, objectLabel, actionName, ontologyId } = logData || {};

  const [visible, setVisible] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  const tabs = [
    {
      title: '分析总结',
      key: '1',
    },
    {
      title: '影响明细',
      key: '2',
    },
    {
      title: '日志',
      key: '3',
    },
    {
      title: '历史记录',
      key: '4',
      disabled: true,
    },
  ];

  const [activeTab, setActiveTab] = useState('');

  const changeTabs = (key: string) => {
    setActiveTab(key);
  };

  useEffect(() => {
    if (activeTab) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [activeTab]);
  return (
    <div
      className="ontology-simulation-result"
      style={{
        position: visible ? (fullScreen ? 'fixed' : 'absolute') : 'relative',
        height: visible ? (fullScreen ? '100vh' : '50%') : '55px',
        width: fullScreen ? '100vw' : '100%',
      }}
    >
      <div className="ontology-simulation-result-header">
        <div className="ontology-simulation-result-tabs">
          {tabs.map(tab => {
            return (
              <div
                onClick={() => !tab.disabled && changeTabs(tab.key)}
                className={
                  (activeTab === tab.key
                    ? 'active ontology-simulation-result-tabs-item'
                    : 'ontology-simulation-result-tabs-item') + (tab.disabled ? ' disabled' : '')
                }
                key={tab.key}
              >
                {tab.title}
              </div>
            );
          })}
        </div>

        {visible ? (
          <div className="ontology-simulation-result-header-right">
            {fullScreen ? (
              <IconFullscreenExit onClick={() => setFullScreen(false)} />
            ) : (
              <>
                <IconFullscreen onClick={() => setFullScreen(true)} />
                <IconArrowDown onClick={() => setActiveTab('')} />
              </>
            )}
          </div>
        ) : null}
      </div>
      <div className="ontology-simulation-result-main">
        {activeTab === '1' ? (
          <OntologySimulationResultSummary
            trackId={trackId}
            objectName={objectName}
            objectLabel={objectLabel}
            params={params}
            actionName={actionName}
          />
        ) : null}
        {activeTab === '2' ? (
          <OntologySimulationResultEffect
            trackId={trackId}
            objectName={objectName}
            ontologyId={ontologyId}
          />
        ) : null}
        {activeTab === '3' ? <OntologySimulationResultLog log={log} /> : null}
        {activeTab === '4' ? <OntologySimulationResultHistory /> : null}
      </div>
    </div>
  );
};

export default OntologySimulationResult;
