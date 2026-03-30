const dataset = [
  {
    object: '客户',
    name: 'customer',
    label: '客户明细表',
    desc: '公司的各类客户',
    fields: [
      {
        name: 'customer_id',
        label: '客户ID',
      },
      {
        name: 'customer_name',
        label: '客户名称',
      },
      {
        name: 'social_credit_code',
        label: '社会信用代码',
      },
      {
        name: 'registered_capital',
        label: '注册资本(万元)',
      },
      {
        name: 'customer_level',
        label: '客户等级',
      },
      {
        name: 'customer_address',
        label: '客户地址',
      },
    ],
  },
  {
    object: '仓库',
    name: 'warehouse',
    label: '仓库明细表',
    desc: '存放待发货产品的仓库',
    fields: [
      {
        name: 'warehouse_id',
        label: '仓库ID',
      },
      {
        name: 'warehouse_name',
        label: '仓库名称',
      },
      {
        name: 'warehouse_address',
        label: '仓库地址',
      },
      {
        name: 'warehouse_area',
        label: '仓库面积(㎡)',
      },
      {
        name: 'current_storage_num',
        label: '当前存放量',
      },
      {
        name: 'warehouse_status',
        label: '仓库状态',
      },
      {
        name: 'admin_name',
        label: '管理员姓名',
      },
    ],
  },
  {
    object: '产品',
    name: 'product',
    label: '产品明细表',
    desc: '公司生产的产品',
    fields: [
      {
        name: 'product_id',
        label: '产品ID',
      },
      {
        name: 'product_name',
        label: '产品名称',
      },
      {
        name: 'product_brand',
        label: '产品品牌',
      },
      {
        name: 'product_model',
        label: '产品型号',
      },
      {
        name: 'product_color',
        label: '产品颜色',
      },
      {
        name: 'storage_capacity',
        label: '存储容量',
      },
      {
        name: 'product_price',
        label: '产品价格',
      },
      {
        name: 'product_stock',
        label: '库存数量',
      },
    ],
  },
  {
    object: '订单',
    name: 'order',
    label: '订单明细表',
    desc: '客户采购产品的订单',
    fields: [
      {
        name: 'order_id',
        label: '订单ID',
      },
      {
        name: 'customer_id',
        label: '客户ID',
      },
      {
        name: 'product_id',
        label: '产品ID',
      },
      {
        name: 'product_num',
        label: '产品数量',
      },
      {
        name: 'order_amount',
        label: '订单总金额（元）',
      },
      {
        name: 'order_time',
        label: '下单时间',
      },
      {
        name: 'order_status',
        label: '订单状态',
      },
      {
        name: 'shipping_address',
        label: '收货地址',
      },
    ],
  },
  {
    object: '货运单',
    name: 'waybill',
    label: '货运单明细表',
    desc: '运送客户购买产品的货运单',
    fields: [
      {
        name: 'waybill_id',
        label: '货运单ID',
      },
      {
        name: 'order_id',
        label: '订单ID',
      },
      {
        name: 'consignor_name',
        label: '发货人姓名',
      },
      {
        name: 'consignor_phone',
        label: '发货人手机',
      },
      {
        name: 'consignee_address',
        label: '收货地址',
      },
      {
        name: 'consignee_name',
        label: '收货人姓名',
      },
      {
        name: 'consignee_phone',
        label: '收货人手机',
      },
      {
        name: 'pass_road_code',
        label: '经过公路编号',
      },
    ],
  },
  {
    object: '工厂',
    name: 'factory',
    label: '工厂明细表',
    desc: '生产产品的工厂',
    fields: [
      {
        name: 'factory_id',
        label: '工厂ID',
      },
      {
        name: 'factory_name',
        label: '工厂名称',
      },
      {
        name: 'factory_type',
        label: '工厂类型',
      },
      {
        name: 'factory_address',
        label: '工厂地址',
      },
      {
        name: 'factory_area',
        label: '占地面积(㎡)',
      },
      {
        name: 'employee_num',
        label: '员工数量',
      },
    ],
  },
  {
    object: '公路',
    name: 'road',
    label: '公路明细表',
    desc: '陆上运输行驶的公路',
    fields: [
      {
        name: 'road_code',
        label: '公路编号',
      },
      {
        name: 'road_name',
        label: '公路名称',
      },
      {
        name: 'road_level',
        label: '公路等级',
      },
      {
        name: 'road_length',
        label: '公路长度(km)',
      },
      {
        name: 'road_beginning',
        label: '公路起点城市',
      },
      {
        name: 'road_ending',
        label: '公路终点城市',
      },
      {
        name: 'speed_low_limit',
        label: '最低限速(㎞/h)',
      },
      {
        name: 'speed_high_limit',
        label: '最高限速(㎞/h)',
      },
    ],
  },
  {
    object: '航班',
    name: 'flight',
    label: '航班明细表',
    desc: '货运航班',
    fields: [
      {
        name: 'flight_id',
        label: '航班ID',
      },
      {
        name: 'airline_id',
        label: '航空公司ID',
      },
      {
        name: 'airplane_model',
        label: '机型',
      },
      {
        name: 'goods_type',
        label: '货物类型',
      },
      {
        name: 'goods_name',
        label: '货物名称',
      },
      {
        name: 'goods_num',
        label: '货物数量',
      },
      {
        name: 'goods_weight',
        label: '货物重量(kg)',
      },
    ],
  },
  {
    object: '航线',
    name: 'flight_route',
    label: '航线明细表',
    desc: '货运航线',
    fields: [
      {
        name: 'flight_route_id',
        label: '航线ID',
      },
      {
        name: 'flight_route_name',
        label: '航线名称',
      },
      {
        name: 'beginning_city',
        label: '起点城市',
      },
      {
        name: 'ending_city',
        label: '终点城市',
      },
      {
        name: 'beginning_airport',
        label: '起点机场',
      },
      {
        name: 'ending_airport',
        label: '终点机场',
      },
      {
        name: 'status',
        label: '状态',
      },
    ],
  },
  {
    object: '航空公司',
    name: 'airline',
    label: '航空公司明细表',
    desc: '航空公司',
    fields: [
      {
        name: 'airline_id',
        label: '航空公司ID',
      },
      {
        name: 'airline_name',
        label: '航空公司名称',
      },
      {
        name: 'airline_code',
        label: '航空公司代码',
      },
      {
        name: 'social_credit_code',
        label: '社会信用代码',
      },
      {
        name: 'registered_capital',
        label: '注册资本(万元)',
      },
      {
        name: 'airline_country',
        label: '所属国家',
      },
      {
        name: 'airline_city',
        label: '总部所在城市',
      },
    ],
  },
  {
    object: '卡车',
    name: 'truck',
    label: '卡车明细表',
    desc: '用于运输产品和原料的卡车',
    fields: [
      {
        name: 'truck_id',
        label: '卡车ID',
      },
      {
        name: 'vin_code',
        label: 'VIN码',
      },
      {
        name: 'truck_brand',
        label: '品牌',
      },
      {
        name: 'truck_model',
        label: '型号',
      },
      {
        name: 'truck_color',
        label: '颜色',
      },
      {
        name: 'truck_weight',
        label: '重量',
      },
      {
        name: 'truck_price',
        label: '价格',
      },
    ],
  },
  {
    object: '生产设备',
    name: 'equipment',
    label: '设备明细表',
    desc: '生产产品使用的设备',
    fields: [
      {
        name: 'equipment_id',
        label: '设备ID',
      },
      {
        name: 'equipment_name',
        label: '设备名称',
      },
      {
        name: 'equipment_model',
        label: '设备型号',
      },
      {
        name: 'manufacturer_id',
        label: '生产厂商ID',
      },
      {
        name: 'equipment_weight',
        label: '重量',
      },
      {
        name: 'equipment_price',
        label: '价格',
      },
    ],
  },
  {
    object: '基站',
    name: 'Base_Station',
    label: '基站明细表',
    desc: '移动通信基站',
    fields: [
      {
        name: 'site_id',
        label: '基站ID',
      },
      {
        name: 'site_name',
        label: '基站名称',
      },
      {
        name: 'site_type',
        label: '基站类型',
      },
      {
        name: 'site_address',
        label: '基站地址',
      },
      {
        name: 'site_longitude',
        label: '经度',
      },
      {
        name: 'site_latitude',
        label: '纬度',
      },
      {
        name: 'admin_name',
        label: '管理员姓名',
      },
      {
        name: 'admin_phone',
        label: '管理员手机',
      },
    ],
  },
  {
    object: '合同',
    name: 'Contract',
    label: '合同明细表',
    desc: '商业合同',
    fields: [
      {
        name: 'contract_id',
        label: '合同ID',
      },
      {
        name: 'contract_name',
        label: '合同名称',
      },
      {
        name: 'contract_type',
        label: '合同类型',
      },
      {
        name: 'party_a_name',
        label: '甲方名称',
      },
      {
        name: 'party_b_name',
        label: '乙方名称',
      },
      {
        name: 'signing_date',
        label: '签订日期',
      },
    ],
  },
  {
    object: '地址',
    name: 'address',
    label: '地址明细表',
    desc: '地址数据',
    fields: [
      {
        name: 'province',
        label: '省/自治区',
      },
      {
        name: 'city',
        label: '市',
      },
      {
        name: 'district/county',
        label: '区/县',
      },
      {
        name: 'township/street',
        label: '乡镇/街道',
      },
      {
        name: 'community',
        label: '社区/行政村',
      },
      {
        name: 'street/lane',
        label: '街巷名',
      },
      {
        name: 'building_num',
        label: '门楼牌号',
      },
      {
        name: 'floor_num',
        label: '楼层',
      },
      {
        name: 'room_num',
        label: '户号',
      },
    ],
  },
];
export const useDataset = () => {
  const getFields = datasetName => {
    return dataset.find(item => item.name === datasetName)?.fields || [];
  };
  return {
    dataset,
    getFields,
  };
};
