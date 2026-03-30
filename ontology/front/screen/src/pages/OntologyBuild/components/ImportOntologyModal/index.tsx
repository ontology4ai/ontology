import React, { useState, useMemo } from 'react';
import { Button, Modal, Input } from '@arco-design/web-react';
import './index.less';
import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowDown,
  IconArrowUp,
  IconRight,
  IconDown,
  IconRefresh,
  IconSearch,
} from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';

interface ImportOntologyModalProps {
  visible: boolean;
  importType: string;
  ontologyId?: string;
  onCancel: () => void;
  onOk: (data: any) => void;
}

const ImportOntologyModal: React.FC<ImportOntologyModalProps> = ({
  visible,
  importType,
  ontologyId,
  onCancel,
  onOk,
}) => {
  const { t, i18n } = useTranslation();   
  const isEnglish = i18n.language === 'en-US';
  const handleOk = () => {
    onOk({});
  };

  const filePath = useMemo(() => [
    t('work'), // "工作"
    t('ontology') // "本体"
  ], [t, i18n.language]);

  const fileDocument = useMemo(() => [
    { 
      label: t('this.pc'), 
      icon: new URL('./assets/icon2.png', import.meta.url).href 
    }, 
    { 
      label: t('work'), 
      icon: new URL('./assets/icon3.png', import.meta.url).href 
    }, 
    { 
      label: t('programs'), 
      icon: new URL('./assets/icon4.png', import.meta.url).href 
    }, 
    { 
      label: t('my.documents'), 
      icon: new URL('./assets/icon5.png', import.meta.url).href 
    }, 
  ], [t, i18n.language]);

  const getModalTitle = () => {
    return t('import.file'); // "导入文件"
  };

  const getFileDescription = () => {
    const fileName = t('abnormal.weather.impact.analysis.ontology'); // "异常天气影响分析本体"
    const fileType = importType === 'code' ? t('ontology.code') : t('ontology.file'); // "代码" : "文件"
    return `${fileName}${fileType}`;
  };

  return (
    <Modal
      getPopupContainer={() => {
        return document.querySelector('.screen-content') || document.body;
      }}
      style={{ width: '70%' }}
      title={null}
      visible={visible}
      footer={null}
      closable={false}
      onOk={() => {
        handleOk();
      }}
      onCancel={() => {
        onCancel();
      }}
      okText={t('open')} // "打开"
      className={`import-ontology-modal ${isEnglish ? 'en': ''}`}
    >
      <div className="import-ontology-bg">
        <img src={new URL(`./assets/bg.png`, import.meta.url).href} />
      </div>
      <div className='import-ontology-modal-main'>
        <div className='import-ontology-modal-title'>
          {getModalTitle()}
          <img onClick={() => { onCancel(); }} src={new URL(`./assets/close.png`, import.meta.url).href} />
        </div>
        <div className='import-ontology-modal-content'>
          <div className="import-ontology">
            <div className="import-ontology-header">
              <div className="import-ontology-header-icon">
                <IconArrowLeft />
                <IconArrowRight />
                <IconArrowDown />
                <IconArrowUp />
              </div>
              <div className="import-ontology-header-title">
                <img src={new URL(`./assets/icon1.png`, import.meta.url).href} />
                <div className="import-ontology-header-title-text">
                  {filePath.map((item, index) => {
                    return (
                      <React.Fragment key={index}>
                        {index > 0 && <IconRight />}
                        <span>{item}</span>
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="import-ontology-header-title-after">
                  <IconDown />
                  <IconRefresh />
                </div>
              </div>
              <Input
                style={{ width: 240, height: 45 }}
                placeholder={t('enter.keyword')} // "请输入关键字"
                suffix={<IconSearch />}
              />
            </div>
            <div className="import-ontology-main">
            <div className="import-ontology-main-left">
              {fileDocument.map((item, index) => {
                return (
                  <div className="import-ontology-main-left-item" key={index}>
                    <img src={item.icon} />
                    {item.label}
                  </div>
                );
              })}
            </div>
              <div className="import-ontology-main-right">
                <div className={`import-ontology-file ${importType}`}>
                  <img src={new URL(`./assets/file.png`, import.meta.url).href} />
                  <div>{getFileDescription()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='import-ontology-footer'>
          <Button onClick={() => onCancel()}>
            {t('cancel')} {/* "取消" */}
          </Button>
          <Button onClick={() => handleOk()} type="primary">
            {t('open')} {/* "打开" */}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportOntologyModal;