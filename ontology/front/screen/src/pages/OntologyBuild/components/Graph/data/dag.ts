import nodePositions from './positions'

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
  {"id": "weather", "name": "weather", "label": "天气", "desc": "天气数据", "table": "天气明细表", "title": "station_name", "primaryKey": "weather_id", "actions": [{"id": "1", "label": "异常天气预警", "name": "Abnormal weather warning", "input": [{label: '异常天气类型', id: '1', defaultValue: '台风'}, {label: '异常危害等级', id: '2', defaultValue: '12-13级'}, {label: '异常发生时间', id: '3', defaultValue: '2026年5月1号'}, {label: '异常发生地点', id: '4', defaultValue: '广东深圳沿海一带'}, {label: '异常持续时长', id: '5', defaultValue: '5天'}], "desc": "模拟未来某个时间，某个地区将发生异常天气，分析带来的影响"}] },
  {"id": "marketing_act", "name": "marketing_act", "label": "营销活动", "desc": "市场营销活动", "table": "营销活动明细表", "title": "act_name", "primaryKey": "act_id"},
  {"id": "logistics_company", "name": "logistics_company", "label": "物流公司", "desc": "物流公司", "table": "物流公司明细表", "title": "company_name", "primaryKey": "company_id"},
  {"id": "employee", "name": "employee", "label": "员工", "desc": "员工信息", "table": "员工明细表", "title": "employee_name", "primaryKey": "employee_id"},
  {"id": "electric_line", "name": "electric_line", "label": "电力线路", "desc": "电力线路表", "table": "电力线路明细表", "title": "line_name", "primaryKey": "line_id"},
  {"id": "workorder", "name": "workorder", "label": "工单", "desc": "对接工单系统，用于记录分配给员工的任务及任务进程", "table": "工单明细表", "title": "workorder_id", "primaryKey": "workorder_id", "actions": [{"id": "1", "label": "新建工单",  "name": "Create orders", "input": [{label: '工单标识', id: '1'}, {label: '负责人', id: '2'}, {label: '工号', id: '3'}, {label: '联系电话', id: '4'}, {label: '工单内容', id: '5'}, {label:'派发时间', id: '6'}, {label:'状态', id: '7'}], "desc": "面向内部员工派发工单，明确任务内容，并生成一条工单记录"}]}
];

