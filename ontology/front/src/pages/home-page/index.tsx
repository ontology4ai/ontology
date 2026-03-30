import React, { useState,useRef } from 'react';
import './style/index.less';
import banner from './imgs/banner.png';
import { Button, Spin, Empty } from '@arco-design/web-react';
import arrow from './imgs/arrow.svg';
import icon1 from './imgs/icon1.svg';
import icon2 from './imgs/icon2.svg';
import icon3 from './imgs/icon3.svg';
import icon4 from './imgs/icon4.svg';
import ontology from './imgs/ontology.png';
import ontology2 from './imgs/ontology2.png';
import videoPng from './imgs/video-cover.png';
import { IconRefreshColor, IconArrowDown, IconCross} from 'modo-design/icon';
import getAppName from "modo-plugin-common/src/core/src/utils/getAppName";
import { recommend, listChanged } from './api';
import { useEffect } from '@/react';
import emptyIcon from '@/pages/object/images/empty.svg';

const env = process.env.NODE_ENV;
const rootPath = env === 'production' ? '/ontology/_file/ext/ontology/dist/_resource_' : '/static';

const appName = getAppName();
const StepMap = [
  {
    img: icon1,
    label: '建本体',
    desc: '通过本体设计器构建本体，定义本体的对象、关系 逻辑和动作。',
  },
  {
    img: icon2,
    label: '见本体',
    desc: '本体构建过程中，支持提供图形化的方式进行本体预览和探索。',
  },
  {
    img: icon3,
    label: '演本体',
    desc: '基于本体模型模拟真实的业务流程，预测不同策略的可能结果。',
  },
  {
    img: icon4,
    label: '用本体',
    desc: '通过本体赋能智能体，使得AI的业务执行与推理具备可解释性。',
  },
];
const HomePage = () => {
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [recommendData, setRecommendData] = useState([]);
  const [listChangedData, setListChangedData] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    current: 1,
    pageSize: 9,
    totalPages: 0,
  });
  const [listPagination, setListPagination] = useState({
    total: 0,
    current: 1,
    pageSize: 10,
    totalPages: 0,
  });

  const handleStartBuilding = () => {
    const currentHref = window.location.href;
    const newHref = currentHref.replace(/\/[^/]*$/, '/ontology_manager');
    window.location.href = newHref;
  };
  const openDocument = ()=>{
    let url = `${window.location.protocol}//${location.host}/${appName}/document`;
    window.open(url)

  };

  const handlePlay = () => {
    setVideoModalVisible(true);
  };

  const getRecommend = () => {
    setRecommendLoading(true);
    recommend({
      status: 1,
      page: pagination.current,
      limit: pagination.pageSize,
    })
      .then(res => {
        if (Array.isArray(res?.data?.data?.content)) {
          setRecommendData(res?.data?.data?.content);

          setPagination({
            total: res?.data.data.totalElements,
            totalPages: res?.data.data.totalPages,
            current: res?.data.data.pageable.pageNumber + 1,
            pageSize: res?.data.data.size,
          });
        }
      })
      .finally(() => {
        setRecommendLoading(false);
      });
  };
  const getListChanged = () => {
    setListLoading(true);
    listChanged({
      page: listPagination.current,
      limit: listPagination.pageSize,
    })
      .then(res => {
        if (Array.isArray(res?.data?.data?.content)) {
          if (listPagination.current === 1) {
            setListChangedData(res?.data?.data?.content);
          } else {
            setListChangedData(prev => [...prev, ...res?.data?.data?.content]);
          }

          setListPagination({
            total: res?.data.data.totalElements,
            totalPages: res?.data.data.totalPages,
            current: res?.data.data.pageable.pageNumber + 1,
            pageSize: res?.data.data.size,
          });
        }
      })
      .finally(() => {
        setListLoading(false);
      });
  };
  const handleOpenGraph=(ontology)=>{
    let url = `${window.location.protocol}//${location.host}/${appName}/ontology_detail/${ontology.id}`;
    window.open(url);
  };
  const handleRefresh = () => {
    let nextPage = 1;
    if (pagination.current < pagination.totalPages) {
      nextPage = pagination.current + 1;
    }

    setPagination(prev => ({
      ...prev,
      current: nextPage,
    }));
  };
  const handleLoadMore = () => {
    if (listPagination.current < listPagination.totalPages) {
      setListPagination(prev => ({
        ...prev,
        current: prev.current + 1,
      }));
    }
  };
  useEffect(() => {
    if (listPagination.current > 0) {
      getListChanged();
    }
  }, [listPagination.current]);
  useEffect(() => {
    if (pagination.current > 0) {
      getRecommend();
    }
  }, [pagination.current]);
  useEffect(() => {
    getRecommend();
    getListChanged();
  }, []);
  const VideoPlayer = ({ onClose }) => (
    // 视频弹窗组件
    <div className='modal-overlay' >
      <IconCross onClick={onClose} className='close-btn'/>
      <div className='modal-container'>
        <video autoPlay controls width="100%">
          <source src={ `${rootPath}/lib/videos/本体构建操作演示.mp4`} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
  return (
    <div className="home-page">
      <div className="banner">
        <img src={banner} alt="" className="bg" />
        <div className="header">
          <div className="title">欢迎来到数智本体平台</div>
          <div className="desc">
            数智本体是连接数据与业务的桥梁，将业务数据、逻辑和动作统一建模，让AI以结构化的方式理解并准确执行业务。
          </div>
        </div>
        <div className="detail">
          <div className="left">
            <div className="title">快速构建本体</div>
            <div className="desc">
              基于业务场景，定义本体中的对象、关系、逻辑、动作，快速完成本体构建
            </div>
            <div className="btns">
              <Button type="primary" onClick={handleStartBuilding}>
                开始本体构建
              </Button>
              <Button type="outline" onClick={()=>openDocument()} style={{marginLeft:'10px'}}>
                帮助文档
              </Button>
            </div>

          </div>
          <div className="right">
            {StepMap.map((item, index) => (
              <React.Fragment key={item.label}>
                <div className="warp">
                  <img src={item.img} alt="" />
                  <div className="label">{item.label}</div>
                  <div className="desc">{item.desc}</div>
                </div>
                {index < StepMap.length - 1 && <img src={arrow} alt="" className="arrow-icon" />}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div  className={`video-container ${videoModalVisible ? 'hide' : ''}`}>
          <img src={videoPng}  className="custom-video" alt=""/>
          <div className="custom-play-btn" onClick={handlePlay}>
            <div className="play-icon"/>
          </div>
        </div>
      </div>
      <div className="content">
        <div className="left card">
          <div className="card-header">
            <span className="title">推荐本体</span>
            {recommendData.length > 0 && (
              <Button type="text" onClick={handleRefresh}>
                <IconRefreshColor />
                换一批
              </Button>
            )}
          </div>
          <Spin loading={recommendLoading} className="card-content grid">
            {recommendData.length > 0 ? (
              (recommendData || []).map(item => (
                <div className="ontology-card" key={item.id} onDoubleClick={()=>handleOpenGraph(item)}>
                  <div className="header">
                    <img src={ontology} alt="" />
                    <div className="info">
                      <div className="cn">{item.ontologyLabel}</div>
                      <div className="en">{item.ontologyName}</div>
                    </div>
                  </div>
                  <div className="desc">
                    <div className="label">描述：</div>
                    <div className="value">{item.ontologyDesc || '--'}</div>
                  </div>
                  <div className="footer">
                    <div>
                      <span className="label">更新时间：</span>
                      <span className="value">{item.lastUpdate}</span>
                    </div>
                    <div>
                      <span className="label">版本：</span>
                      <span className="value">{item.versionName}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Empty
                icon={
                  <div
                    style={{
                      display: 'inline-flex',
                      width: 48,
                      height: 48,
                      justifyContent: 'center',
                    }}
                  >
                    <img src={emptyIcon} alt="暂无数据" />
                  </div>
                }
                description="暂无数据"
              />
            )}
          </Spin>
        </div>
        <div className="right card">
          <div className="card-header">
            <span className="title">最近变更</span>
          </div>
          <Spin loading={listLoading} className="card-content list">
            {listChangedData.length > 0 ? (
              listChangedData.map(item => (
                <div className="list-item" key={item.id}>
                  <img src={ontology2} alt="" />
                  <div className="info">
                    <div className="title">
                      {item.ontologyLabel}（{item.ontologyName}）
                    </div>
                    <div className="time">更新时间：{item.lastUpdate}</div>
                  </div>
                </div>
              ))
            ) : (
              <Empty
                icon={
                  <div
                    style={{
                      display: 'inline-flex',
                      width: 48,
                      height: 48,
                      justifyContent: 'center',
                    }}
                  >
                    <img src={emptyIcon} alt="暂无数据" />
                  </div>
                }
                description="暂无数据"
              />
            )}
          </Spin>
          {listChangedData && listChangedData.length > 0 && (
            <Button type="text" className="card-footer" onClick={handleLoadMore}>
              {listPagination.current >= listPagination.totalPages ? '暂无更多数据' : '展开更多'}
              {listPagination.current < listPagination.totalPages && <IconArrowDown />}
            </Button>
          )}
        </div>
      </div>
      { videoModalVisible && <VideoPlayer onClose={()=>{
        setVideoModalVisible(false)
      }} />
      }
    </div>
  );
};

export default HomePage;
