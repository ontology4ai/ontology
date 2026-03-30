// 对象列表数据
const objectList = [
  {"id": "customer", "name": "customer", "label": "客户", "desc": "公司的各类客户", "table": "客户明细表", "title": "customer_name", "primaryKey": "customer_id"},
  {"id": "warehouse", "name": "warehouse", "label": "仓库", "desc": "存放待发货产品的仓库", "table": "仓库明细表", "title": "warehouse_name", "primaryKey": "warehouse_id"},
  {"id": "product", "name": "product", "label": "产品", "desc": "公司生产的产品", "table": "产品明细表", "title": "product_name", "primaryKey": "product_id"},
  {"id": "order", "name": "order", "label": "订单", "desc": "客户采购产品的订单", "table": "订单明细表", "title": "order_id", "primaryKey": "order_id"},
  {"id": "waybill", "name": "waybill", "label": "货运单", "desc": "运送客户购买产品的货运单", "table": "货运单明细表", "title": "waybill_id", "primaryKey": "waybill_id"},
  {"id": "factory", "name": "factory", "label": "工厂", "desc": "生产产品的工厂", "table": "工厂明细表", "title": "factory_name", "primaryKey": "factory_id"},
  {"id": "road", "name": "road", "label": "公路", "desc": "陆上运输行驶的公路", "table": "公路明细表", "title": "road_name", "primaryKey": "road_code"},
  {"id": "flight", "name": "flight", "label": "航班", "desc": "货运航班", "table": "航班明细表", "title": "flight_id", "primaryKey": "flight_id"},
  {"id": "equipment", "name": "equipment", "label": "生产设备", "desc": "生产产品使用的设备", "table": "设备明细表", "title": "equipment_name", "primaryKey": "equipment_id"},
  {"id": "Base_Station", "name": "Base_Station", "label": "基站", "desc": "移动通信基站", "table": "基站明细表", "title": "site_name", "primaryKey": "site_id"},
  {"id": "Contract", "name": "Contract", "label": "合同", "desc": "商业合同", "table": "合同明细表", "title": "contract_name", "primaryKey": "contract_id"},
  {"id": "address", "name": "address", "label": "地址", "desc": "地址数据", "table": "地址明细表", "title": "address_id", "primaryKey": "address_id"},
  {"id": "weather", "name": "weather", "label": "天气", "desc": "天气数据", "table": "天气明细表", "title": "station_name", "primaryKey": "weather_id", "actions": [{"id": "1", "label": "异常天气预警"}] },
  {"id": "marketing_act", "name": "marketing_act", "label": "营销活动", "desc": "市场营销活动", "table": "营销活动明细表", "title": "act_name", "primaryKey": "act_id"},
  {"id": "logistics_company", "name": "logistics_company", "label": "物流公司", "desc": "物流公司", "table": "物流公司明细表", "title": "company_name", "primaryKey": "company_id"},
  {"id": "employee", "name": "employee", "label": "员工", "desc": "员工信息", "table": "员工明细表", "title": "employee_name", "primaryKey": "employee_id"},
  {"id": "electric_line", "name": "electric_line", "label": "电力线路", "desc": "电力线路表", "table": "电力线路明细表", "title": "line_name", "primaryKey": "line_id"},
  {"id": "workorder", "name": "workorder", "label": "工单", "desc": "对接工单系统，用于记录分配给员工的任务及任务进程", "table": "工单明细表", "title": "workorder_id", "primaryKey": "workorder_id", "actions": [{"id": "1", "label": "新建工单"}]}
];

// 逻辑列表数据
const logicList = [
  {"id": "weather01", "name": "Analysis of the severity of damage caused by Abnormal weather", "label": "异常天气危害等级分析", "desc": "根据异常天气类型和等级，分析货运风险，判断是否需要采取应急方案"},
  {"id": "weather02", "name": "Abnormal weather affects order analysis", "label": "异常天气影响订单分析", "desc": "如需启动应急方案，根据异常天气发生的地点、发生的时间和预计持续的时长，分析有哪些订单收到天气灾害影响"},
  {"id": "weather03", "name": "Feasibility analysis of the response plan", "label": "应对方案可行性分析", "desc": "针对受灾害天气影响的订单，制定应急方案，并综合产生的额外成本和客户满意度影响进行分析，推荐较优方案"},
  {"id": "base_station", "name": "Analysis of Abnormal Weather Impact on Base Stations", "label": "异常天气影响基站分析", "desc": "分析异常天气对基站的影响"},
  {"id": "marketing", "name": "Impact of abnormal weather on marketing analysis", "label": "异常天气影响营销分析", "desc": "分析异常天气对线下营销活动的影响"},
];

