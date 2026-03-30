export default [
  ...[
    {
      "id": "factory",
      "x": 50,
      "y": 50,
      "data": {
        "id": "factory",
        "label": "工厂"
      }
    },
    {
      "id": "warehouse",
      "x": 250,
      "y": 50,
      "data": {
        "id": "warehouse",
        "label": "仓库"
      },
    },
    {
      "id": "employee",
      "x": 750,
      "y": 50,
      "data": {
        "id": "employee",
        "label": "员工"
      },
    },
    {
      "id": "equipment",
      "x": 50,
      "y": 250,
      "data": {
        "id": "equipment",
        "label": "设备",
      }
    },
    {
      "id": "product",
      "x": 250,
      "y": 250,
      "data": {
        "id": "product",
        "label": "产品"
      }
    },
    {
      "id": "order",
      "x": 450,
      "y": 250,
      "data": {
        "id": "order",
        "label": "订单"
      }
    },
    {
      "id": "customer",
      "x": 250,
      "y": 450,
      "data": {
        "id": "customer",
        "label": "客户"
      }
    },
    {
      "id": "marketing_act",
      "x": 650,
      "y": 250,
      "data": {
        "id": "marketing_act",
        "label": "营销活动"
      }
    },
    {
      "id": "electric_line",
      "x": 1050,
      "y": 250,
      "data": {
        "id": "electric_line",
        "label": "电力线路"
      }
    },
    {
      "id": "waybill",
      "x": 450,
      "y": 450,
      "data": {
        "id": "waybill",
        "label": "货运单"
      }
    }, 
    {
      "id": "flight",
      "x": 650,
      "y": 450,
      "data": {
        "id": "flight",
        "label": "航班"
      }
    },
    {
      "id": "address",
      "x": 850,
      "y": 450,
      "data": {
        "id": "address",
        "label": "地址"
      }
    },
    {
      "id": "weather",
      "x": 1050,
      "y": 450,
      "data": {
        "id": "weather",
        "label": "天气"
      }
    },
    {
      "id": "Contract",
      "x": 250,
      "y": 650,
      "data": {
        "id": "Contract",
        "label": "合同"
      }
    },
    {
      "id": "logistics_company",
      "x": 450,
      "y": 650,
      "data": {
        "id": "logistics_company",
        "label": "物流公司"
      }
    },
    {
      "id": "road",
      "x": 650,
      "y": 650,
      "data": {
        "id": "road",
        "label": "公路"
      }
    },
    {
      "id": "Base_Station",
      "x": 850,
      "y": 250,
      "data": {
        "id": "Base_Station",
        "label": "基站"
      }
    }
  ].map(node => {
    return {
      ...node,
      "shape": "dag-node",
      "ports": [
        {
          "id": "1",
          "group": "top"
        },
        {
          "id": "2",
          "group": "right"
        },
        {
          "id": "3",
          "group": "bottom"
        },
        {
          "id": "4",
          "group": "left"
        }
      ]
    }
  }),
  {
    "id": "edge-1",
    "shape": "dag-edge",
    "source": {
      "cell": "equipment",
      "port": "1"
    },
    "target": {
      "cell": "factory",
      "port": "3"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '属于'
      }
    }
  },
  {
    "id": "edge-2",
    "shape": "dag-edge",
    "source": {
      "cell": "equipment",
      "port": "2"
    },
    "target": {
      "cell": "product",
      "port": "4"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '生产'
      }
    }
  },
  {
    "id": "edge-3",
    "shape": "dag-edge",
    "source": {
      "cell": "product",
      "port": "1"
    },
    "target": {
      "cell": "warehouse",
      "port": "3"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '存放于'
      }
    }
  },
  {
    "id": "edge-4",
    "shape": "dag-edge",
    "source": {
      "cell": "product",
      "port": "2"
    },
    "target": {
      "cell": "order",
      "port": "4"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '属于'
      }
    }
  },
  {
    "id": "edge-5",
    "shape": "dag-edge",
    "source": {
      "cell": "customer",
      "port": "1"
    },
    "target": {
      "cell": "order",
      "port": "4"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '生成'
      }
    }
  },
  {
    "id": "edge-6",
    "shape": "dag-edge",
    "source": {
      "cell": "waybill",
      "port": "1"
    },
    "target": {
      "cell": "order",
      "port": "3"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '运送'
      }
    }
  },
  {
    "id": "edge-7",
    "shape": "dag-edge",
    "source": {
      "cell": "waybill",
      "port": "2"
    },
    "target": {
      "cell": "flight",
      "port": "4"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '使用'
      }
    }
  },
  {
    "id": "edge-8",
    "shape": "dag-edge",
    "source": {
      "cell": "flight",
      "port": "2"
    },
    "target": {
      "cell": "address",
      "port": "4"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '经过'
      }
    }
  },
  {
    "id": "edge-9",
    "shape": "dag-edge",
    "source": {
      "cell": "employee",
      "port": "3"
    },
    "target": {
      "cell": "marketing_act",
      "port": "1"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '管理'
      }
    }
  },
  {
    "id": "edge-10",
    "shape": "dag-edge",
    "source": {
      "cell": "weather",
      "port": "4"
    },
    "target": {
      "cell": "address",
      "port": "2"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '影响'
      }
    }
  },
  {
    "id": "edge-11",
    "shape": "dag-edge",
    "source": {
      "cell": "logistics_company",
      "port": "1"
    },
    "target": {
      "cell": "waybill",
      "port": "3"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '生成'
      }
    }
  },
  {
    "id": "edge-12",
    "shape": "dag-edge",
    "source": {
      "cell": "waybill",
      "port": "3"
    },
    "target": {
      "cell": "road",
      "port": "1"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '使用'
      }
    }
  },
  {
    "id": "edge-13",
    "shape": "dag-edge",
    "source": {
      "cell": "road",
      "port": "1"
    },
    "target": {
      "cell": "address",
      "port": "3"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '经过'
      }
    }
  },
  {
    "id": "edge-14",
    "shape": "dag-edge",
    "source": {
      "cell": "Base_Station",
      "port": "3"
    },
    "target": {
      "cell": "address",
      "port": "1"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '位于'
      }
    }
  },
  {
    "id": "edge-15",
    "shape": "dag-edge",
    "source": {
      "cell": "customer",
      "port": "3"
    },
    "target": {
      "cell": "Contract",
      "port": "1"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '签订'
      }
    }
  },
  {
    "id": "edge-16",
    "shape": "dag-edge",
    "source": {
      "cell": "logistics_company",
      "port": "4"
    },
    "target": {
      "cell": "Contract",
      "port": "2"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '签订'
      }
    }
  },
  {
    "id": "edge-17",
    "shape": "dag-edge",
    "source": {
      "cell": "employee",
      "port": "3"
    },
    "target": {
      "cell": "Base_Station",
      "port": "1"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '管理'
      }
    }
  },
  {
    "id": "edge-18",
    "shape": "dag-edge",
    "source": {
      "cell": "electric_line",
      "port": "4"
    },
    "target": {
      "cell": "Base_Station",
      "port": "2"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '供应'
      }
    }
  },
  {
    "id": "edge-19",
    "shape": "dag-edge",
    "source": {
      "cell": "Base_Station",
      "port": "4"
    },
    "target": {
      "cell": "customer",
      "port": "2"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '覆盖'
      }
    }
  },
  {
    "id": "edge-20",
    "shape": "dag-edge",
    "source": {
      "cell": "marketing_act",
      "port": "3"
    },
    "target": {
      "cell": "address",
      "port": "4"
    },
    "zIndex": 0,
    label: {
      data: {
        text: '位于'
      }
    }
  }
]