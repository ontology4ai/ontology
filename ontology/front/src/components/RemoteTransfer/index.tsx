import React, {
  forwardRef,
  useContext,
  PropsWithChildren,
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import useMergeProps from '@arco-design/web-react/lib/_util/hooks/useMergeProps';
import cs from '@arco-design/web-react/lib/_util/classNames';
import axios from 'axios';
import { Button, Input, Table,Checkbox ,Message,Tooltip} from '@arco-design/web-react';
import { IconLeft, IconRight } from '@arco-design/web-react/icon';
import './style/index.less';
import useMergeValue from '@arco-design/web-react/lib/_util/hooks/useMergeValue';
import RemoteTransferList from './list';
import {
  RemoteTransferItem,
  RemoteTransferProcessDataRetrue,
  RemoteTransferProps,
  RemoteTransferType,
} from './interface';
require('static/guid.js');
const InputSearch = Input.Search;
// const transferProps: RemoteTransferProps = {
//     column: {},
//     processData: (raw) => raw,
//     props: { key: 'key', search: ['word'] },
//     pageSize: 20,
//   };

function RemoteTransfer(props: PropsWithChildren<RemoteTransferProps>) {
  const {
    className,
    style,
    requestUrl,
    getRequestUrl,
    processData,
    transferValue,
    pageSize,
    transferProps,
    column,
    titleTexts,
    platformCode,
    defaultParams,
    disabled,
    getMethod,
    // paginationConfig,
    targetFilterInput,
    
    // dataSource,
    onChange,
    ...rest
  } = props;
  const prefixCls="remote-transfer";
  const [targetValue, setTargetValue] = useMergeValue([], { value: transferValue });
  const [dataSource, setDataSource] = useState([]);
  const [columns, setColumns] = useState(column);
  const [platformCodeNew, setPlatformCodeNew] = useState(platformCode);
  const [loading, setLoading] = useState(false);
  
  const [transferChecked, setTransferChecked] = useState(false);
  const [selectchecked, setSelectchecked] = useState(false);
  const [sourcePagination, setSourcePagination] = useState({ current: 1, pageSize, total: 0 });
  const pageLoadedRef = useRef<number[]>([]);
  const filterInfo = useMemo(() => {
    type FilterInfo = {
      rowKey: keyof RemoteTransferItem;
      searchKeys: (keyof RemoteTransferItem)[];
    };

    const { key: rowKey, search } = transferProps;
    const searchKeys = [].concat(search);

    return { rowKey, searchKeys } as FilterInfo;
  }, [transferProps]);
  const targetFilterInfo = useMemo(() => {
    type targetFilterInfo = {
      rowKey: keyof RemoteTransferItem;
      searchKeys: (keyof RemoteTransferItem)[];
    };

    const { key: rowKey, search } = targetFilterInput;
    const searchKeys = [].concat(search);

    return { rowKey, searchKeys } as targetFilterInfo;
  }, [targetFilterInput]);

  type ListInfo = {
    dataSource: RemoteTransferItem[];
    selectedDisabledKeys: string[];
  };

  const sourceInfo = useMemo<ListInfo>(() => {
    const { current, pageSize } = sourcePagination;
    const currentLoadedIndex = pageLoadedRef.current.indexOf(current);

    return {
      dataSource: dataSource.slice(
        currentLoadedIndex * pageSize,
        (currentLoadedIndex + 1) * pageSize
      ),
      selectedDisabledKeys: targetValue.map((item) => item[filterInfo.rowKey]),
    };
  }, [dataSource, filterInfo.rowKey, sourcePagination, targetValue]);

  const [targetFilterText, setTargetFilterText] = useState('');
  const targetInfo = useMemo<ListInfo>(() => {
    let filterInfo_={};
    if(targetFilterInput){
        filterInfo_=targetFilterInfo;
    }else{
        filterInfo_=filterInfo;
    }
    return {
      dataSource:
        targetFilterText && filterInfo_.searchKeys.length
          ?  targetValue.filter(item => {
            return filterInfo_.searchKeys.some(key => item[key] && item[key].includes(targetFilterText));
          })
          : targetValue,
      selectedDisabledKeys: [],
    };
  }, [targetFilterText, targetValue, filterInfo.searchKeys]);

  type SelectedInfo = { source: string[]; target: string[] };
  const [selectedInfo, setSelectedInfo] = useState<SelectedInfo>({
    source: [],
    target: [],
  });

  type RemoteParams = { pageNum: number; [K: string]: any };
  const remoteParamsRef = useRef<RemoteParams>({ pageNum: 1 });

  const loadRemote = useCallback(
    async (reset = false,code) => {
      const url = getRequestUrl?.() || requestUrl || '';
      let obj={};
      filterInfo.searchKeys.forEach(key => {
        obj[key] = '';
      });
      let params={
        ...obj,
        ...defaultParams,
        ...remoteParamsRef.current,
        pageNum:remoteParamsRef.current.pageNum-1,
        pageSize,
      }
      
      if(code){
        params.platformCode=code;
      }
    //   if(paginationConfig){
    //    let pageNum = paginationConfig.pageNum;
    //    let pageSize_ = paginationConfig.pageSize;
    //     params[pageNum]=params.pageNum;
    //     params[pageSize_]=params.pageSize;
        //  params={params};
        // delete params.pageNum;
        // delete params.pageSize;
    //   }
      setLoading(true);
      const host=`${window.location.host}`;
        const protocol=`${window.location.protocol}`;
        let res={};
        if(getMethod && getMethod === 'post'){
             res = await axios({
                method:'post',
                url:`${protocol}//${host}/${url}` ,
                data: params ? params: {},
              }).then(res=> res.data).catch(err=>{ console.log(err); setLoading(false);});
        
        }else{
             res = await axios({
                method:'get',
                url:`${protocol}//${host}/${url}` ,
                params: params ? params: {},
              }).then(res=> res.data).catch(err=>{ console.log(err); setLoading(false);});
        }
   
    //   await axios.post(`/${APP_NAME}/_api/_/team/changeTeam`, { teamName:'asiainfo' });
      setLoading(false);
      let data=res?.data;
      if (processData) {
        data = processData(data);
      }
      
      if (data == null || !Array.isArray(data?.content) ) {
        console.log('远程穿梭框获取的数据格式不正确');
        }
      if(data?.content.length>0){
        data.content.forEach((item,index)=>{
            if(item?.id){
                item.id=item.id;
            }else{
                item.id=index+'';
            }
          })
      }
      const { pageNum } = remoteParamsRef.current;
      const { content, totalElements } = data;


      setDataSource((source) => {
        if (reset) {
          pageLoadedRef.current = [pageNum];
          return content;
        }
        pageLoadedRef.current = pageLoadedRef.current.concat(pageNum).sort();
        const index = pageLoadedRef.current.indexOf(pageNum);
        source.splice(index * pageSize, 0, ...content);
        return source;
      });
      setSourcePagination({
        current: pageNum,
        pageSize,
        total: totalElements || content.length,
      });
    },
    [getRequestUrl, pageSize, processData, requestUrl]
  );
  
  useEffect(() => {
    if(platformCode){
        loadRemote(true,platformCode,);
    }else{
        loadRemote(true);
    }
    // loadRemote,platformCode
  }, []);
  useEffect(() => {
    if(column){
        setColumns(column);
    }
  }, [column]);
  useEffect(() => {
    if(props?.item?.field){
        if(props.thisEvent.formRef){
             let targetKeys = props?.modelData[props?.item?.field] || [];
            if(typeof targetKeys == 'string'){
                targetKeys=targetKeys.split(',') || []
            }
            //渲染用整个object
            let targetVal = dataSource.filter(item => targetKeys.includes(item[filterInfo.rowKey]));
            if(Array.isArray(targetVal) && targetVal.length > 0 ){
                setTargetValue(targetVal);
            }else{
                let initialValue=props?.item?.initialValue;
                setTargetValue(Array.isArray(initialValue) && initialValue.length > 0 ? props?.item?.initialValue : []);
            }
        }
    }
  }, [dataSource]);
  
  const moveTo = (to: RemoteTransferType) => {
    const selectedKeys = to === 'source' ? selectedInfo.target : selectedInfo.source;
    if (!selectedKeys.length) return;
    if (to === 'target') {
      const newValue = targetValue.concat(
        dataSource.filter((item) => selectedKeys.includes(item[filterInfo.rowKey]))
      );
      let newValueIds=newValue.map(itm=> itm[filterInfo.rowKey]);
      if(props?.options){
        if(typeof props?.options?.onChange === 'function'){
            props?.options?.onChange?.(newValue, to,props,newValueIds);
        }else{
            let obj={};
            obj[props?.item?.field]=newValueIds;
            props?.formRef?props?.formRef.setFieldsValue(obj):'';
        }
      }else {
        props?.onChange?.(newValue, to,props,newValueIds);
      }
      setTargetValue(newValue);
      setSelectedInfo({ ...selectedInfo, source: [] });
    } else {
      const newValue = targetValue.filter(
        (item) => !selectedKeys.includes(item[filterInfo.rowKey])
      );
      let newValueIds=newValue.map(itm=> itm[filterInfo.rowKey]);
        if(props?.options){
            if(typeof props?.options?.onChange === 'function'){
                props?.options?.onChange?.(newValue, to,props,newValueIds);
            }else{
                let obj={};
                obj[props?.item?.field]=newValueIds;
                props?.formRef?props?.formRef.setFieldsValue(obj):'';
            }
        }else{
            props?.onChange?.(newValue, to,props,newValueIds);  
        }
      setTargetValue(newValue);
      setSelectedInfo({ ...selectedInfo, target: [] });
    }
  };
  const handleSelect = (to: RemoteTransferType, selectedKeys: (string | number)[]) => {
    const key: keyof SelectedInfo = to === 'source' ? 'source' : 'target';
    setSelectedInfo((info) => {
      return { ...info, [key]: selectedKeys };
    });
    if(to=='source'){
        setTransferChecked(!transferChecked)    
    }else if(to=='target'){
        setSelectchecked(!selectchecked)  
    }
   

  };

  const handleSourcePageChange = (current: number) => {
    if (pageLoadedRef.current.includes(current)) {
      setSourcePagination({ ...sourcePagination, current });
      return;
    }
    remoteParamsRef.current.pageNum = current;
    loadRemote(true,platformCode);
  };

  const handleSourceSearch = (value: string) => {
    remoteParamsRef.current = filterInfo.searchKeys.reduce(
      (params, key) => {
        params[key] = value;
        return params;
      },
      { pageNum: 1 }
    );

    loadRemote(true,platformCode);
  };

  const renderOperations = () => {

    const leftActive = selectedInfo.target.length > 0;
    const rightActive = selectedInfo.source.length > 0;
    const buttons: RemoteTransferType[] = ['target', 'source'];

    return (
      <div className={cs(`${prefixCls}-operations elx-remote-transfer-operate`)}>
        {buttons.map((to, index) => {
          let Icon;
          let _disabled;

          if (to === 'source') {
            Icon = IconLeft;
            _disabled = disabled || !leftActive;
          } else {
            Icon = IconRight;
            _disabled = disabled || !rightActive;
          }

          return (
            <Button
              key={index}
              className={to?'right':'left'}
              tabIndex={-1}
              aria-label={`move selected ${to === 'target' ? 'right' : 'left'}`}
              type="secondary"
              size="small"
              shape="round"
              disabled={_disabled}
              onClick={() => moveTo(to)}
              icon={<Icon />}
            />
          );
        })}
      </div>
    );
  };

  const renderList = (to: RemoteTransferType) => {
    const onSearch = to === 'target' ? setTargetFilterText : handleSourceSearch;
    
    const info = to === 'target' ? targetInfo : sourceInfo;
    const pagination =
      to === 'target'
        ? {}
        : {
            ...sourcePagination,
            onChange: handleSourcePageChange,
          };
    const rowSelection =
      to === 'target'
        ? {}
        : {
            checkboxProps(record: RemoteTransferItem) {
              return {
                disabled:
                  disabled || sourceInfo.selectedDisabledKeys.includes(record[filterInfo.rowKey]),
              };
            },
          };

    return (
      <RemoteTransferList
     
        {...info}
        prefixCls={prefixCls}
        className={cs(`${prefixCls}-view`, `${prefixCls}--view-${to}`)}
        disabled={disabled}
        rowKey={filterInfo.rowKey}
        selectchecked={selectchecked}
        selectedKeys={selectedInfo[to]}
        onSearch={onSearch}
        titleTexts={titleTexts}
        onSelect={(selectedKeys) => handleSelect(to, selectedKeys)}
        columns={columns.map((column, index) => {
            return {
                ...column,
                title: column?.label || column?.title,
                dataIndex: column?.name || column?.dataIndex,
                };
        })}
        pagination={{ showTotal: true, simple:true, pageSize, ...pagination }}
        rowSelection={rowSelection}
      />
    );
  };

  return (
    <div className={cs(prefixCls, className)} style={style} {...rest}>
      <div className={`elx-remote-transfer-left left-box--view-source`}>
        <div className='arco-transfer-view-header'>
            <Checkbox checked={selectedInfo?.source.length==0 ? false: true}>{Array.isArray(titleTexts)?titleTexts[0]:'可选'}</Checkbox>
            <div className='arco-transfer-view-header-unit'>{sourceInfo?.dataSource.length}/{selectedInfo?.source.length}</div>
        </div>
        <InputSearch
          className={`left-view-search`}
          placeholder="请输入搜索内容"
          searchButton
          loading={loading}
          onSearch={handleSourceSearch}
        />
        <Table
        loading={loading}
          className={`left-view-table`}
          rowKey={filterInfo.rowKey}
          rowSelection={{
            selectedRowKeys: selectedInfo.source,
            checkboxProps(record) {
              return {
                disabled:
                  disabled || sourceInfo.selectedDisabledKeys.includes(record[filterInfo.rowKey]),
              };
            },
            onChange: (selectedKeys) => {
              handleSelect('source', selectedKeys);
            
            },
          }}
          data={sourceInfo.dataSource}
          columns={columns.map((column, index) => {
            return {
                ...column,
                title: column?.label || column?.title,
                dataIndex: column?.name || column?.dataIndex,
                };
        })}
          pagePosition="bottomCenter"
          pagination={{
            ...sourcePagination,
            onChange: handleSourcePageChange,
            simple:true,
            showTotal: true,
          }}
          scroll={{ y: '100%' }}
        />
      </div>
      {renderOperations()}
      {renderList('target')}
    </div>
  );
}
RemoteTransfer.defaultProps = {
    requestUrl:'',
    // transferValue:[],//已选的key 
    pageSize:50,
    getMethod:'get',
    transferProps:{ key: 'key', search: ['word'] },
    targetFilterInput:{key: 'key', search: ['name']},
    column:[
        {
            "name": "label",
            "label": "中文名"
        },
        {
            "name": "name",
            "label": "英文名"
        }
    ],
    titleTexts:['可选','已选'],
    defaultParams:{},//默认传递的其他搜索值
    disabled:false,

}
export default RemoteTransfer;
