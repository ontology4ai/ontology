// 节点位置配置（根据实际布局更新）
const nodePositions: { [key: string]: { x: number; y: number } } = {
  // 对象节点位置（根据注释中的实际坐标更新）
  customer: { x: 600, y: 230 },
  warehouse: { x: 600, y: 620 },
  product: { x: 600, y: 460 },
  order: { x: 390, y: 460 },
  waybill: { x: 390, y: 230 },
  factory: { x: 810, y: 620 },
  road: { x: 0, y: 50 },
  flight: { x: 190, y: 230 },
  equipment: { x: 810, y: 460 },
  Base_Station: { x: 0, y: 460 },
  Contract: { x: 600, y: 60 },
  address: { x: 0, y: 230 },
  weather: { x: -240, y: 230 },
  marketing_act: { x: 190, y: 460 },
  logistics_company: { x: 390, y: 60 },
  employee: { x: 0, y: 620 },
  electric_line: { x: -240, y: 460 },
  workorder: { x: -240, y: 620 },
  // 逻辑节点位置（根据注释中的实际坐标更新）
  weather01: { x: -280, y: 50 },
  weather02: { x: 350, y: 620 },
  weather03: { x: 770, y: 60 },
  base_station: { x: -170, y: 340 },
  marketing: { x: 150, y: 620 }
};

export default nodePositions;