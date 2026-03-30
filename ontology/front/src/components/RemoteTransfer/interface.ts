import { PaginationProps, TableColumnProps, TableRowSelectionProps } from '@arco-design/web-react';
import { CSSProperties } from 'react';

export type RemoteTransferType = 'target' | 'source';

export interface RemoteTransferItem {
  [K: string | number | symbol]: any;
}

/**
 * @title RemoteTransfer
 */
export interface RemoteTransferProps {
  style?: CSSProperties;
  className?: string;
  /**
   * @zh [左栏]数据请求地址(
   * @en The remote url
   */
  requestUrl?: string;
  /**
   * @zh [左栏]数据请求地址的回调方法
   * @en Get the remote url by function
   */
  getRequestUrl?: () => string;
  /**
   * @zh 处理成组件要求的数据方法
   * @en The function for process remote data
   */
  processData?: (raw: any) => RemoteTransferProcessDataRetrue;
  /**
   * @zh 值，`完全受控`
   * @en The value, is `Control`
   */
  transferValue?: RemoteTransferItem[];
  /**
   * @zh 所需展示的表格字段以及表头中文名对象（举例：`{ stepInst: '指令',stepInstLabel: '指令名称' }`）
   * @en The table columns `dataindex` & `title`, egs, `{ key1: 'Title 1', key2: 'Title 2' }`
   */
  column?: Record<string, string>;
  /**
   * @zh 页码设置
   * @en The page size
   */
  pageSize?: number;
  /**
   * @zh 配置选项，key: 每条数据的唯一值字段, search: 搜索框对应的字段
   * @en The config, key: the unique key of data, search: keys of filter data by search input
   */
  props?: { key: keyof RemoteTransferItem; search: string | string[] };
  /**
   * @zh 禁用穿梭框
   * @en Whether is disabled
   */
  disabled?: boolean;
  /**
   * @zh 选中项在两栏之间转移时的回调
   * @en Callback when the transfer between columns is complete
   */
  onChange?: (selected: RemoteTransferItem[], type: RemoteTransferType) => void;
}

/**
 * @title RemoteRequestParams
 *
 * @zh 远程请求的入参，请求方法 `get`
 * @en The remote request params, request method: `get`.
 */
export interface RemoteRequestParams {
  /**
   * @zh 页码
   * @en The page number
   */
  pageNum: number;
  /**
   * @zh 一页中含数据条数
   * @en The page size
   */
  pageSize: number;

  /**
   * @zh
   * @en The search keys ard define by `props.search`, value bu search input
   */
  [searchKey: string]: any;
}

/**
 * @title RemoteTransferProcessDataRetrue
 *
 * @zh `processData` 返回的数据格式
 * @en The type return of `processData`.
 */
export interface RemoteTransferProcessDataRetrue {
  /**
   * @zh 数据内容
   * @en Data Content
   */
  content: RemoteTransferItem[];
  /**
   * @zh 数据总数
   * @en Total of data
   */
  totalElements: number;
}

export interface RemoteTransferListProps {
  prefixCls: string;
  className: string;
  disabled: boolean;
  onSearch: (value: string) => void;
  selectedKeys: string[];
  onSelect: (selectedKeys: string[]) => void;
  dataSource: RemoteTransferItem[];
  columns: TableColumnProps[];
  pagination: PaginationProps;
  rowSelection: TableRowSelectionProps;
}
