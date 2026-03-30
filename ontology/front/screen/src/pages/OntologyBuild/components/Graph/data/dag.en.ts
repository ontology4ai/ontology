import nodePositions from './positions'

// 对象列表数据
const objectList = [
  {"id": "customer", "name": "customer", "label": "Customer", "desc": "Various company clients.", "table": "Customer Details", "title": "customer_name", "primaryKey": "customer_id"},
  {"id": "warehouse", "name": "warehouse", "label": "Warehouse", "desc": "Warehouses storing products for shipment.", "table": "Warehouse Details", "title": "warehouse_name", "primaryKey": "warehouse_id"},
  {"id": "product", "name": "product", "label": "Product", "desc": "Products manufactured by the company.", "table": "Product Details", "title": "product_name", "primaryKey": "product_id"},
  {"id": "order", "name": "order", "label": "Order", "desc": "Orders placed by customers.", "table": "Order Details", "title": "order_id", "primaryKey": "order_id"},
  {"id": "waybill", "name": "shipment_order", "label": "Shipment Order", "desc": "Shipment orders for purchased products.", "table": "Shipment Order Details", "title": "shipment_order_id", "primaryKey": "shipment_order_id"},
  {"id": "factory", "name": "factory", "label": "Factory", "desc": "Factories manufacturing products.", "table": "Factory Details", "title": "factory_name", "primaryKey": "factory_id"},
  {"id": "road", "name": "road", "label": "Road", "desc": "Roads used for land transportation.", "table": "Road Details", "title": "road_name", "primaryKey": "road_code"},
  {"id": "flight", "name": "flight", "label": "Flight", "desc": "Cargo flights.", "table": "Flight Details", "title": "flight_id", "primaryKey": "flight_id"},
  {"id": "equipment", "name": "equipment", "label": "Equipment", "desc": "Equipment used in production.", "table": "Equipment Details", "title": "equipment_name", "primaryKey": "equipment_id"},
  {"id": "Base_Station", "name": "Base_Station", "label": "Base Station", "desc": "Mobile communication base stations.", "table": "Base Station Details", "title": "site_name", "primaryKey": "site_id"},
  {"id": "Contract", "name": "Contract", "label": "Contract", "desc": "Business contracts.", "table": "Contract Details", "title": "contract_name", "primaryKey": "contract_id"},
  {"id": "address", "name": "address", "label": "Address", "desc": "Address data.", "table": "Address Details", "title": "address_id", "primaryKey": "address_id"},
  {"id": "weather", "name": "weather", "label": "Weather", "desc": "Weather data.", "table": "Weather Details", "title": "station_name", "primaryKey": "weather_id", "actions": [{"id": "1", "label": "Weather Warning", "name": "Abnormal weather warning", "input": [{label: 'Weather Type', id: '1', defaultValue: 'Typhoon'}, {label: 'Severity', id: '2', defaultValue: 'Level 12-13 Severe impact'}, {label: 'Start Time', id: '3', defaultValue: 'May 1, 2026'}, {label: 'Location', id: '4', defaultValue: 'Coastal area of Shenzhen, Guangdong'}, {label: 'Duration', id: '5', defaultValue: '5 days'}], "desc": "Simulates abnormal weather at a specific future time and location to analyze its impact."}]},
  {"id": "marketing_act", "name": "marketing_act", "label": "Campaign", "desc": "Marketing campaigns.", "table": "Campaign Details", "title": "act_name", "primaryKey": "act_id"},
  {"id": "logistics_company", "name": "logistics_company", "label": "Logistics Co.", "desc": "Logistics companies.", "table": "Logistics Co. Details", "title": "company_name", "primaryKey": "company_id"},
  {"id": "employee", "name": "employee", "label": "Employee", "desc": "Employee information.", "table": "Employee Details", "title": "employee_name", "primaryKey": "employee_id"},
  {"id": "electric_line", "name": "electric_line", "label": "Electricity Line", "desc": "Electricity lines.", "table": "Electricity Line Details", "title": "line_name", "primaryKey": "line_id"},
  {"id": "workorder", "name": "ticket", "label": "Ticket", "desc": "Records tasks and progress assigned to employees.", "table": "Ticket Details", "title": "ticket_id", "primaryKey": "ticket_id", "actions": [{"id": "1", "label": "Create tickets",  "name": "Create orders", "input": [{label: 'Ticket ID', id: '1'}, {label: 'Principal', id: '2'}, {label: 'Employee ID', id: '3'}, {label: 'Contact No.', id: '4'}, {label: 'Content', id: '5'}, {label:'Dispatch Time', id: '6'}, {label:'Status', id: '7'}], "desc": "Dispatches work orders to internal employees, defining tasks and generating a work order record."}]}
];

