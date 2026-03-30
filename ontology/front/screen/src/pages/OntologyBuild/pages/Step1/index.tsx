import { Button, Spin, Table } from "@arco-design/web-react";
import axios from 'axios';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Step2 from '../Step2';
import './style/index.less';

interface Step1Props {
  push?: any;
}

interface TableColumn {
  name: string;
  label: string;
}

interface TableDetail {
  tableColumn: TableColumn[];
  tableData: any[];
  tableInfo: any;
}

const Step1: React.FC<Step1Props> = ({ push }) => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<number>(1);
  const [active, setActive] = useState<string | null>(null);
  const [tableDetailLoading, setTableDetailLoading] = useState<boolean>(true);
  const [tableDetail, setTableDetail] = useState<TableDetail>({
    tableColumn: [],
    tableData: [],
    tableInfo: {}
  });
  const isEnglish = i18n.language === 'en-US';
  const step2Ref = useRef<any>(null);

  const selectNode = (key: string) => {
    setActive(key);
    getData(key);
  };

  const getData = (tableName: string) => {
    setTableDetailLoading(true);
    axios.get(
      '/ontology_show/_api/object/type/table/detail',
      {
        params: {
          tableName
        }
      }
    ).then(res => {
      if (res.data.data && Array.isArray(res.data.data.tableColumn)) {
        setTableDetail(res.data.data);
      }
    }).catch(err => {
      console.error('Error fetching data:', err);
    }).finally(() => {
      setTableDetailLoading(false);
    });
  };

  const goToNextStep = () => {
    setStep(2);
  };

  const goToPrevStep = () => {
    setStep(1);
  };

  const handlePublish = () => {
    if (step2Ref.current && typeof step2Ref.current.publish === 'function') {
      step2Ref.current.publish();
    }
  };

  const dynamicColumns = tableDetail.tableColumn.map((item: TableColumn) => {
    return {
      dataIndex: item.name,
      title: item.label
    };
  });

  const step1Img = step === 1 
  ? new URL('./imgs/step1.png', import.meta.url).href 
  : new URL('./imgs/step1_finish.png', import.meta.url).href;

