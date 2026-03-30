import React, {useEffect,useState,useRef} from "react";
import {
    Button,
    Form,
    Layout,
    Message,
    Pagination,
    Select, Spin,
    Table,
    Tabs,
    Tooltip,
    Typography,
    Divider,
    Empty, Popconfirm, Switch
} from "@arco-design/web-react";
import ModoTabs from '@/components/Tabs';
import FilterForm from '@/components/FilterForm';
import {
    IconDeleteColor, IconMgmtNodeColor,
    IconModelMgrColor,
    IconEyeColor, IconStarFill, IconStarOn,
  IconImageCircleColor
} from "modo-design/icon";
import './index.less'
import {getOntologyList, updateOntologyFavorite} from "@/pages/ontology-graph-preview/api";
import GraphDetail from './pages/graph-detail/graph-detail';
import emptyIcon from "@/pages/object/images/empty.svg";
const Header = Layout.Header;
const Footer = Layout.Footer;
const Content = Layout.Content;

const GraphManager = ()=>{
    const [loading,setLoading]=useState(false);
    const [current,setCurrent] = useState(1);
    const [total,setTotal] = useState(0);
    const [pageSize,setPageSize] = useState(20);
    const [filter,setfilter] = useState({});
    const [allListData, setAllListData] = useState([]);
    const [filterListData, setFilterListData] = useState([]);
    const modoTabsRef = useRef();
    const selectList = [
        {
            type: 'input',
            field: 'ontologyLabel',
            label: '中文名称',
           // labelCol:{ flex: '40px' },
            options: {
                placeholder: '请输入'
            }
        },
        {
            type: 'input',
            field: 'ontologyName',
            label: '英文名称',
          //  labelCol:{ flex: '40px' },
            options: {
                placeholder: '请输入'
            }
        },
        {
            type: 'select',
            field: 'isFavorite',
            label: '收藏',
            options: {
                placeholder: '请选择',
                allowClear: true,
                options: [{
                    label: '是',
                    value: '1'
                }, {
                    label: '否',
                    value: '0'
                }]
            }
        }
    ];
    const filterSearch =(values)=>{
        Object.keys(values).forEach((key) => {
            if (typeof(values[key])=='string' && values[key] && values[key].startsWith('~%') && values[key].endsWith('%')) {
                values[key] = values[key].slice(2, values[key].length - 1);
            }
        });
        const filter = {...values};
        setfilter(filter);
    };
    const getData = ()=>{
        const param = {status:1,published:1};
        setLoading(true);
        getOntologyList(param).then(res=>{
            if(res.data.success){
                setAllListData(res.data.data);
            }
        }).finally(()=>{
            setLoading(false);
        })
    };

    const toggleOntologyStar = (ontology) => {
        const isFavorite = ontology.isFavorite==1?0:1;
        updateOntologyFavorite({
            ontologyId:ontology.id,
            isFavorite:isFavorite
        }).then(res=>{
            if(res.data.success){
                Message.success(`${isFavorite==0?'取消':''}收藏成功`)
            }else{
                Message.error(`${isFavorite==0?'取消':''}收藏失败`)
            }
        }).finally(()=>{
            getData();
        })
    };
    const viewOntology = (item)=>{
        modoTabsRef.current?.addTab({
            key: item.id,
            title: item.ontologyLabel,
            view: (
              <GraphDetail
                key={item.id}
                ontology={item}
                pubVersion={true}
                onChange={()=>{
                    getData();
                }}
              />
            ),
        });
    };
    useEffect(()=>{
        getData()
    },[]);
    useEffect(()=>{
        setFilterListData(allListData.filter(item => {
            let flag = true;
            if (filter.hasOwnProperty('isFavorite')) {
                if (filter.isFavorite == 1) {
                    flag = flag && (item.isFavorite === 1);
                } else if (filter.isFavorite == 0) {
                    flag = flag && (!item.isFavorite || item.isFavorite === 0);
                }
            }
            if (filter.hasOwnProperty('ontologyLabel')) {
                flag = flag && (item.ontologyLabel.toLowerCase().includes(filter.ontologyLabel.toLowerCase()))
            }
            if (filter.hasOwnProperty('ontologyName')) {
                flag = flag && (item.ontologyName.toLowerCase().includes(filter.ontologyName.toLowerCase()))
            }
            return flag;
        }))
    }, [allListData,filter]);
    return (
      <div className='graph-container'>
          <ModoTabs
            title='图谱预览'
            icon={<IconImageCircleColor/>}
            ref={modoTabsRef}>
          <div className="filter-table">
              <Layout style={{ height: '100%' }}>
                  <Header>
                      <FilterForm
                        initialValues={{}}
                        fields={selectList}
                        search={filterSearch}>
                      </FilterForm>
                  </Header>
                  <Content className="page-content">
                      <Spin style={{display: 'block', width: '100%', height: '100%'}} loading={loading}>
                          <Content className="graph-cards-content">
                              {filterListData.length == 0 ? <Empty
                                icon={<img style={{height: '50px'}}
                                           src={emptyIcon}/>}
                                description='暂无数据'
                              /> : <div className="ontology-list">
                                  {filterListData.map(item => {
                                      return (
                                        <div
                                          key={item.id}
                                          className="ontology-item"
                                          onDoubleClick={() => {
                                              viewOntology(item);
                                          }}
                                        >
                                            <div className="ontology-item-header">
                                                <div className="icon">
                                                    <div className="icon-bg">
                                                        <IconModelMgrColor/>
                                                    </div>
                                                </div>
                                                <div className="info">
                                                    <div className="ontology-item-label">
                                                        <Tooltip content={item.ontologyLabel}>
                                                            <span>{item.ontologyLabel}</span>
                                                    </Tooltip></div>
                                                    <div className="ontology-item-name">{item.ontologyName}</div>
                                                </div>
                                                <div className="oper-group">
                                                    <div onClick={() => toggleOntologyStar(item)}>
                                                        {
                                                            item.isFavorite ?
                                                              <IconStarFill
                                                                style={{color: 'var(--color-warning-6)'}}/> :
                                                              <IconStarOn style={{color: 'var(--color-text-2)'}}/>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ontology-item-content">
                                                <div style={{display:'inline-flex'}}>
                                                    <span className="label">描述：</span>
                                                    <Typography.Text ellipsis={{ showTooltip: true }}>
                                                        {item.ontologyDesc || '--'}
                                                    </Typography.Text>
                                                </div>
                                                {/*<div className="sub-info">
                                                    <div className="owner">
                                                        <span className="label">拥有者：</span>
                                                        <span className="value">{item.owner || '--'}</span>
                                                    </div>
                                                    <div className="version">
                                                        <span className="label">版本：</span>
                                                        <span className="value">{item.versionName || '--'}</span>
                                                    </div>
                                                </div>*/}
                                            </div>
                                            <div className="ontology-item-footer">
                                                <div className="info">
                                                    <div>
                                                        <span className="label">更新时间：</span>
                                                        <span className="value">{item.lastUpdate}</span>
                                                    </div>
                                                </div>
                                                <div className="oper-group">
                                                    <Button type="text" size="mini" onClick={() => {
                                                        viewOntology(item);
                                                    }}>
                                                        <IconEyeColor/>
                                                        图谱预览
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                      );
                                  })}
                              </div>}

                          </Content>
                          {/*<Footer className='graph-footer'>
                              <Pagination
                                total={total}
                                current={current}
                                pageSize={pageSize}
                                pageSizeChangeResetCurrent
                                sizeCanChange
                                showTotal
                                showJumper
                                onChange={handlePageChange}/>
                          </Footer>*/}
                      </Spin>
                  </Content>
              </Layout>
          </div>
          </ModoTabs>
      </div>
    )
};
export default GraphManager;