// 关系列表数据
const linkList = [
  {"源对象":"equipment","源对象中文":"生产设备","关系标签":"属于","目标对象":"factory","目标对象中文":"工厂", "sourcePort": "bottom", "targetPort": "top"},
  {"源对象":"equipment","源对象中文":"生产设备","关系标签":"生产","目标对象":"product","目标对象中文":"产品", "sourcePort": "left", "targetPort": "right"},
  {"源对象":"product","源对象中文":"产品","关系标签":"存放于","目标对象":"warehouse","目标对象中文":"仓库", "sourcePort": "bottom", "targetPort": "top"},
  {"源对象":"order","源对象中文":"订单","关系标签":"包含","目标对象":"product","目标对象中文":"产品", "sourcePort": "right", "targetPort": "left"},
  {"源对象":"customer","源对象中文":"客户","关系标签":"生成","目标对象":"order","目标对象中文":"订单", "sourcePort": "bottom", "targetPort": "right"},
  {"源对象":"waybill","源对象中文":"货运单","关系标签":"运送","目标对象":"order","目标对象中文":"订单", "sourcePort": "bottom", "targetPort": "top"},
  {"源对象":"logistics_company","源对象中文":"物流公司","关系标签":"生成","目标对象":"waybill","目标对象中文":"货运单", "sourcePort": "bottom", "targetPort": "top"},
  {"源对象":"waybill","源对象中文":"货运单","关系标签":"经过","目标对象":"road","目标对象中文":"公路", "sourcePort": "left", "targetPort": "right"},
  {"源对象":"waybill","源对象中文":"货运单","关系标签":"使用","目标对象":"flight","目标对象中文":"航班", "sourcePort": "left", "targetPort": "right"},
  {"源对象":"flight","源对象中文":"航班","关系标签":"经过","目标对象":"address","目标对象中文":"地址", "sourcePort": "left", "targetPort": "right"},
  {"源对象":"road","源对象中文":"公路","关系标签":"属于","目标对象":"address","目标对象中文":"地址", "sourcePort": "bottom", "targetPort": "top"},
  {"源对象":"marketing_act","源对象中文":"营销活动","关系标签":"位于","目标对象":"address","目标对象中文":"地址", "sourcePort": "top", "targetPort": "bottom"},
  {"源对象":"weather","源对象中文":"天气","关系标签":"影响","目标对象":"address","目标对象中文":"地址", "sourcePort": "right", "targetPort": "left"},
  {"源对象":"customer","源对象中文":"客户","关系标签":"签订","目标对象":"Contract","目标对象中文":"合同", "sourcePort": "top", "targetPort": "bottom"},
  {"源对象":"logistics_company","源对象中文":"物流公司","关系标签":"签订","目标对象":"Contract","目标对象中文":"合同", "sourcePort": "right", "targetPort": "left"},
  {"源对象":"employee","源对象中文":"员工","关系标签":"管理","目标对象":"marketing_act","目标对象中文":"营销活动", "sourcePort": "top", "targetPort": "bottom"},
  {"源对象":"employee","源对象中文":"员工","关系标签":"管理","目标对象":"Base_Station","目标对象中文":"基站", "sourcePort": "left", "targetPort": "bottom"},
  {"源对象":"electric_line","源对象中文":"电力线路","关系标签":"供应","目标对象":"Base_Station","目标对象中文":"基站", "sourcePort": "right", "targetPort": "left"},
  {"源对象":"Base_Station","源对象中文":"基站","关系标签":"覆盖","目标对象":"customer","目标对象中文":"客户", "sourcePort": "right", "targetPort": "left"},
  {"源对象":"workorder","源对象中文":"工单","关系标签":"指派","目标对象":"employee","目标对象中文":"员工", "sourcePort": "left", "targetPort": "right"},
  // 逻辑与对象引用关系
  {"源对象":"weather01","源对象中文":"异常天气危害等级分析","关系标签":"引用","目标对象":"weather","目标对象中文":"天气", "sourcePort": "bottom", "targetPort": "top"},
  {"源对象":"weather03","源对象中文":"应对方案可行性分析","关系标签":"引用","目标对象":"Contract","目标对象中文":"合同", "sourcePort": "left", "targetPort": "right"},
  {"源对象":"weather03","源对象中文":"应对方案可行性分析","关系标签":"引用","目标对象":"customer","目标对象中文":"客户", "sourcePort": "bottom", "targetPort": "right"},
  {"源对象":"base_station","源对象中文":"异常天气影响基站分析","关系标签":"引用","目标对象":"Base_Station","目标对象中文":"基站", "sourcePort": "top", "targetPort": "bottom"},
  {"源对象":"marketing","源对象中文":"异常天气影响营销分析","关系标签":"引用","目标对象":"marketing_act","目标对象中文":"营销活动", "sourcePort": "top", "targetPort": "left"},
  {"源对象":"weather02","源对象中文":"异常天气影响订单分析","关系标签":"引用","目标对象":"waybill","目标对象中文":"货运单", "sourcePort": "top", "targetPort": "bottom"},
  {"源对象":"weather02","源对象中文":"异常天气影响订单分析","关系标签":"引用","目标对象":"order","目标对象中文":"订单", "sourcePort": "right", "targetPort": "bottom"},
];