const step2Img = step === 1 
  ? new URL('./imgs/step2.png', import.meta.url).href 
  : new URL('./imgs/step2_active.png', import.meta.url).href;

  // 获取图标名称的辅助函数
  const getIconSrc = (baseName: string, isActive: boolean) => {
    const iconSuffix = isActive ? '_active.png' : '.png';
    return new URL(`./imgs/${baseName}${iconSuffix}`, import.meta.url).href;
  };

  // 获取背景图片的辅助函数
  const getBgSrc = (isActive: boolean) => {
    return new URL(`./imgs/rect_bg${isActive ? '_active' : ''}.png`, import.meta.url).href;
  };

  const getActiveCardIcon = (activeCard: string | null) => {
    if (!activeCard) return 'icon1'; // 默认图标
  
    if (activeCard.startsWith('ods_customer_info') || activeCard.startsWith('dwd_fact_customer_detail')) {
      return 'icon1';
    } else if (activeCard.startsWith('ods_order_info') || activeCard.startsWith('dwd_fact_order_detail')) {
      return 'icon2';
    } else if (activeCard.startsWith('road_info') || activeCard.startsWith('road_route')) {
      return 'icon3';
    } else if (activeCard.startsWith('warehouse_detail') || 
               activeCard.startsWith('ods_product_info') || 
               activeCard.startsWith('dwd_fact_product_detail')) {
      return 'icon4';
    }
  
    return 'icon1'; // 默认图标
  };

  return (
    <>
      <div className={`onto-step1 ${isEnglish? 'en':''}`}>
        <div className='step1-header'>
          {t('build')} {/* 建本体 */}
        </div>
        <div className='step1-container'>
          <div className='left'>
            <div className='menu'>
              <div className='menu-item'>
                <div className='menu-item-icon'>
                  <img src={step1Img} />
                </div>
                <div className='menu-item-content'>
                  <div className='title'>{t('data.prep.before.build')}</div> {/* 数据准备 */}
                  <div className='descr'>{t('data.prep.before.build.description')}</div>
                </div>
              </div>
              <div className='menu-item'>
                <div className='menu-item-icon'>
                  <img src={step2Img} />
                </div>
                <div className='menu-item-content'>
                  <div className='title'>{t('ontology.build.steps')}</div> {/* 本体构建 */}
                  <div className='descr'>{t('ontology.build.steps.description')}</div>
                </div>
              </div>
            </div>
          </div>
          <div className='right'>
            <div className='right-center'>
              {step === 1 && (
                <div className="graph">
                  <div
                    className={`card card-1 ${active === 'ods_customer_info' ? 'active' : ''}`}
                    onClick={() => { selectNode('ods_customer_info') }}>
                    <img className="light-card-bg" src={getBgSrc(active === 'ods_customer_info')} />
                    <img className="card-icon" src={getIconSrc('icon1', active === 'ods_customer_info')} />
                    <div className="card-title">
                      ods_customer_info
                    </div>
                    <div className="card-descr">
                      {t('table.ods_customer_info.description')} {/* 直接从业务系统采集的原始客户数据 */}
                    </div>
                  </div>
                  <div className="line line-1">
                    <img src={new URL('./imgs/line1.png', import.meta.url).href} />
                  </div>
                  <div
                    className={`card card-1-1 ${active === 'dwd_fact_customer_detail' ? 'active' : ''}`}
                    onClick={() => { selectNode('dwd_fact_customer_detail') }}>
                    <img className="light-card-bg" src={getBgSrc(active === 'dwd_fact_customer_detail')} />
                    <img className="card-icon" src={getIconSrc('icon1', active === 'dwd_fact_customer_detail')} />
                    <div className="card-title">
                      dwd_fact_customer_detail
                    </div>
                    <div className="card-descr">
                      {t('table.dwd_fact_customer_detail.description')} {/* 经过清洗、整合、标准化后,生成的客户明细表 */}
                    </div>
                  </div>
                  <div className="line line-2">
                    <img src={new URL('./imgs/line1.png', import.meta.url).href} />
                  </div>
                  <div className="mini-card mini-card-1">
                    <img src={new URL('../../imgs/mini-card-1.png', import.meta.url).href} />
                  </div>
                  <div
                    className={`card card-2 ${active === 'ods_order_info' ? 'active' : ''}`}
                    onClick={() => { selectNode('ods_order_info') }}>
                    <img className="light-card-bg" src={getBgSrc(active === 'ods_order_info')} />
                    <img className="card-icon" src={getIconSrc('icon2', active === 'ods_order_info')} />
                    <div className="card-title">
                      ods_order_info
                    </div>
                    <div className="card-descr">
                      {t('table.ods_order_info.description')} {/* 直接从业务系统采集的原始订单数据 */}
                    </div>
                  </div>
                  <div className="line line-3">
                    <img src={new URL('./imgs/line1.png', import.meta.url).href} />
                  </div>
                  <div
                    className={`card card-2-1 ${active === 'dwd_fact_order_detail' ? 'active' : ''}`}
                    onClick={() => { selectNode('dwd_fact_order_detail') }}>
                    <img className="light-card-bg" src={getBgSrc(active === 'dwd_fact_order_detail')} />
                    <img className="card-icon" src={getIconSrc('icon2', active === 'dwd_fact_order_detail')} />
                    <div className="card-title">
                      dwd_fact_order_detail
                    </div>
                    <div className="card-descr">
                      {t('table.dwd_fact_order_detail.description')} {/* 经过清洗、整合、标准化后，生成的订单明细事实表 */}
                    </div>
                  </div>
                  <div className="line line-4">
                    <img src={new URL('./imgs/line1.png', import.meta.url).href} />
                  </div>
                  <div className="mini-card mini-card-2">
                    <img src={new URL('../../imgs/mini-card-2.png', import.meta.url).href} />
                  </div>
                  <div style={{ transform: 'translate(0, -154px)' }}>
                    <div
                      className={`card card-4 ${active === 'road_info' ? 'active' : ''}`}
                      onClick={() => { selectNode('road_info') }}>
                      <img className="light-card-bg" src={getBgSrc(active === 'road_info')} />
                      <img className="card-icon" src={getIconSrc('icon3', active === 'road_info')} />
                      <div className="card-title">
                        road_info
                      </div>
                      <div className="card-descr">
                        {t('table.road_info.description')} {/* 合作伙伴授权的原始公路数据 */}
                      </div>
                    </div>
                    <div className="line line-6">
                      <img src={new URL('./imgs/line1.png', import.meta.url).href} />
                    </div>
                    <div
                      className={`card card-4-1 ${active === 'road_route' ? 'active' : ''}`}
                      onClick={() => { selectNode('road_route') }}>
                      <img className="light-card-bg" src={getBgSrc(active === 'road_route')} />
                      <img className="card-icon" src={getIconSrc('icon3', active === 'road_route')} />
                      <div className="card-title">
                        road_route
                      </div>
                      <div className="card-descr">
                        {t('table.road_route.description')} {/* 经过清洗、整合、标准化后，生成的公路明细事实表 */}
                      </div>
                    </div>
                    <div className="line line-7">
                      <img src={new URL('./imgs/line1.png', import.meta.url).href} />
                    </div>
                    <div className="mini-card mini-card-4">
                      <img src={new URL('../../imgs/mini-card-4.png', import.meta.url).href} />
                    </div>
                    <div
                      className={`card card-6 ${active === 'warehouse_detail' ? 'active' : ''}`}
                      onClick={() => { selectNode('warehouse_detail') }}>
                      <img className="light-card-bg" src={getBgSrc(active === 'warehouse_detail')} />
                      <img className="card-icon" src={getIconSrc('icon4', active === 'warehouse_detail')} />
                      <div className="card-title">
                        warehouse_detail
                      </div>
                      <div className="card-descr">
                        {t('table.warehouse_detail.description')} {/* 仓库明细表 */}
                      </div>
                    </div>
                    <div className="long-line long-line-2">
                      <img src={new URL('./imgs/line2.png', import.meta.url).href} />
                    </div>
                    <div className="mini-card mini-card-6">
                      <img src={new URL('../../imgs/mini-card-6.png', import.meta.url).href} />
                    </div>
                    <div
                      className={`card card-7 ${active === 'ods_product_info' ? 'active' : ''}`}
                      onClick={() => { selectNode('ods_product_info') }}>
                      <img className="light-card-bg" src={getBgSrc(active === 'ods_product_info')} />
                      <img className="card-icon" src={getIconSrc('icon4', active === 'ods_product_info')} />
                      <div className="card-title">
                        ods_product_info
                      </div>
                      <div className="card-descr">
                        {t('table.ods_product_info.description')} {/* 直接从业务系统采集的原始订单数据 */}
                      </div>
                    </div>
                    <div className="line line-9">
                      <img src={new URL('./imgs/line1.png', import.meta.url).href} />
                    </div>
                    <div
                      className={`card card-7-1 ${active === 'dwd_fact_product_detail' ? 'active' : ''}`}
                      onClick={() => { selectNode('dwd_fact_product_detail') }}>
                      <img className="light-card-bg" src={getBgSrc(active === 'dwd_fact_product_detail')} />
                      <img className="card-icon" src={getIconSrc('icon4', active === 'dwd_fact_product_detail')} />
                      <div className="card-title">
                        dwd_fact_product_detail
                      </div>
                      <div className="card-descr">
                        {t('table.dwd_fact_product_detail.description')} {/* 经过清洗、整合、标准化后，生成的订单明细事实表 */}
                      </div>
                    </div>
                    <div className="line line-10">
                      <img src={new URL('./imgs/line1.png', import.meta.url).href} />
                    </div>
                    <div className="mini-card mini-card-7">
                      <img src={new URL('../../imgs/mini-card-7.png', import.meta.url).href} />
                    </div>
                    <div className="card-8" />
                  </div>
                </div>
              )}
              {step === 2 && (
                <Step2 ref={step2Ref}/>
              )}
            </div>
            <div className='right-bottom'>
              {step === 1 ? (
                <Button className='color-btn' onClick={goToNextStep}>{t('next')}</Button>
              ) : (
                <>
                  <Button onClick={goToPrevStep}>{t('back')}</Button>
                  <Button className='color-btn' onClick={handlePublish}>{t('publish.ontology')}</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Spin
        className={`node-info-container-spin ${active ? 'expand' : ''}`}
        size={40}
        loading={tableDetailLoading}>
        <div className={`node-info-container ${active ? 'expand' : ''}`}>
          <div className="node-info-header">
            <img className='header-bg' src={new URL('./imgs/header_bg.png', import.meta.url).href} />
            <div className="icon">
              <img src={getIconSrc(getActiveCardIcon(active || ''), true)} />
            </div>
            <div className="name-label">
              {`${tableDetail.tableInfo.name || '--'}(${tableDetail.tableInfo.label || '--'})`}
            </div>
            <div className="descr">
              {`${t('description.field')}：${tableDetail.tableInfo.desc || '--'}`} {/* 描述： */}
            </div>
            <div
              className="expand"
              onClick={() => {
                setActive(null);
              }}>
              <img src={new URL('./imgs/arrow2.png', import.meta.url).href} />
            </div>
          </div>
          <div className="node-info-content">
            <div className="pos-right">
              <img className='table-bg' src={new URL('./imgs/table_bg.png', import.meta.url).href} />
              <Table
                border={false}
                scroll={{
                  y: 215
                }}
                columns={[
                  {
                    dataIndex: 'index',
                    title: '',
                    width: 50,
                    render: (_col: any, _row: any, index: number) => {
                      return index + 1;
                    }
                  }
                ].concat(dynamicColumns as any)}
                data={tableDetail.tableData}
                pagination={false} />
            </div>
          </div>
        </div>
      </Spin>
    </>
  );
};

export default Step1;