// 属性映射对象
const objectAttrMapping: any = {
  customer: [
    {"name": "customer_id", "label": "客户ID", "type": "string"},
    {"name": "customer_name", "label": "客户名称", "type": "string"},
    {"name": "social_credit_code", "label": "社会信用代码", "type": "string"},
    {"name": "registered_capital", "label": "注册资本(万元)", "type": "float"},
    {"name": "business_field", "label": "所属行业", "type": "string"},
    {"name": "customer_level", "label": "客户等级", "type": "string"},
    {"name": "customer_address", "label": "客户地址", "type": "string"},
    {"name": "site_id", "label": "基站ID", "type": "string"}
  ],
  warehouse: [
    {"name": "warehouse_id", "label": "仓库ID", "type": "string"},
    {"name": "warehouse_name", "label": "仓库名称", "type": "string"},
    {"name": "warehouse_address", "label": "仓库地址", "type": "string"},
    {"name": "warehouse_area", "label": "仓库面积(㎡)", "type": "float"},
    {"name": "current_storage_num", "label": "当前存放量", "type": "int"},
    {"name": "warehouse_status", "label": "仓库状态", "type": "string"},
    {"name": "admin_name", "label": "管理员姓名", "type": "string"}
  ],
  product: [
    {"name": "product_id", "label": "产品ID", "type": "string"},
    {"name": "product_name", "label": "产品名称", "type": "string"},
    {"name": "product_brand", "label": "产品品牌", "type": "string"},
    {"name": "product_model", "label": "产品型号", "type": "string"},
    {"name": "product_color", "label": "产品颜色", "type": "string"},
    {"name": "equipment_id", "label": "设备ID", "type": "string"},
    {"name": "product_price", "label": "产品价格", "type": "float"},
    {"name": "warehouse_id", "label": "仓库ID", "type": "string"},
    {"name": "order_id", "label": "订单ID", "type": "string"}
  ],
  order: [
    {"name": "order_id", "label": "订单ID", "type": "string"},
    {"name": "customer_id", "label": "客户ID", "type": "string"},
    {"name": "product_id", "label": "产品ID", "type": "string"},
    {"name": "product_num", "label": "产品数量", "type": "int"},
    {"name": "order_amount", "label": "订单总金额（元）", "type": "float"},
    {"name": "order_time", "label": "下单时间", "type": "string"},
    {"name": "order_status", "label": "订单状态", "type": "string"},
    {"name": "shipping_address", "label": "收货地址", "type": "string"},
    {"name": "waybill_id", "label": "货运单ID", "type": "string"}
  ],
  waybill: [
    {"name": "waybill_id", "label": "货运单ID", "type": "string"},
    {"name": "order_id", "label": "订单ID", "type": "string"},
    {"name": "consignor_name", "label": "发货人姓名", "type": "string"},
    {"name": "consignor_phone", "label": "发货人手机", "type": "string"},
    {"name": "consignee_address", "label": "收货地址", "type": "string"},
    {"name": "consignee_name", "label": "收货人姓名", "type": "string"},
    {"name": "consignee_phone", "label": "收货人手机", "type": "string"},
    {"name": "pass_road_code", "label": "经过公路编号", "type": "string"},
    {"name": "flight_id", "label": "航班ID", "type": "string"},
    {"name": "company_id", "label": "物流公司ID", "type": "string"}
  ],
  factory: [
    {"name": "factory_id", "label": "工厂ID", "type": "string"},
    {"name": "factory_name", "label": "工厂名称", "type": "string"},
    {"name": "factory_type", "label": "工厂类型", "type": "string"},
    {"name": "factory_address", "label": "工厂地址", "type": "string"},
    {"name": "factory_area", "label": "占地面积(㎡)", "type": "float"},
    {"name": "employee_num", "label": "员工数量", "type": "int"}
  ],
  road: [
    {"name": "road_code", "label": "公路编号", "type": "string"},
    {"name": "road_name", "label": "公路名称", "type": "string"},
    {"name": "road_level", "label": "公路等级", "type": "string"},
    {"name": "road_length", "label": "公路长度(km)", "type": "float"},
    {"name": "road_beginning", "label": "公路起点城市", "type": "string"},
    {"name": "road_ending", "label": "公路终点城市", "type": "string"},
    {"name": "speed_low_limit", "label": "最低限速(㎞/h)", "type": "int"},
    {"name": "speed_high_limit", "label": "最高限速(㎞/h)", "type": "int"},
    {"name": "waybill_id", "label": "货运单ID", "type": "string"},
    {"name": "address_id", "label": "地址ID", "type": "string"}
  ],
  flight: [
    {"name": "flight_id", "label": "航班ID", "type": "string"},
    {"name": "airline_id", "label": "航空公司ID", "type": "string"},
    {"name": "airplane_model", "label": "机型", "type": "string"},
    {"name": "goods_type", "label": "货物类型", "type": "string"},
    {"name": "goods_name", "label": "货物名称", "type": "string"},
    {"name": "goods_num", "label": "货物数量", "type": "int"},
    {"name": "goods_weight", "label": "货物重量(kg)", "type": "float"},
    {"name": "waybill_id", "label": "货运单ID", "type": "string"},
    {"name": "address_id", "label": "地址ID", "type": "string"}
  ],
  equipment: [
    {"name": "equipment_id", "label": "设备ID", "type": "string"},
    {"name": "equipment_name", "label": "设备名称", "type": "string"},
    {"name": "equipment_model", "label": "设备型号", "type": "string"},
    {"name": "manufacturer_id", "label": "生产厂商ID", "type": "string"},
    {"name": "product_id", "label": "产品ID", "type": "string"},
    {"name": "factory_id", "label": "工厂ID", "type": "string"}
  ],
  Base_Station: [
    {"name": "site_id", "label": "基站ID", "type": "string"},
    {"name": "site_name", "label": "基站名称", "type": "string"},
    {"name": "site_type", "label": "基站类型", "type": "string"},
    {"name": "address_id", "label": "地址ID", "type": "string"},
    {"name": "site_address", "label": "基站地址", "type": "string"},
    {"name": "site_longitude", "label": "经度", "type": "string"},
    {"name": "site_latitude", "label": "纬度", "type": "string"},
    {"name": "line_id", "label": "电力线路ID", "type": "string"},
    {"name": "admin_name", "label": "管理员姓名", "type": "string"},
    {"name": "admin_phone", "label": "管理员手机", "type": "string"}
  ],
  Contract: [
    {"name": "contract_id", "label": "合同ID", "type": "string"},
    {"name": "contract_name", "label": "合同名称", "type": "string"},
    {"name": "contract_type", "label": "合同类型", "type": "string"},
    {"name": "party_a_name", "label": "甲方名称", "type": "string"},
    {"name": "party_b_name", "label": "乙方名称", "type": "string"},
    {"name": "signing_date", "label": "签订日期", "type": "string"}
  ],
  address: [
    {"name": "address_id", "label": "地址ID", "type": "string"},
    {"name": "province", "label": "省/自治区", "type": "string"},
    {"name": "city", "label": "市", "type": "string"},
    {"name": "district/county", "label": "区/县", "type": "string"},
    {"name": "township/street", "label": "乡镇/街道", "type": "string"},
    {"name": "community", "label": "社区/行政村", "type": "string"},
    {"name": "street/lane", "label": "街巷名", "type": "string"},
    {"name": "building_num", "label": "门楼牌号", "type": "string"},
    {"name": "floor_num", "label": "楼层", "type": "string"},
    {"name": "room_num", "label": "户号", "type": "string"},
    {"name": "weather_id", "label": "天气ID", "type": "string"},
    {"name": "flight_id", "label": "航班ID", "type": "string"},
    {"name": "road_code", "label": "公路编号", "type": "string"}
  ],
  weather: [
    {"name": "weather_id", "label": "天气ID", "type": "string"},
    {"name": "station_name", "label": "区域名", "type": "string"},
    {"name": "address_id", "label": "地址ID", "type": "string"},
    {"name": "current_weather_phenomena", "label": "当前天气现象", "type": "string"},
    {"name": "future_weather_phenomena", "label": "未来异常天气现象", "type": "string"},
    {"name": "future_Weather_phenomena_time", "label": "未来天气发生时间", "type": "string"},
    {"name": "Weather_phenomena_class", "label": "异常天气危害等级", "type": "string"},
    {"name": "Weather_phenomena_duration", "label": "异常天气持续时长", "type": "string"},
    {"name": "temp_max", "label": "最高气温", "type": "string"},
    {"name": "temp_min", "label": "最低气温", "type": "string"},
    {"name": "wind_dir", "label": "风向", "type": "string"},
    {"name": "wind_speed", "label": "风速", "type": "string"}
  ],
  marketing_act: [
    {"name": "act_id", "label": "活动ID", "type": "string"},
    {"name": "act_name", "label": "活动名称", "type": "string"},
    {"name": "act_date", "label": "活动时间", "type": "string"},
    {"name": "address_id", "label": "地址ID", "type": "string"},
    {"name": "act_address", "label": "活动地点", "type": "string"},
    {"name": "act_budget", "label": "活动预算", "type": "string"},
    {"name": "branch_company", "label": "所属分公司", "type": "string"},
    {"name": "admin_name", "label": "负责人姓名", "type": "string"},
    {"name": "admin_phone", "label": "负责人手机", "type": "string"}
  ],
  logistics_company: [
    {"name": "company_id", "label": "公司ID", "type": "string"},
    {"name": "company_name", "label": "公司名称", "type": "string"},
    {"name": "social_credit_code", "label": "社会信用代码", "type": "string"},
    {"name": "company_address", "label": "公司地址", "type": "string"},
    {"name": "registered_capital", "label": "注册资本(万元)", "type": "string"},
    {"name": "company_country", "label": "所属国家", "type": "string"},
    {"name": "company_city", "label": "总部所在城市", "type": "string"}
  ],
  employee: [
    {"name": "employee_id", "label": "员工ID", "type": "string"},
    {"name": "employee_name", "label": "员工姓名", "type": "string"},
    {"name": "department", "label": "部门", "type": "string"},
    {"name": "base_city", "label": "工作地点", "type": "string"},
    {"name": "employee_sex", "label": "性别", "type": "string"},
    {"name": "employee_age", "label": "年龄", "type": "int"},
    {"name": "employee_phone", "label": "手机", "type": "string"},
    {"name": "employee_email", "label": "邮箱", "type": "string"}
  ],
  electric_line: [
    {"name": "line_id", "label": "线路ID", "type": "string"},
    {"name": "line_name", "label": "线路名称", "type": "string"},
    {"name": "line_type", "label": "线路类型", "type": "string"},
    {"name": "voltage_level", "label": "电压等级", "type": "string"},
    {"name": "status", "label": "运行状态", "type": "string"},
    {"name": "total_length", "label": "总长", "type": "float"},
    {"name": "admin_name", "label": "管理员姓名", "type": "string"},
    {"name": "admin_phone", "label": "管理员手机", "type": "string"}
  ],
  workorder: [
    {"name": "workorder_id", "label": "工单标识", "type": "string"},
    {"name": "workorder_principal", "label": "负责人", "type": "string"},
    {"name": "employee_id", "label": "工号", "type": "string"},
    {"name": "phone_number", "label": "联系电话", "type": "string"},
    {"name": "workorder_content", "label": "工单内容", "type": "string"},
    {"name": "distribution_time", "label": "派发时间", "type": "float"},
    {"name": "states", "label": "状态", "type": "string"}
  ]
};

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
  {"源对象":"customer","源对象中文":"客户","关系标签":"生成","目标对象":"order","目标对象中文":"订单", "sourcePort": "bottom", "targetPort": "top"},
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
  {"源对象":"employee","源对象中文":"员工","关系标签":"管理","目标对象":"marketing_act","目标对象中文":"营销活动", "sourcePort": "right", "targetPort": "left"},
  {"源对象":"employee","源对象中文":"员工","关系标签":"管理","目标对象":"Base_Station","目标对象中文":"基站", "sourcePort": "top", "targetPort": "bottom"},
  {"源对象":"electric_line","源对象中文":"电力线路","关系标签":"供应","目标对象":"Base_Station","目标对象中文":"基站", "sourcePort": "right", "targetPort": "left"},
  {"源对象":"Base_Station","源对象中文":"基站","关系标签":"覆盖","目标对象":"customer","目标对象中文":"客户", "sourcePort": "right", "targetPort": "left"},
  {"源对象":"workorder","源对象中文":"工单","关系标签":"指派","目标对象":"employee","目标对象中文":"员工", "sourcePort": "right", "targetPort": "left"},
  // 逻辑与对象引用关系
  {"源对象":"weather01","源对象中文":"异常天气危害等级分析","关系标签":"引用","目标对象":"weather","目标对象中文":"天气", "sourcePort": "bottom", "targetPort": "top"},
  {"源对象":"weather03","源对象中文":"应对方案可行性分析","关系标签":"引用","目标对象":"Contract","目标对象中文":"合同", "sourcePort": "left", "targetPort": "right"},
  {"源对象":"weather03","源对象中文":"应对方案可行性分析","关系标签":"引用","目标对象":"customer","目标对象中文":"客户", "sourcePort": "bottom", "targetPort": "right"},
  {"源对象":"base_station","源对象中文":"异常天气影响基站分析","关系标签":"引用","目标对象":"Base_Station","目标对象中文":"基站", "sourcePort": "bottom", "targetPort": "top"},
  {"源对象":"marketing","源对象中文":"异常天气影响营销分析","关系标签":"引用","目标对象":"marketing_act","目标对象中文":"营销活动", "sourcePort": "top", "targetPort": "bottom"},
  // {"源对象":"weather02","源对象中文":"异常天气影响订单分析","关系标签":"引用","目标对象":"waybill","目标对象中文":"货运单", "sourcePort": "top", "targetPort": "bottom"},
  {"源对象":"weather02","源对象中文":"异常天气影响订单分析","关系标签":"引用","目标对象":"order","目标对象中文":"订单", "sourcePort": "top", "targetPort": "bottom"},
];