// 节点位置配置（根据实际布局更新）
const nodePositions: { [key: string]: { x: number; y: number } } = {
  // 对象节点位置（根据注释中的实际坐标更新）
  customer: { x: 720, y: 240 },
  warehouse: { x: 710, y: 670 },
  product: { x: 710, y: 440 },
  order: { x: 510, y: 440 },
  waybill: { x: 470, y: 230 },
  factory: { x: 920, y: 670 },
  road: { x: 120, y: 50 },
  flight: { x: 230, y: 250 },
  equipment: { x: 920, y: 440 },
  Base_Station: { x: 10, y: 410 },
  Contract: { x: 640, y: 50 },
  address: { x: 40, y: 240 },
  weather: { x: -150, y: 250 },
  marketing_act: { x: 240, y: 440 },
  logistics_company: { x: 370, y: 50 },
  employee: { x: 180, y: 700 },
  electric_line: { x: -200, y: 410 },
  workorder: { x: 400, y: 680 },
  // 逻辑节点位置（根据注释中的实际坐标更新）
  weather01: { x: -150, y: 70 },
  weather02: { x: 300, y: 570 },
  weather03: { x: 840, y: 120 },
  base_station: { x: -180, y: 560 },
  marketing: { x: -110, y: 670 }
};

// 生成对象节点配置
const objectNodes = objectList.map(obj => ({
  id: obj.id,
  x: nodePositions[obj.id]?.x || 100,
  y: nodePositions[obj.id]?.y || 100,
  width: 90,
  height: 90,
  shape: "dag-node",
  data: {
    id: obj.id,
    label: obj.label,
    desc: obj.desc,
    table: obj.table,
    title: obj.title,
    primaryKey: obj.primaryKey,
    type: "object",
    actions: obj.actions
  },
  ports: [
    {
      id: "top",
      group: "top"
    },
    {
      id: "right", 
      group: "right"
    },
    {
      id: "bottom",
      group: "bottom"
    },
    {
      id: "left",
      group: "left"
    }
  ]
}));

// 生成逻辑节点配置
const logicNodes = logicList.map(logic => ({
  id: logic.id,
  x: nodePositions[logic.id]?.x || 100,
  y: nodePositions[logic.id]?.y || 700,
  width: 172,
  height: 88,
  shape: "dag-node",
  data: {
    id: logic.id,
    label: logic.label,
    desc: logic.desc,
    name: logic.name,
    type: "logic"
  },
  ports: [
    {
      id: "top",
      group: "top"
    },
    {
      id: "right", 
      group: "right"
    },
    {
      id: "bottom",
      group: "bottom"
    },
    {
      id: "left",
      group: "left"
    }
  ]
}));

// 合并所有节点
const nodes = [...objectNodes, ...logicNodes];

// 生成边配置
const edges = linkList.map((link, index) => ({
  id: `edge-${index + 1}`,
  shape: "dag-edge",
  source: {
    cell: link.源对象,
    port: link.sourcePort || "right"
  },
  target: {
    cell: link.目标对象,
    port: link.targetPort || "left"
  },
  zIndex: 0,
  label: {
    data: {
      text: link.关系标签
    }
  },
  data: {
    sourceLabel: link.源对象中文,
    targetLabel: link.目标对象中文,
    relation: link.关系标签
  }
}));

// 导出完整的图形配置
export default [
  ...nodes,
  ...edges
];
