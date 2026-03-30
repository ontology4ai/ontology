import { Input, Table,Checkbox } from '@arco-design/web-react';
import cs from '@arco-design/web-react/lib/_util/classNames';

import React from 'react';
function RemoteTransferList(props) {
  const {
    prefixCls,
    className,
    disabled,
    onSearch,
    selectedKeys,
    onSelect,
    dataSource,
    columns,
    pagination,
    titleTexts,
    rowKey,
    selectchecked
  } = props;
  const InputSearch = Input.Search;
  
  return (
    <div className={className +' elx-remote-transfer-right'}>
         <div className='arco-transfer-view-header'>
            <Checkbox checked={selectedKeys.length==0 ? false : true}>{Array.isArray(titleTexts)?titleTexts[1]:'已选择'}</Checkbox>
            <div className='arco-transfer-view-header-unit'>{dataSource.length}/{selectedKeys.length}</div>
        </div>
      <InputSearch
        className={cs(`${prefixCls}-view-search`)}
        disabled={disabled}
        // allowClear={}
        placeholder="请输入搜索内容"
        onChange={onSearch}
      />
      <Table
        className={cs(`${prefixCls}-view-table`)}
        rowSelection={{
          selectedRowKeys: selectedKeys,
          onChange: onSelect,
        }}
        rowKey={rowKey}
        data={dataSource}
        columns={columns}
        pagePosition="bottomCenter"
        pagination={pagination}
        scroll={{ y: '100%' }}
      />
    </div>
  );
}

export default RemoteTransferList;
