import React from 'react';
import { Drawer, Empty, Pagination, Spin, Button, Message, Tag } from '@arco-design/web-react';
import { IconStarFill } from 'modo-design/icon';
import './style/index.less';
import { getAssetData } from './api';
import assetIcon from './images/asset.png';
// const searchJson = require('./mock/search.json');
class TreeMapDrawer extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = {
      assetData: [],
      drawerLoading: false,
      page: {
        total: 0,
        pageSize: 10,
        current: 1,
      },
    };
  }

  toDetail = item => {
    console.log(item);
    // http://localhost:3010/modo/datago/render/asset_detail.fragment?tabId=CMCMHQBASSTB1900000052&tabHidden=false&theme=dark
    // window.open(
    //   `/modo/datago/render/asset_detail.fragment?tabId=${item.assetId}&tabHidden=false&theme=dark`,
    // );

    // http://10.255.119.46:9080/_api/open/tokenRoute/moda?url=http://10.255.119.46:9080/datago/render/asset_detail.fragment?tabId=206.dim.t_dim_sd_bass_std1_0002&tabHidden=false&theme=dark

    // if (
    //   item.assetId.indexOf('-') > -1 ||
    //   item.assetId.indexOf('{') > -1 ||
    //   item.assetId.indexOf('}') > -1
    // ) {
    //   // Message.error(`查询失败，失败原因：${'assetId中不能存在-、{、}等特殊字符'}`);
    //   Message.error(`查询失败，失败原因：${'assetId存在特殊字符，我们会尽快处理'}`);
    // } else {
    const assetId = encodeURIComponent(item.assetId);
    window.open(
      `/_api/open/tokenRoute/moda?url=${window.location.protocol}//${window.location.host}/datago/render/asset_detail.fragment?tabId=${assetId}&tabHidden=false&theme=dark`,
    );
    // }
  };

  pageNumChange = (current, pageSize) => {
    // console.log(current, pageSize);
    const { page } = this.state;
    const { searchKey, curSysCode } = this.props;
    const params = {
      pageNum: current,
      pageSize: pageSize,
      sysCode: curSysCode, // 系统编码
      label: searchKey,
    };
    this.setState({ page: { ...page, current, pageSize } }, () => this.getAsset(params));
  };

  getAsset = params => {
    // console.log('getData', params);
    // http://10.19.28.145/datago/api/data/map/asset/search?pageNum=0&pageSize=10&sysCode=swlvtn0162&label=%E8%B4%A2
    this.setState(() => ({ drawerLoading: true })); // setState立即执行
    const tParams = {
      pageNum: params.pageNum - 1,
      pageSize: params.pageSize,
      sysCode: params.sysCode, // 系统编码
      label: params.label, // 标签
    };
    // 测试
    // const tParams = {
    //   pageNum: params.pageNum - 1,
    //   pageSize: params.pageSize,
    //   sysCode: 'swlvtn0162', // 系统编码
    //   label: params.label, // 标签
    // };
    getAssetData(tParams)
      .then(res => {
        this.setState(() => ({ drawerLoading: false })); // setState立即执行
        if (res.data.success) {
          // console.log('getAssetData', res);

          if (res.data.data && res.data.data.content && res.data.data.content.length > 0) {
            // const treeData = this.mapTree(res.data.data);
            // console.log('getAssetData', res.data.data);
            const tdata = res.data.data;
            if (tdata.content.length > 0) {
              tdata.content.forEach(item => {
                if (item.tagLabel && item.tagLabel.length > 0) {
                  item.tagLabelArr = item.tagLabel.split(',');
                } else {
                  item.tagLabelArr = [];
                }
              });
            }
            this.setState({
              assetData: tdata.content,
              page: {
                total: tdata.totalElements,
                pageSize: params.pageSize,
                current: params.pageNum,
              },
            });
          }
          // 测试数据
          // const tdata = searchJson.data;
          // this.setState({
          //   assetData: tdata.content,
          //   page: {
          //     total: tdata.totalElements,
          //     pageSize: params.pageSize,
          //     current: params.pageNum,
          //   },
          // });
        } else {
          Message.error(`查询失败，失败原因：${res.data.devMsg}`);
        }
      })
      .catch(err => {
        console.log(err);
        this.setState(() => ({ drawerLoading: false })); // setState立即执行
        Message.error(`查询失败，失败原因：${err}`);
      });
  };

  keepOneDecimal(num) {
    let result = parseFloat(num);
    if (Number.isNaN(result)) {
      return '';
    }
    result = Math.round(num * 10) / 10;
    return result;
  }

  componentDidMount() {
    const tParmas = {
      pageNum: 1,
      pageSize: 10,
      sysCode: this.props.curSysCode, // 系统编码
      label: this.props.searchKey, // 系统编码
    };
    this.getAsset(tParmas);
  }

  componentWillUnmount() {}

  render() {
    const { drawerLoading, assetData, page } = this.state;
    const { visible, changeVisible } = this.props;
    return (
      <Drawer
        className="treeMapDrawer"
        width="40%"
        title={<span>搜索结果 </span>}
        visible={visible}
        footer={
          <Pagination {...page} showTotal simple sizeCanChange onChange={this.pageNumChange} />
        }
        onCancel={() => {
          changeVisible(false);
        }}
      >
        <Spin loading={drawerLoading} style={{ display: 'block' }} tip="数据正在加载中...">
          {assetData.length > 0 ? (
            assetData.map(element => (
              <div className="wrap" key={element.assetId}>
                <div className="main">
                  <div className="top">
                    <div className="img">
                      <img src={assetIcon} alt="" />
                    </div>
                    <div className="content">
                      <div className="">
                        <span className="name">{element.assetCode}</span>
                        <span className="label">{element.assetLabel}</span>
                        {/* <span className="tag">
                        <Tag color="arcoblue" size="small">
                          黑卡
                        </Tag>
                      </span> */}
                      </div>
                      <p className="desc">描述：{element.assetDescr}</p>
                    </div>
                  </div>
                  <div className="bottom">
                    {/* <div className="arch">
                      <span className="title">编目：</span>
                      <span className="text">{element.archFullPathLabel}</span>
                    </div> */}
                    <div className="arch">
                      <span className="title">标签：</span>
                      <span className="tag">
                        {
                          element.tagLabelArr.length > 0 ? (element.tagLabelArr.map(it => (
                            <Tag color="arcoblue" size="small">
                              {it}
                            </Tag>
                          ))):null
                        }
                      </span>
                      {/* <span className="text">{element.archFullPathLabel}</span> */}
                    </div>
                    <div className="organ">
                      <span className="title">团队：</span>
                      <span className="text">{element.teamLabel}</span>
                    </div>
                    {/* <div>
                      <span className="title">评分：</span>
                      <IconStarFill
                        style={{
                          fontSize: 12,
                          color: '#F7BA1E',
                          marginRight: 5,
                          verticalAlign: 'text-top',
                        }}
                      />
                      <span className="text">{this.keepOneDecimal(element.score)}</span>
                    </div> */}
                  </div>
                </div>
                <div className="action">
                  <Button type="primary" size="mini" onClick={() => this.toDetail(element)}>
                    查看详情
                  </Button>
                  {/* <Button type="text" size="mini" icon={<IconBubbleChart />}>
                    分布图
                  </Button> */}
                </div>
              </div>
            ))
          ) : !drawerLoading ? (
            <Empty />
          ) : null}
        </Spin>
      </Drawer>
    );
  }
}

export default TreeMapDrawer;
TreeMapDrawer.defaultProps = {
  curSysCode: '',
  searchKey: '',
  visible: false,
};
