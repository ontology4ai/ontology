import { ReactNode, CSSProperties } from 'react';

/**
 * @title Empty
 */
export interface SelectInputProps {
  style?: CSSProperties;
  className?: string | string[];
  /**
   * @zh 数据绑定值
   * @en Description of empty content
   */
  value?: any;
  /**
   * @zh 是否禁用
   * @en Custom icon
   */
  disabled?: boolean;
  /**
   * @zh 是否正在从远程获取数据
   * @en Replace icon with picture
   */
  loading?: boolean;
  /**
   * @zh 单选时是否可以清空选项
   * @en Replace icon with picture
   */
  clearable?: boolean;
  /**
   * @zh 所需传递的组件
   * @en Replace icon with picture
   */
  root?: ReactNode;
}
