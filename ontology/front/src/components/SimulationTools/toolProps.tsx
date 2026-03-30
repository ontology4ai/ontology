/**
 * ToolMenu组件的属性接口
 */
export interface ToolMenuProps {
  /**
   * 选中的数据
   */
  selectData?: any[];
  /**
   * 菜单点击事件回调
   * @param event 事件名称，可能的取值：
   * - 'removeNode' - 移除节点
   * - 'fullImport' - 本体全量导入
   * - 'partialImport' - 部分导入
   * - 'addRelated' - 添加相关资源
   * - 'initData' - 数据初始化
   * - 'nodeDetail' - 节点详情
   * - 'ruleSimulation' - 规则仿真
   * @param data 选中的数据
   */
  onMenuClick?: (event: string, data?: any) => void;
  /**
   * Drawer要挂载的节点
   */
  getPopupContainer?: React.RefObject<HTMLElement>;
  /**
   * 画布节点列表
   */
  nodes?: any[];
  /**
   * 可用节点列表
   */
  ontologyGraph?: any[];
}
