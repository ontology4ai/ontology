import React from 'react';
//import useLocale from 'modo-plugin-common/src/utils/useLocale';
import { Tabs } from '@arco-design/web-react';
import LinkDetail from './pages/link-detail';
import './style/index.less';

const TabPane = Tabs.TabPane;

class LinkOverView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      menuKey: 'overview'
    };
    this.viewMapRef = React.createRef();
    this.viewMapRef.current = {};
  }
  componentDidMount() {
    this.props.onUpdateUseSaveBtn(this.props.data.id, true);
  }

  handleSave = (callback) => {
    const view = this.viewMapRef.current[this.state.menuKey];
    if (view && typeof view.handleSave === 'function') {
      view.handleSave((...args) => {
        callback(...args);
      });
    }
  };

  render() {
   // const { t } = useLocale();
    const { menuKey } = this.state;

    return (
      <>
        <div className="obj-overview">
          {/* <div className="obj-overview-sidebar">
            <div className="base-info">
              <div className="label">
                <span className="label-text">[Gena]Surgeries</span>
                <span className="icon">
                  <IconCorrectFill />
                  <IconRefreshColor />
                </span>
              </div>
              <div className="label">
                <span className="label-text">[Gena]Surgeries</span>
                <span className="icon">
                  <IconCorrectFill />
                  <IconRefreshColor />
                </span>
              </div>
            </div>
            <div className="menu-list">
              {[
                {
                  icon: <IconGridColor />,
                  label: '概览',
                  name: 'overview',
                },
                {
                  icon: <IconDataCatalogMgrColor />,
                  label: '数据源',
                  name: 'ds',
                  disabled: true
                },
              ].map(item => {
                return (
                  <div
                    key={item.name}
                    className={`menu-item ${item.name === menuKey ? 'active' : ''} ${item.disabled? 'disabled' : ''}`}
                    onClick={() => {
                      !item.disabled && this.setState({ menuKey: item.name });
                    }}
                  >
                    <span className="icon">{item.icon}</span>
                    <span className="label">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div> */}
          <div className="obj-overview-content">
            <div className="obj-data">
              <Tabs activeTab={menuKey}>
                <TabPane key='overview' title='overview'>
                  <LinkDetail
                    ref={ref => this.viewMapRef.current['overview'] = ref}
                    linkObj={{ ontologyId: this.props.data.ontologyId, id: this.props.data.id }}
                  />
                </TabPane>
              </Tabs>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default LinkOverView;