// 节点位置配置（根据实际布局更新）
// const nodePositions: { [key: string]: { x: number; y: number } } = {
//   // 对象节点位置（根据注释中的实际坐标更新）
//   customer: { x: 600, y: 230 },
//   warehouse: { x: 600, y: 620 },
//   product: { x: 600, y: 460 },
//   order: { x: 390, y: 460 },
//   waybill: { x: 390, y: 230 },
//   factory: { x: 810, y: 620 },
//   road: { x: 0, y: 50 },
//   flight: { x: 190, y: 230 },
//   equipment: { x: 810, y: 460 },
//   Base_Station: { x: 0, y: 460 },
//   Contract: { x: 600, y: 60 },
//   address: { x: 0, y: 230 },
//   weather: { x: -240, y: 230 },
//   marketing_act: { x: 190, y: 460 },
//   logistics_company: { x: 390, y: 60 },
//   employee: { x: 0, y: 620 },
//   electric_line: { x: -240, y: 460 },
//   workorder: { x: -240, y: 620 },
//   // 逻辑节点位置（根据注释中的实际坐标更新）
//   weather01: { x: -280, y: 50 },
//   weather02: { x: 350, y: 620 },
//   weather03: { x: 770, y: 60 },
//   base_station: { x: -170, y: 340 },
//   marketing: { x: 150, y: 620 }
// };