// 属性映射对象
const objectAttrMapping: any = {
  customer: [
    {"name": "customer_id", "label": "Customer ID", "type": "string"},
    {"name": "customer_name", "label": "Name", "type": "string"},
    {"name": "social_credit_code", "label": "Social Credit Code", "type": "string"},
    {"name": "registered_capital", "label": "Reg. Capital (10k)", "type": "float"},
    {"name": "business_field", "label": "Industry", "type": "string"},
    {"name": "customer_level", "label": "Level", "type": "string"},
    {"name": "customer_address", "label": "Address", "type": "string"},
    {"name": "site_id", "label": "Base Station ID", "type": "string"}
  ],
  warehouse: [
    {"name": "warehouse_id", "label": "Warehouse ID", "type": "string"},
    {"name": "warehouse_name", "label": "Name", "type": "string"},
    {"name": "warehouse_address", "label": "Address", "type": "string"},
    {"name": "warehouse_area", "label": "Area (㎡)", "type": "float"},
    {"name": "current_storage_num", "label": "Current Stock", "type": "int"},
    {"name": "warehouse_status", "label": "Status", "type": "string"},
    {"name": "admin_name", "label": "Manager", "type": "string"}
  ],
  product: [
    {"name": "product_id", "label": "Product ID", "type": "string"},
    {"name": "product_name", "label": "Name", "type": "string"},
    {"name": "product_brand", "label": "Brand", "type": "string"},
    {"name": "product_model", "label": "Model", "type": "string"},
    {"name": "product_color", "label": "Color", "type": "string"},
    {"name": "equipment_id", "label": "Equipment ID", "type": "string"},
    {"name": "product_price", "label": "Price", "type": "float"},
    {"name": "warehouse_id", "label": "Warehouse ID", "type": "string"},
    {"name": "order_id", "label": "Order ID", "type": "string"}
  ],
  order: [
    {"name": "order_id", "label": "Order ID", "type": "string"},
    {"name": "customer_id", "label": "Customer ID", "type": "string"},
    {"name": "product_id", "label": "Product ID", "type": "string"},
    {"name": "product_num", "label": "Quantity", "type": "int"},
    {"name": "order_amount", "label": "Total Amount", "type": "float"},
    {"name": "order_time", "label": "Order Time", "type": "string"},
    {"name": "order_status", "label": "Status", "type": "string"},
    {"name": "shipping_address", "label": "Address", "type": "string"},
    {"name": "waybill_id", "label": "shipment order ID", "type": "string"}
  ],
  waybill: [
    {"name": "shipment_order_id", "label": "Shipment Order ID", "type": "string"},
    {"name": "order_id", "label": "Order ID", "type": "string"},
    {"name": "consignor_name", "label": "Consignor Name", "type": "string"},
    {"name": "consignor_phone", "label": "Consignor Phone", "type": "string"},
    {"name": "consignee_address", "label": "Consignee Addr.", "type": "string"},
    {"name": "consignee_name", "label": "Consignee Name", "type": "string"},
    {"name": "consignee_phone", "label": "Consignee Phone", "type": "string"},
    {"name": "pass_road_code", "label": "Pass Road Code", "type": "string"},
    {"name": "flight_id", "label": "Flight ID", "type": "string"},
    {"name": "company_id", "label": "Logistics Co. ID", "type": "string"}
  ],
  factory: [
    {"name": "factory_id", "label": "Factory ID", "type": "string"},
    {"name": "factory_name", "label": "Name", "type": "string"},
    {"name": "factory_type", "label": "Type", "type": "string"},
    {"name": "factory_address", "label": "Address", "type": "string"},
    {"name": "factory_area", "label": "Area (㎡)", "type": "float"},
    {"name": "employee_num", "label": "Employee Count", "type": "int"}
  ],
  road: [
    {"name": "road_code", "label": "Road Code", "type": "string"},
    {"name": "road_name", "label": "Name", "type": "string"},
    {"name": "road_level", "label": "Level", "type": "string"},
    {"name": "road_length", "label": "Length (km)", "type": "float"},
    {"name": "road_beginning", "label": "Start City", "type": "string"},
    {"name": "road_ending", "label": "End City", "type": "string"},
    {"name": "speed_low_limit", "label": "Min Speed (km/h)", "type": "int"},
    {"name": "speed_high_limit", "label": "Max Speed (km/h)", "type": "int"},
    {"name": "waybill_id", "label": "Shipment Order ID", "type": "string"},
    {"name": "address_id", "label": "Address ID", "type": "string"}
  ],
  flight: [
    {"name": "flight_id", "label": "Flight ID", "type": "string"},
    {"name": "airline_id", "label": "Airline ID", "type": "string"},
    {"name": "airplane_model", "label": "Aircraft Model", "type": "string"},
    {"name": "goods_type", "label": "Cargo Type", "type": "string"},
    {"name": "goods_name", "label": "Cargo Name", "type": "string"},
    {"name": "goods_num", "label": "Quantity", "type": "int"},
    {"name": "goods_weight", "label": "Weight (kg)", "type": "float"},
    {"name": "waybill_id", "label": "Shipment Order ID", "type": "string"},
    {"name": "address_id", "label": "Address ID", "type": "string"}
  ],
  equipment: [
    {"name": "equipment_id", "label": "Equipment ID", "type": "string"},
    {"name": "equipment_name", "label": "Name", "type": "string"},
    {"name": "equipment_model", "label": "Model", "type": "string"},
    {"name": "manufacturer_id", "label": "Manufacturer ID", "type": "string"},
    {"name": "product_id", "label": "Product ID", "type": "string"},
    {"name": "factory_id", "label": "Factory ID", "type": "string"}
  ],
  Base_Station: [
    {"name": "site_id", "label": "Site ID", "type": "string"},
    {"name": "site_name", "label": "Site Name", "type": "string"},
    {"name": "site_type", "label": "Type", "type": "string"},
    {"name": "address_id", "label": "Address ID", "type": "string"},
    {"name": "site_address", "label": "Address", "type": "string"},
    {"name": "site_longitude", "label": "Longitude", "type": "string"},
    {"name": "site_latitude", "label": "Latitude", "type": "string"},
    {"name": "line_id", "label": "Electricity Line ID", "type": "string"},
    {"name": "admin_name", "label": "Manager", "type": "string"},
    {"name": "admin_phone", "label": "Phone", "type": "string"}
  ],
  Contract: [
    {"name": "contract_id", "label": "Contract ID", "type": "string"},
    {"name": "contract_name", "label": "Name", "type": "string"},
    {"name": "contract_type", "label": "Type", "type": "string"},
    {"name": "party_a_name", "label": "Party A", "type": "string"},
    {"name": "party_b_name", "label": "Party B", "type": "string"},
    {"name": "signing_date", "label": "Date", "type": "string"}
  ],
  address: [
    {"name": "address_id", "label": "Address ID", "type": "string"},
    {"name": "province", "label": "Province", "type": "string"},
    {"name": "city", "label": "City", "type": "string"},
    {"name": "district/county", "label": "Dist./County", "type": "string"},
    {"name": "township/street", "label": "Town/Street", "type": "string"},
    {"name": "community", "label": "Community", "type": "string"},
    {"name": "street/lane", "label": "Street", "type": "string"},
    {"name": "building_num", "label": "Building No.", "type": "string"},
    {"name": "floor_num", "label": "Floor", "type": "string"},
    {"name": "room_num", "label": "Room", "type": "string"},
    {"name": "weather_id", "label": "Weather ID", "type": "string"},
    {"name": "flight_id", "label": "Flight ID", "type": "string"},
    {"name": "road_code", "label": "Road Code", "type": "string"}
  ],
  weather: [
    {"name": "weather_id", "label": "Weather ID", "type": "string"},
    {"name": "station_name", "label": "Station Name", "type": "string"},
    {"name": "address_id", "label": "Address ID", "type": "string"},
    {"name": "current_weather_phenomena", "label": "Current Weather", "type": "string"},
    {"name": "future_weather_phenomena", "label": "Forecast Weather", "type": "string"},
    {"name": "future_Weather_phenomena_time", "label": "Forecast Time", "type": "string"},
    {"name": "Weather_phenomena_class", "label": "Severity", "type": "string"},
    {"name": "Weather_phenomena_duration", "label": "Duration", "type": "string"},
    {"name": "temp_max", "label": "Max Temp", "type": "string"},
    {"name": "temp_min", "label": "Min Temp", "type": "string"},
    {"name": "wind_dir", "label": "Wind Dir.", "type": "string"},
    {"name": "wind_speed", "label": "Wind Speed", "type": "string"}
  ],
  marketing_act: [
    {"name": "act_id", "label": "Campaign ID", "type": "string"},
    {"name": "act_name", "label": "Name", "type": "string"},
    {"name": "act_date", "label": "Date", "type": "string"},
    {"name": "address_id", "label": "Address ID", "type": "string"},
    {"name": "act_address", "label": "Location", "type": "string"},
    {"name": "act_budget", "label": "Budget", "type": "string"},
    {"name": "branch_company", "label": "Branch", "type": "string"},
    {"name": "admin_name", "label": "Manager", "type": "string"},
    {"name": "admin_phone", "label": "Phone", "type": "string"}
  ],
  logistics_company: [
    {"name": "company_id", "label": "Company ID", "type": "string"},
    {"name": "company_name", "label": "Name", "type": "string"},
    {"name": "social_credit_code", "label": "Social Credit Code", "type": "string"},
    {"name": "company_address", "label": "Address", "type": "string"},
    {"name": "registered_capital", "label": "Reg. Capital (10k)", "type": "string"},
    {"name": "company_country", "label": "Country", "type": "string"},
    {"name": "company_city", "label": "HQ City", "type": "string"}
  ],
  employee: [
    {"name": "employee_id", "label": "Employee ID", "type": "string"},
    {"name": "employee_name", "label": "Name", "type": "string"},
    {"name": "department", "label": "Department", "type": "string"},
    {"name": "base_city", "label": "Base City", "type": "string"},
    {"name": "employee_sex", "label": "Gender", "type": "string"},
    {"name": "employee_age", "label": "Age", "type": "int"},
    {"name": "employee_phone", "label": "Phone", "type": "string"},
    {"name": "employee_email", "label": "Email", "type": "string"}
  ],
  electric_line: [
    {"name": "line_id", "label": "Line ID", "type": "string"},
    {"name": "line_name", "label": "Name", "type": "string"},
    {"name": "line_type", "label": "Type", "type": "string"},
    {"name": "voltage_level", "label": "Voltage", "type": "string"},
    {"name": "status", "label": "Status", "type": "string"},
    {"name": "total_length", "label": "Length", "type": "float"},
    {"name": "admin_name", "label": "Manager", "type": "string"},
    {"name": "admin_phone", "label": "Phone", "type": "string"}
  ],
  workorder: [
    {"name": "ticket_id", "label": "Ticket ID", "type": "string"},
    {"name": "ticket_principal", "label": "Principal", "type": "string"},
    {"name": "employee_id", "label": "Employee ID", "type": "string"},
    {"name": "phone_number", "label": "Phone", "type": "string"},
    {"name": "ticket_content", "label": "Content", "type": "string"},
    {"name": "distribution_time", "label": "Time", "type": "string"},
    {"name": "states", "label": "Status", "type": "string"}
  ]
};