const nodeIcons: { [key: string]: string } = {
	'default': '产品.png',
	'customer': '客户.png',
	'warehouse': '仓库.png',
	'product': '产品.png',
	'order': '订单.png',
	'road': '公路.png',
	'flight': '航班.png',
	'flight_route': '航线.png',
	'truck': '车辆.png',
	'electric_line': '电力线路.svg',
	'Base_Station': '基站.svg',
	'employee': '员工.svg',
	'weather': '天气.svg',
	'address': '地址.svg',
  'logistics_company': '物流公司.svg',
  "Contract": '合同.svg',
  "waybill": '货运单.svg',
  'marketing_act': '营销活动.svg',
  'equipment': '生产设备.svg',
  'workorder': '工单.svg',
  'factory': '工厂.svg'
}

// 生成对象节点配置
const objectNodes = objectList.map(obj => ({
  id: obj.id,
  x: nodePositions[obj.id]?.x || 0,
  y: nodePositions[obj.id]?.y || 0,
  width: 90,
  height: 90,
  shape: "dag-node",
  data: {
    id: obj.id,
    name: obj.name,
    icon: nodeIcons[obj.id] || 'default',
    label: obj.label,
    desc: obj.desc,
    table: obj.table,
    title: obj.title,
    primaryKey: obj.primaryKey,
    type: "object",
    actions: obj.actions,
    attrs: objectAttrMapping[obj.id]
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
    type: "logic",
    objectLabels: linkList.filter(link => link.源对象 === logic.id).map(link => link.目标对象中文)
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