// 逻辑列表数据
const logicList = [
  {"id": "weather01", "name": "Analysis of the severity of damage caused by Abnormal weather", "label": "Weather Severity Analysis", "desc": "Analyzes freight risks based on weather type and severity to determine if emergency plans are needed."},
  {"id": "weather02", "name": "Abnormal weather affects order analysis", "label": "Order Impact Analysis", "desc": "If emergency plans are triggered, identifies affected orders based on the location, time, and duration of the abnormal weather."},
  {"id": "weather03", "name": "Feasibility analysis of the response plan", "label": "Emergency Plan Feasibility", "desc": "Develops emergency plans for affected orders, analyzing additional costs and customer satisfaction to recommend the optimal solution."},
  {"id": "base_station", "name": "Analysis of Abnormal Weather Impact on Base Stations", "label": "Base Station Impact Analysis", "desc": "Analyzes the impact of abnormal weather on base stations."},
  {"id": "marketing", "name": "Impact of abnormal weather on marketing analysis", "label": "Marketing Impact Analysis", "desc": "Analyzes the impact of abnormal weather on offline marketing campaigns."},
];


// 关系列表数据
const linkList = [
  {"源对象":"equipment","源对象中文":"生产设备","关系标签":"属于","目标对象":"factory","目标对象中文":"工厂", "sourcePort": "bottom", "targetPort": "top", "sourceName":"equipment", "targetName":"factory", "sourceTag":"Belongs to"},
  {"源对象":"equipment","源对象中文":"生产设备","关系标签":"生产","目标对象":"product","目标对象中文":"产品", "sourcePort": "left", "targetPort": "right", "sourceName":"equipment", "targetName":"product", "sourceTag":"Produces"},
  {"源对象":"product","源对象中文":"产品","关系标签":"存放于","目标对象":"warehouse","目标对象中文":"仓库", "sourcePort": "bottom", "targetPort": "top", "sourceName":"product", "targetName":"warehouse", "sourceTag":"Stored in"},
  {"源对象":"order","源对象中文":"订单","关系标签":"包含","目标对象":"product","目标对象中文":"产品", "sourcePort": "right", "targetPort": "left", "sourceName":"order", "targetName":"product", "sourceTag":"Contains"},
  {"源对象":"customer","源对象中文":"客户","关系标签":"生成","目标对象":"order","目标对象中文":"订单", "sourcePort": "bottom", "targetPort": "top", "sourceName":"customer", "targetName":"order", "sourceTag":"Generates"},
  {"源对象":"waybill","源对象中文":"货运单","关系标签":"运送","目标对象":"order","目标对象中文":"订单", "sourcePort": "bottom", "targetPort": "top", "sourceName":"waybill", "targetName":"order", "sourceTag":"Ships"},
  {"源对象":"logistics_company","源对象中文":"物流公司","关系标签":"生成","目标对象":"waybill","目标对象中文":"货运单", "sourcePort": "bottom", "targetPort": "top", "sourceName":"logistics_company", "targetName":"waybill", "sourceTag":"Generates"},
  {"源对象":"waybill","源对象中文":"货运单","关系标签":"经过","目标对象":"road","目标对象中文":"公路", "sourcePort": "left", "targetPort": "right", "sourceName":"waybill", "targetName":"road", "sourceTag":"Passes"},
  {"源对象":"waybill","源对象中文":"货运单","关系标签":"使用","目标对象":"flight","目标对象中文":"航班", "sourcePort": "left", "targetPort": "right", "sourceName":"waybill", "targetName":"flight", "sourceTag":"Uses"},
  {"源对象":"flight","源对象中文":"航班","关系标签":"经过","目标对象":"address","目标对象中文":"地址", "sourcePort": "left", "targetPort": "right", "sourceName":"flight", "targetName":"address", "sourceTag":"Passes"},
  {"源对象":"road","源对象中文":"公路","关系标签":"属于","目标对象":"address","目标对象中文":"地址", "sourcePort": "bottom", "targetPort": "top", "sourceName":"road", "targetName":"address", "sourceTag":"Belongs to"},
  {"源对象":"marketing_act","源对象中文":"营销活动","关系标签":"位于","目标对象":"address","目标对象中文":"地址", "sourcePort": "top", "targetPort": "bottom", "sourceName":"marketing_act", "targetName":"address", "sourceTag":"Located at"},
  {"源对象":"weather","源对象中文":"天气","关系标签":"影响","目标对象":"address","目标对象中文":"地址", "sourcePort": "right", "targetPort": "left", "sourceName":"weather", "targetName":"address", "sourceTag":"Affects"},
  {"源对象":"customer","源对象中文":"客户","关系标签":"签订","目标对象":"Contract","目标对象中文":"合同", "sourcePort": "top", "targetPort": "bottom", "sourceName":"customer", "targetName":"Contract", "sourceTag":"Signs"},
  {"源对象":"logistics_company","源对象中文":"物流公司","关系标签":"签订","目标对象":"Contract","目标对象中文":"合同", "sourcePort": "right", "targetPort": "left", "sourceName":"logistics_company", "targetName":"Contract", "sourceTag":"Signs"},
  {"源对象":"employee","源对象中文":"员工","关系标签":"管理","目标对象":"marketing_act","目标对象中文":"营销活动", "sourcePort": "right", "targetPort": "left", "sourceName":"employee", "targetName":"marketing_act", "sourceTag":"Manages"},
  {"源对象":"employee","源对象中文":"员工","关系标签":"管理","目标对象":"Base_Station","目标对象中文":"基站", "sourcePort": "top", "targetPort": "bottom", "sourceName":"employee", "targetName":"Base_Station", "sourceTag":"Manages"},
  {"源对象":"electric_line","源对象中文":"电力线路","关系标签":"供应","目标对象":"Base_Station","目标对象中文":"基站", "sourcePort": "right", "targetPort": "left", "sourceName":"electric_line", "targetName":"Base_Station", "sourceTag":"Supplies"},
  {"源对象":"Base_Station","源对象中文":"基站","关系标签":"覆盖","目标对象":"customer","目标对象中文":"客户", "sourcePort": "right", "targetPort": "left", "sourceName":"Base_Station", "targetName":"customer", "sourceTag":"Covers"},
  {"源对象":"workorder","源对象中文":"工单","关系标签":"指派","目标对象":"employee","目标对象中文":"员工", "sourcePort": "right", "targetPort": "left", "sourceName":"workorder", "targetName":"employee", "sourceTag":"Assigned to"},
  // 逻辑与对象引用关系
  {"源对象":"weather01","源对象中文":"异常天气危害等级分析","关系标签":"引用","目标对象":"weather","目标对象中文":"天气", "sourcePort": "bottom", "targetPort": "top", "sourceName":"weather01", "targetName":"weather", "sourceTag":"References"},
  {"源对象":"weather03","源对象中文":"应对方案可行性分析","关系标签":"引用","目标对象":"Contract","目标对象中文":"合同", "sourcePort": "left", "targetPort": "right", "sourceName":"weather03", "targetName":"Contract", "sourceTag":"References"},
  {"源对象":"weather03","源对象中文":"应对方案可行性分析","关系标签":"引用","目标对象":"customer","目标对象中文":"客户", "sourcePort": "bottom", "targetPort": "right", "sourceName":"weather03", "targetName":"customer", "sourceTag":"References"},
  {"源对象":"base_station","源对象中文":"异常天气影响基站分析","关系标签":"引用","目标对象":"Base_Station","目标对象中文":"基站", "sourcePort": "bottom", "targetPort": "top", "sourceName":"base_station", "targetName":"Base_Station", "sourceTag":"References"},
  {"源对象":"marketing","源对象中文":"异常天气影响营销分析","关系标签":"引用","目标对象":"marketing_act","目标对象中文":"营销活动", "sourcePort": "top", "targetPort": "bottom", "sourceName":"marketing", "targetName":"marketing_act", "sourceTag":"References"},
  // {"源对象":"weather02","源对象中文":"异常天气影响订单分析","关系标签":"引用","目标对象":"waybill","目标对象中文":"货运单", "sourcePort": "top", "targetPort": "bottom"},
  {"源对象":"weather02","源对象中文":"异常天气影响订单分析","关系标签":"引用","目标对象":"order","目标对象中文":"订单", "sourcePort": "top", "targetPort": "bottom", "sourceName":"weather02", "targetName":"order", "sourceTag":"References"},
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
    actions: (obj as any).actions,
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
    objectLabels: linkList.filter(link => link.源对象 === logic.id).map(link => link.目标对象)
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
      text: link.sourceTag
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
