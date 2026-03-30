export default {
  "zh-CN":{ 
    allResultContent: [
      {
        type: 'text',
        data: `当前模拟的场景是2026年5月1日有12-13级台风在我国广东深圳沿海一带登录，预计于5月5日晚间逐渐离开我国大陆，需分析此次异常天气将影响哪些订单的货物运输，并给出应对方案。\n\n首先，调用【异常天气危害等级分析】逻辑来判断此次异常天气是否危害严重，是否需要采取应急措施。由于12-13级台风会产生重度影响，所以需要制定应急方案。\n\n其次，调用【异常天气影响订单分析】逻辑，依据此次异常天气影响的时间范围、空间范围，判断是否存在途径这些受灾地区的货运单，并获取与之对应的订单信息\n\n`
      },
      {
        type: 'list',
        data: `1、第一步，根据异常天气发生地区为广东深圳沿海一带查询“地址”，发现包含深圳市 、东莞市 、惠州市、中山市、珠海市等地。
        \n2、第二步，根据查询到的城市，查询“航班”和“公路”。其中重要运输公路有G4 京港澳高速、G4 京港澳高速（东莞段）、G25 长深高速（惠深高速段）、G4W 广澳高速、G4 京港澳高速（广州段）、S47 江珠高速等；在灾害发生的时间段内，途径这些地区的航班包括中国国际航空CA1837、中国东方航空MU2325、深圳航空ZH9871、海南航空HU7701。
        \n3、第三步，基于得到的重要运输路段信息和航班信息，查询“货运单”，获取受影响的货运单号，共查询到三条结果，分别是AB5425687654、AB5425687655、AB5425687656。
        \n4、第四步，通过查询到的货运单号，获取相关的订单信息，订单编号分别是94738112451145、94738112451146、94738112451147。`
      },
      {
        type: 'text',
        data: `\n接下来，调用【应急方案可行性分析】逻辑，主要目标是针对上述分析结果，制定异常天气应急方案，并分析产生的损失。\n\n`
      },
      {
        type: 'list',
        data: `1、第一步，获取订单详细数据。
        \n2、第二步，查询物流合同中关于调整计划带来的物流费用变更数据。
        \n3、第三步，查询订单关联的销售合同中关于延迟到货的赔偿金额数据。
        \n4、第四步，基于历史经验计算变更发货时间可能对客户满意度产生的影响，通常情况下提前发货客户满意度会上升30%，延迟发货，客户满意度会下降50%。`
      },
      {
        type: 'text',
        data: `\n最后，生成应急方案如下，包括提前发货和延迟发货两种应对方案，并分别计算这两种方案带来的成本和收益变更。\n\n台风影响时间预计为2026年5月1日到5月5日，主要影响城市有深圳市 东莞市 、惠州市、中山市、珠海市，受影响的货运单和订单如下：\n\n`
      },
      {
        type: 'table',
        data: {
          columns: [
            {
              title: '货运单号',
              width: 90,
              dataIndex: 'orderId'
            },
            {
              title: '物流服务商',
              width: 115,
              dataIndex: 'logisticsProvider'
            },
            {
              title: '寄件地址',
              width: 100,
              dataIndex: 'consignorAddress'
            },
            {
              title: '收件地址',
              width: 100,
              dataIndex: 'consigneeAddress'
            },
            {
              title: '计划运输时间',
              width: 120,
              dataIndex: 'planTime'
            },
            {
              title: '关联订单ID',
              width: 120,
              dataIndex: 'relatedOrderID'
            },
            {
              title: '关联客户名称',
              width: 120,
              dataIndex: 'relatedCustomerName'
            },
          ],
          data: [
            { orderId: 'AB5425687654', logisticsProvider: '**公司', consignorAddress: '广东省深圳市**区**路**号', consigneeAddress: '江苏省苏州市**区**路**号', planTime: '2026-05-01到2026-05-04', relatedOrderID: '94738112451145', relatedCustomerName: '94738112451145' },
            { orderId: 'AB5425687655', logisticsProvider: '**公司', consignorAddress: '广东省深圳市**区**路**号', consigneeAddress: '江苏省苏州市**区**路**号', planTime: '2026-05-02到2026-05-04', relatedOrderID: '94738112451146', relatedCustomerName: '94738112451146' },
            { orderId: 'AB5425687656', logisticsProvider: '**公司', consignorAddress: '广东省深圳市**区**路**号', consigneeAddress: '江苏省苏州市**区**路**号', planTime: '2026-05-04到2026-05-06', relatedOrderID: '94738112451147', relatedCustomerName: '94738112451147' },
          ]
        }
      },
      {
        type: 'text',
        data: `\n推荐的应急方案如下：\n\n`
      },
      {
        type: 'tip',
        data: {
          title: '方案1：提前发货',
          subtitle: '建议赶在台风影响到来前，完成相关的物流运输,物流调整计划如下:'
        }
      },
      {
        type: 'table',
        data: {
          columns: [
            {
              title: '货运单号',
              width: 120,
              dataIndex: 'orderId'
            },
            {
              title: '物流服务商',
              width: 120,
              dataIndex: 'logisticsProvider'
            },
            {
              title: '关联订单ID',
              width: 120,
              dataIndex: 'relatedOrderID'
            },
            {
              title: '关联客户名称',
              width: 120,
              dataIndex: 'relatedCustomerName'
            },
            {
              title: '原计划运输时间',
              width: 140,
              dataIndex: 'originalPlanTime'
            },
            {
              title: '调整后运输时间',
              width: 140,
              dataIndex: 'adjustedPlanTime'
            },
            {
              title: '预估成本变更（元）',
              width: 130,
              dataIndex: 'estimatedCostChange'
            },
            {
              title: '预估收益变更（元）',
              width: 130,
              dataIndex: 'estimatedRevenueChange'
            },
            {
              title: '客户满意度',
              width: 100,
              dataIndex: 'customerSatisfaction'
            },
          ],
          data: [
            { orderId: 'AB5425687654', logisticsProvider: '**公司', relatedOrderID: '94738112451145', relatedCustomerName: '94738112451145', originalPlanTime: '2026-05-01到2026-05-04', adjustedPlanTime: '2026-04-26到2026-04-28', estimatedCostChange: '****', estimatedRevenueChange: '****', customerSatisfaction: '6分' },
            { orderId: 'AB5425687655', logisticsProvider: '**公司', relatedOrderID: '94738112451146', relatedCustomerName: '94738112451146', originalPlanTime: '2026-05-02到2026-05-04', adjustedPlanTime: '2026-04-26到2026-04-28', estimatedCostChange: '****', estimatedRevenueChange: '****', customerSatisfaction: '7分' },
            { orderId: 'AB5425687656', logisticsProvider: '**公司', relatedOrderID: '94738112451147', relatedCustomerName: '94738112451147', originalPlanTime: '2026-05-04到2026-05-06', adjustedPlanTime: '2026-04-26到2026-04-28', estimatedCostChange: '****', estimatedRevenueChange: '****', customerSatisfaction: '5分' },
          ]
        }
      },
      {
        type: 'tip',
        data: {
          title: '方案2：延迟发货',
          subtitle: '建议在台风影响减弱后，再进行相关的物流运输，物流调整计划如下：：'
        }
      },
      {
        type: 'table',
        data: {
          columns: [
            {
              title: '货运单号',
              width: 120,
              dataIndex: 'orderId'
            },
            {
              title: '物流服务商',
              width: 120,
              dataIndex: 'logisticsProvider'
            },
            {
              title: '关联订单ID',
              width: 120,
              dataIndex: 'relatedOrderID'
            },
            {
              title: '关联客户名称',
              width: 120,
              dataIndex: 'relatedCustomerName'
            },
            {
              title: '原计划运输时间',
              width: 140,
              dataIndex: 'originalPlanTime'
            },
            {
              title: '调整后运输时间',
              width: 140,
              dataIndex: 'adjustedPlanTime'
            },
            {
              title: '预估成本变更（元）',
              width: 130,
              dataIndex: 'estimatedCostChange'
            },
            {
              title: '预估收益变更（元）',
              width: 130,
              dataIndex: 'estimatedRevenueChange'
            },
            {
              title: '客户满意度',
              width: 100,
              dataIndex: 'customerSatisfaction'
            },
          ],
          data: [
            { orderId: 'AB5425687654', logisticsProvider: '**公司', relatedOrderID: '94738112451145', relatedCustomerName: '94738112451145', originalPlanTime: '2026-05-01到2026-05-04', adjustedPlanTime: '2026-05-08到2026-05-10', estimatedCostChange: '****', estimatedRevenueChange: '****', customerSatisfaction: '3分' },
            { orderId: 'AB5425687655', logisticsProvider: '**公司', relatedOrderID: '94738112451146', relatedCustomerName: '94738112451146', originalPlanTime: '2026-05-02到2026-05-04', adjustedPlanTime: '2026-05-08到2026-05-10', estimatedCostChange: '****', estimatedRevenueChange: '****', customerSatisfaction: '4分' },
            { orderId: 'AB5425687656', logisticsProvider: '**公司', relatedOrderID: '94738112451147', relatedCustomerName: '94738112451147', originalPlanTime: '2026-05-04到2026-05-06', adjustedPlanTime: '2026-05-08到2026-05-10', estimatedCostChange: '****', estimatedRevenueChange: '****', customerSatisfaction: '5分' },
          ]
        }
      },
    ],
    schemeContent1: [
      {
        type: 'text',
        data: '开始执行方案1，更新"货运单"中对应单号的计划运输时间。\n\n'
      },
      {
        type: 'table',
        data: {
          columns: [
            {
              title: '货运单号',
              width: 120,
              dataIndex: 'orderId'
            },
            {
              title: '物流服务商',
              width: 120,
              dataIndex: 'logisticsProvider'
            },
            {
              title: '寄件地址',
              width: 150,
              dataIndex: 'consignorAddress'
            },
            {
              title: '收件地址',
              width: 150,
              dataIndex: 'consigneeAddress'
            },
            {
              title: '计划运输时间',
              width: 140,
              dataIndex: 'planTime'
            },
            {
              title: '关联订单ID',
              width: 120,
              dataIndex: 'relatedOrderID'
            },
            {
              title: '关联客户名称',
              width: 120,
              dataIndex: 'relatedCustomerName'
            },
          ],
          data: [
            { orderId: 'AB5425687654', logisticsProvider: '**公司', consignorAddress: '广东省深圳市**区**路**号', consigneeAddress: '江苏省苏州市**区**路**号', planTime: '2026-04-26到2026-04-28', relatedOrderID: '94738112451145', relatedCustomerName: '94738112451145' },
            { orderId: 'AB5425687655', logisticsProvider: '**公司', consignorAddress: '广东省深圳市**区**路**号', consigneeAddress: '江苏省苏州市**区**路**号', planTime: '2026-04-26到2026-04-28', relatedOrderID: '94738112451146', relatedCustomerName: '94738112451146' },
            { orderId: 'AB5425687656', logisticsProvider: '**公司', consignorAddress: '广东省深圳市**区**路**号', consigneeAddress: '江苏省苏州市**区**路**号', planTime: '2026-04-26到2026-04-28', relatedOrderID: '94738112451147', relatedCustomerName: '94738112451147' },
          ]
        }
      },
      {
        type: 'text',
        data: '查询"员工"对象，获取负责订单中相关片区的员工信息派发工单，并在"工单"中生成工单记录，记录如下：\n\n'
      },
      {
        type: 'table',
        data: {
          columns: [
            {
              title: '工单标识',
              width: 100,
              dataIndex: 'workOrderId'
            },
            {
              title: '负责人',
              width: 100,
              dataIndex: 'responsiblePerson'
            },
            {
              title: '工号',
              width: 100,
              dataIndex: 'employeeId'
            },
            {
              title: '工单内容',
              width: 300,
              dataIndex: 'workOrderContent'
            },
            {
              title: '派发时间',
              width: 140,
              dataIndex: 'assignTime'
            },
            {
              title: '状态',
              width: 80,
              dataIndex: 'status'
            },
          ],
          data: [
            { workOrderId: 'A0071', responsiblePerson: '薛*飞', employeeId: 'NT006', workOrderContent: '请将货运单号"AB5425687654"的发货时间调整为2026-04-26到2026-04-28，并联系订单为"94738112451145"的客户告知情况', assignTime: '这里填入当前系统时间', status: '新建' },
            { workOrderId: 'A0072', responsiblePerson: '徐*慧', employeeId: 'NT007', workOrderContent: '请将货运单号"AB5425687655"的发货时间调整为2026-04-26到2026-04-28，并联系订单为"94738112451146"的客户告知情况', assignTime: '这里填入当前系统时间', status: '新建' },
            { workOrderId: 'A0073', responsiblePerson: '张*伟', employeeId: 'NT009', workOrderContent: '请将货运单号"AB5425687656"的发货时间调整为2026-04-26到2026-04-28，并联系订单为"94738112451147"的客户告知情况', assignTime: '这里填入当前系统时间', status: '新建' },
          ]
        }
      }
    ],
    schemeContent2: [
      {
        type: 'text',
        data: '开始执行方案2，更新"货运单"中对应单号的计划运输时间。\n\n'
      },
      {
        type: 'table',
        data: {
          columns: [
            {
              title: '货运单号',
              width: 120,
              dataIndex: 'orderId'
            },
            {
              title: '物流服务商',
              width: 120,
              dataIndex: 'logisticsProvider'
            },
            {
              title: '寄件地址',
              width: 150,
              dataIndex: 'consignorAddress'
            },
            {
              title: '收件地址',
              width: 150,
              dataIndex: 'consigneeAddress'
            },
            {
              title: '计划运输时间',
              width: 140,
              dataIndex: 'planTime'
            },
            {
              title: '关联订单ID',
              width: 120,
              dataIndex: 'relatedOrderID'
            },
            {
              title: '关联客户名称',
              width: 120,
              dataIndex: 'relatedCustomerName'
            },
          ],
          data: [
            { orderId: 'AB5425687654', logisticsProvider: '**公司', consignorAddress: '广东省深圳市**区**路**号', consigneeAddress: '江苏省苏州市**区**路**号', planTime: '2026-05-08到2026-05-10', relatedOrderID: '94738112451145', relatedCustomerName: '94738112451145' },
            { orderId: 'AB5425687655', logisticsProvider: '**公司', consignorAddress: '广东省深圳市**区**路**号', consigneeAddress: '江苏省苏州市**区**路**号', planTime: '2026-05-08到2026-05-10', relatedOrderID: '94738112451146', relatedCustomerName: '94738112451146' },
            { orderId: 'AB5425687656', logisticsProvider: '**公司', consignorAddress: '广东省深圳市**区**路**号', consigneeAddress: '江苏省苏州市**区**路**号', planTime: '2026-05-08到2026-05-10', relatedOrderID: '94738112451147', relatedCustomerName: '94738112451147' },
          ]
        }
      },
      {
        type: 'text',
        data: '查询"员工"对象，获取负责订单中相关片区的员工信息派发工单，并在"工单"中生成工单记录，记录如下：\n\n'
      },
      {
        type: 'table',
        data: {
          columns: [
            {
              title: '工单标识',
              width: 100,
              dataIndex: 'workOrderId'
            },
            {
              title: '负责人',
              width: 100,
              dataIndex: 'responsiblePerson'
            },
            {
              title: '工号',
              width: 100,
              dataIndex: 'employeeId'
            },
            {
              title: '工单内容',
              width: 300,
              dataIndex: 'workOrderContent'
            },
            {
              title: '派发时间',
              width: 140,
              dataIndex: 'assignTime'
            },
            {
              title: '状态',
              width: 80,
              dataIndex: 'status'
            },
          ],
          data: [
            { workOrderId: 'A0071', responsiblePerson: '薛*飞', employeeId: 'NT006', workOrderContent: '请将货运单号"AB5425687654"的发货时间调整为2026-05-08到2026-05-10，并联系订单为"94738112451145"的客户告知情况', assignTime: '这里填入当前系统时间', status: '新建' },
            { workOrderId: 'A0072', responsiblePerson: '徐*慧', employeeId: 'NT007', workOrderContent: '请将货运单号"AB5425687655"的发货时间调整为2026-05-08到2026-05-10，并联系订单为"94738112451146"的客户告知情况', assignTime: '这里填入当前系统时间', status: '新建' },
            { workOrderId: 'A0073', responsiblePerson: '张*伟', employeeId: 'NT009', workOrderContent: '请将货运单号"AB5425687656"的发货时间调整为2026-05-08到2026-05-10，并联系订单为"94738112451147"的客户告知情况', assignTime: '这里填入当前系统时间', status: '新建' },
          ]
        }
      }
    ]
  },
  "en-US": {
    allResultContent: [
      {
        type: 'text',
        data: `The current simulation scenario is that a Category 12-13 typhoon will make landfall along the coastal areas of Shenzhen, Guangdong Province on May 1, 2026, and is expected to gradually leave mainland China on the evening of May 5. We need to analyze which orders' cargo transportation will be affected by this extreme weather and provide contingency plans.\n\nFirst, invoke the [Extreme Weather Hazard Level Analysis] logic to determine whether this extreme weather poses severe risks and whether emergency measures need to be taken. Since a Category 12-13 typhoon will have severe impact, emergency plans need to be formulated.\n\nNext, invoke the [Extreme Weather Order Impact Analysis] logic to determine whether there are freight orders passing through these disaster-affected areas based on the time and spatial scope of this extreme weather, and obtain corresponding order information.\n\n`
      },
      {
        type: 'list',
        data: `1. Step 1: Query "Address" based on the extreme weather occurrence area being the coastal area of Shenzhen, Guangdong, and find that it includes Shenzhen City, Dongguan City, Huizhou City, Zhongshan City, Zhuhai City, etc.
        \n2. Step 2: Based on the queried cities, query "Flights" and "Roads". Important transportation highways include G4 Beijing-Hong Kong-Macao Expressway, G4 Beijing-Hong Kong-Macao Expressway (Dongguan Section), G25 Changshen Expressway (Huishen Expressway Section), G4W Guangao Expressway, G4 Beijing-Hong Kong-Macao Expressway (Guangzhou Section), S47 Jiangzhu Expressway, etc.; during the disaster period, flights passing through these areas include Air China CA1837, China Eastern Airlines MU2325, Shenzhen Airlines ZH9871, Hainan Airlines HU7701.
        \n3. Step 3: Based on the obtained important transportation route information and flight information, query "Freight Orders" to get affected freight order numbers. A total of three results were found: AB5425687654, AB5425687655, AB5425687656.
        \n4. Step 4: Through the queried freight order numbers, obtain related order information. Order numbers are 94738112451145, 94738112451146, 94738112451147.`
      },
      {
        type: 'text',
        data: `\nNext, invoke the [Emergency Plan Feasibility Analysis] logic, with the main goal of formulating extreme weather emergency plans based on the above analysis results and analyzing the resulting losses.\n\n`
      },
      {
        type: 'list',
        data: `1. Step 1: Obtain detailed order data.
        \n2. Step 2: Query logistics contract data regarding logistics cost changes caused by plan adjustments.
        \n3. Step 3: Query compensation amount data for delayed delivery in sales contracts associated with orders.
        \n4. Step 4: Calculate the potential impact of changing shipping time on customer satisfaction based on historical experience. Typically, early shipping increases customer satisfaction by 30%, while delayed shipping decreases customer satisfaction by 50%.`
      },
      {
        type: 'text',
        data: `\nFinally, generate emergency plans as follows, including two contingency plans: early shipment and delayed shipment, and calculate the cost and revenue changes brought by these two plans respectively.\n\nThe typhoon impact period is expected to be from May 1 to May 5, 2026. The main affected cities are Shenzhen, Dongguan, Huizhou, Zhongshan, and Zhuhai. The affected freight orders and orders are as follows:\n\n`
      },
      {
        type: 'table',
        data: {
          columns: [
            {
              title: 'Freight Order No.',
              width: 130,
              dataIndex: 'orderId'
            },
            {
              title: 'Logistics Provider',
              width: 130,
              dataIndex: 'logisticsProvider'
            },
            {
              title: 'Consignor Address',
              width: 150,
              dataIndex: 'consignorAddress'
            },
            {
              title: 'Consignee Address',
              width: 150,
              dataIndex: 'consigneeAddress'
            },
            {
              title: 'Planned Transit Time',
              width: 140,
              dataIndex: 'planTime'
            },
            {
              title: 'Related Order ID',
              width: 130,
              dataIndex: 'relatedOrderID'
            },
            {
              title: 'Related Customer Name',
              width: 140,
              dataIndex: 'relatedCustomerName'
            },
          ],
          data: [
            { orderId: 'AB5425687654', logisticsProvider: '** Company', consignorAddress: 'No.**, **Rd, **District, Shenzhen, Guangdong Province', consigneeAddress: 'No.**, **Rd, **District, Suzhou, Jiangsu Province', planTime: '2026-05-01 to 2026-05-04', relatedOrderID: '94738112451145', relatedCustomerName: '94738, 11245, 1145' },
            { orderId: 'AB5425687655', logisticsProvider: '** Company', consignorAddress: 'No.**, **Rd, **District, Shenzhen, Guangdong Province', consigneeAddress: 'No.**, **Rd, **District, Suzhou, Jiangsu Province', planTime: '2026-05-02 to 2026-05-04', relatedOrderID: '94738112451146', relatedCustomerName: '94738, 11245, 1145' },
            { orderId: 'AB5425687656', logisticsProvider: '** Company', consignorAddress: 'No.**, **Rd, **District, Shenzhen, Guangdong Province', consigneeAddress: 'No.**, **Rd, **District, Suzhou, Jiangsu Province', planTime: '2026-05-04 to 2026-05-06', relatedOrderID: '94738112451147', relatedCustomerName: '94738, 11245, 1145' },
          ]
        }
      },
      {
        type: 'text',
        data: `\nRecommended Contingency Plans:\n\n`
      },
      {
        type: 'tip',
        data: {
          title: 'Plan 1: Early Shipment',
          subtitle: 'Complete transport before typhoon arrives. Adjustment plan:'
        }
      },
      {
        type: 'table',
        data: {
          columns: [
            {
              title: 'Freight Order No.',
              width: 130,
              dataIndex: 'orderId'
            },
            {
              title: 'Logistics Provider',
              width: 130,
              dataIndex: 'logisticsProvider'
            },
            {
              title: 'Related Order ID',
              width: 130,
              dataIndex: 'relatedOrderID'
            },
            {
              title: 'Related Customer Name',
              width: 140,
              dataIndex: 'relatedCustomerName'
            },
            {
              title: 'Original Planned Transit Time',
              width: 160,
              dataIndex: 'originalPlanTime'
            },
            {
              title: 'Adjusted Transit Time',
              width: 140,
              dataIndex: 'adjustedPlanTime'
            },
            {
              title: 'Estimated Cost Change (USD)',
              width: 150,
              dataIndex: 'estimatedCostChange'
            },
            {
              title: 'Estimated Revenue Change (USD)',
              width: 160,
              dataIndex: 'estimatedRevenueChange'
            },
            {
              title: 'Customer Satisfaction',
              width: 120,
              dataIndex: 'customerSatisfaction'
            },
          ],
          data: [
            { orderId: 'AB5425687654', logisticsProvider: '** Company', relatedOrderID: '94738112451145', relatedCustomerName: '94738112451145', originalPlanTime: '2026-05-01 to 2026-05-04', adjustedPlanTime: '2026-04-26 to 2026-04-28', estimatedCostChange: '****', estimatedRevenueChange: '****', customerSatisfaction: '6 points' },
            { orderId: 'AB5425687655', logisticsProvider: '** Company', relatedOrderID: '94738112451146', relatedCustomerName: '94738112451146', originalPlanTime: '2026-05-02 to 2026-05-04', adjustedPlanTime: '2026-04-26 to 2026-04-28', estimatedCostChange: '****', estimatedRevenueChange: '****', customerSatisfaction: '7 points' },
            { orderId: 'AB5425687656', logisticsProvider: '** Company', relatedOrderID: '94738112451147', relatedCustomerName: '94738112451147', originalPlanTime: '2026-05-04 to 2026-05-06', adjustedPlanTime: '2026-04-26 to 2026-04-28', estimatedCostChange: '****', estimatedRevenueChange: '****', customerSatisfaction: '5 points' },
          ]
        }
      },
      {
        type: 'tip',
        data: {
          title: 'Plan 2: Delayed Shipment',
          subtitle: 'Transport after typhoon weakens. Adjustment plan:'
        }
      },
      {
        type: 'table',
        data: {
          columns: [
            {
              title: 'Freight Order No.',
              width: 130,
              dataIndex: 'orderId'
            },
            {
              title: 'Logistics Provider',
              width: 130,
              dataIndex: 'logisticsProvider'
            },
            {
              title: 'Related Order ID',
              width: 130,
              dataIndex: 'relatedOrderID'
            },
            {
              title: 'Related Customer Name',
              width: 140,
              dataIndex: 'relatedCustomerName'
            },
            {
              title: 'Original Planned Transit Time',
              width: 160,
              dataIndex: 'originalPlanTime'
            },
            {
              title: 'Adjusted Transit Time',
              width: 140,
              dataIndex: 'adjustedPlanTime'
            },
            {
              title: 'Estimated Cost Change (USD)',
              width: 150,
              dataIndex: 'estimatedCostChange'
            },
            {
              title: 'Estimated Revenue Change (USD)',
              width: 160,
              dataIndex: 'estimatedRevenueChange'
            },
            {
              title: 'Customer Satisfaction',
              width: 120,
              dataIndex: 'customerSatisfaction'
            },
          ],
          data: [
            { orderId: 'AB5425687654', logisticsProvider: '** Company', relatedOrderID: '94738112451145', relatedCustomerName: '94738112451145', originalPlanTime: '2026-05-01 to 2026-05-04', adjustedPlanTime: '2026-05-08 to 2026-05-10', estimatedCostChange: '****', estimatedRevenueChange: '****', customerSatisfaction: '3 points' },
            { orderId: 'AB5425687655', logisticsProvider: '** Company', relatedOrderID: '94738112451146', relatedCustomerName: '94738112451146', originalPlanTime: '2026-05-02 to 2026-05-04', adjustedPlanTime: '2026-05-08 to 2026-05-10', estimatedCostChange: '****', estimatedRevenueChange: '****', customerSatisfaction: '4 points' },
            { orderId: 'AB5425687656', logisticsProvider: '** Company', relatedOrderID: '94738112451147', relatedCustomerName: '94738112451147', originalPlanTime: '2026-05-04 to 2026-05-06', adjustedPlanTime: '2026-05-08 to 2026-05-10', estimatedCostChange: '****', estimatedRevenueChange: '****', customerSatisfaction: '5 points' },
          ]
        }
      },
    ],
    schemeContent1: [
      {
        type: 'text',
        data: 'Start executing Plan 1. Update planned transport time in "Shipment Order".\n\n'
      },
      {
        type: 'table',
        data: {
          columns: [
            {
              title: 'Freight Order No.',
              width: 130,
              dataIndex: 'orderId'
            },
            {
              title: 'Logistics Provider',
              width: 130,
              dataIndex: 'logisticsProvider'
            },
            {
              title: 'Consignor Address',
              width: 150,
              dataIndex: 'consignorAddress'
            },
            {
              title: 'Consignee Address',
              width: 150,
              dataIndex: 'consigneeAddress'
            },
            {
              title: 'Planned Transit Time',
              width: 140,
              dataIndex: 'planTime'
            },
            {
              title: 'Related Order ID',
              width: 130,
              dataIndex: 'relatedOrderID'
            },
            {
              title: 'Related Customer Name',
              width: 140,
              dataIndex: 'relatedCustomerName'
            },
          ],
          data: [
            { orderId: 'AB5425687654', logisticsProvider: '** Company', consignorAddress: 'No.**, **Rd, **District, Shenzhen, Guangdong Province', consigneeAddress: 'No.**, **Rd, **District, Suzhou, Jiangsu Province', planTime: '2026-04-26 to 2026-04-28', relatedOrderID: '94738112451145', relatedCustomerName: '94738112451145' },
            { orderId: 'AB5425687655', logisticsProvider: '** Company', consignorAddress: 'No.**, **Rd, **District, Shenzhen, Guangdong Province', consigneeAddress: 'No.**, **Rd, **District, Suzhou, Jiangsu Province', planTime: '2026-04-26 to 2026-04-28', relatedOrderID: '94738112451146', relatedCustomerName: '94738112451146' },
            { orderId: 'AB5425687656', logisticsProvider: '** Company', consignorAddress: 'No.**, **Rd, **District, Shenzhen, Guangdong Province', consigneeAddress: 'No.**, **Rd, **District, Suzhou, Jiangsu Province', planTime: '2026-04-26 to 2026-04-28', relatedOrderID: '94738112451147', relatedCustomerName: '94738112451147' },
          ]
        }
      },
      {
        type: 'text',
        data: 'Retrieve "Employee" for area leads, dispatch work orders, and generate records in "Work Order":\n\n'
      },
      {
        type: 'table',
        data: {
          columns: [
            {
              title: 'Work Order ID',
              width: 110,
              dataIndex: 'workOrderId'
            },
            {
              title: 'Responsible Person',
              width: 130,
              dataIndex: 'responsiblePerson'
            },
            {
              title: 'Employee ID',
              width: 110,
              dataIndex: 'employeeId'
            },
            {
              title: 'Work Order Content',
              width: 350,
              dataIndex: 'workOrderContent'
            },
            {
              title: 'Assignment Time',
              width: 130,
              dataIndex: 'assignTime'
            },
            {
              title: 'Status',
              width: 80,
              dataIndex: 'status'
            },
          ],
          data: [
            { workOrderId: 'A0071', responsiblePerson: 'Xue* Fei', employeeId: 'NT006', workOrderContent: 'Please adjust the shipping time of freight order "AB5425687654" to 2026-04-26 to 2026-04-28, and contact the customer of order "94738112451145" to inform the situation', assignTime: 'Current system time entered here', status: 'New' },
            { workOrderId: 'A0072', responsiblePerson: 'Xu* Hui', employeeId: 'NT007', workOrderContent: 'Please adjust the shipping time of freight order "AB5425687655" to 2026-04-26 to 2026-04-28, and contact the customer of order "94738112451146" to inform the situation', assignTime: 'Current system time entered here', status: 'New' },
            { workOrderId: 'A0073', responsiblePerson: 'Zhang* Wei', employeeId: 'NT009', workOrderContent: 'Please adjust the shipping time of freight order "AB5425687656" to 2026-04-26 to 2026-04-28, and contact the customer of order "94738112451147" to inform the situation', assignTime: 'Current system time entered here', status: 'New' },
          ]
        }
      }
    ],
    schemeContent2: [
      {
        type: 'text',
        data: 'Start executing Plan 2. Update planned transport time in "Shipment Order".\n\n'
      },
      {
        type: 'table',
        data: {
          columns: [
            {
              title: 'Freight Order No.',
              width: 130,
              dataIndex: 'orderId'
            },
            {
              title: 'Logistics Provider',
              width: 130,
              dataIndex: 'logisticsProvider'
            },
            {
              title: 'Consignor Address',
              width: 150,
              dataIndex: 'consignorAddress'
            },
            {
              title: 'Consignee Address',
              width: 150,
              dataIndex: 'consigneeAddress'
            },
            {
              title: 'Planned Transit Time',
              width: 140,
              dataIndex: 'planTime'
            },
            {
              title: 'Related Order ID',
              width: 130,
              dataIndex: 'relatedOrderID'
            },
            {
              title: 'Related Customer Name',
              width: 140,
              dataIndex: 'relatedCustomerName'
            },
          ],
          data: [
            { orderId: 'AB5425687654', logisticsProvider: '** Company', consignorAddress: 'No.**, **Rd, **District, Shenzhen, Guangdong Province', consigneeAddress: 'No.**, **Rd, **District, Suzhou, Jiangsu Province', planTime: '2026-05-08 to 2026-05-10', relatedOrderID: '94738112451145', relatedCustomerName: '94738112451145' },
            { orderId: 'AB5425687655', logisticsProvider: '** Company', consignorAddress: 'No.**, **Rd, **District, Shenzhen, Guangdong Province', consigneeAddress: 'No.**, **Rd, **District, Suzhou, Jiangsu Province', planTime: '2026-05-08 to 2026-05-10', relatedOrderID: '94738112451146', relatedCustomerName: '94738112451146' },
            { orderId: 'AB5425687656', logisticsProvider: '** Company', consignorAddress: 'No.**, **Rd, **District, Shenzhen, Guangdong Province', consigneeAddress: 'No.**, **Rd, **District, Suzhou, Jiangsu Province', planTime: '2026-05-08 to 2026-05-10', relatedOrderID: '94738112451147', relatedCustomerName: '94738112451147' },
          ]
        }
      },
      {
        type: 'text',
        data: 'Retrieve "Employee" for area leads, dispatch work orders, and generate records in "Work Order":\n\n'
      },
      {
        type: 'table',
        data: {
          columns: [
            {
              title: 'Work Order ID',
              width: 110,
              dataIndex: 'workOrderId'
            },
            {
              title: 'Responsible Person',
              width: 130,
              dataIndex: 'responsiblePerson'
            },
            {
              title: 'Employee ID',
              width: 110,
              dataIndex: 'employeeId'
            },
            {
              title: 'Work Order Content',
              width: 350,
              dataIndex: 'workOrderContent'
            },
            {
              title: 'Assignment Time',
              width: 130,
              dataIndex: 'assignTime'
            },
            {
              title: 'Status',
              width: 80,
              dataIndex: 'status'
            },
          ],
          data: [
            { workOrderId: 'A0071', responsiblePerson: 'Xue* Fei', employeeId: 'NT006', workOrderContent: 'Please adjust the shipping time of freight order "AB5425687654" to 2026-05-08 to 2026-05-10, and contact the customer of order "94738112451145" to inform the situation', assignTime: 'Current system time entered here', status: 'New' },
            { workOrderId: 'A0072', responsiblePerson: 'Xu* Hui', employeeId: 'NT007', workOrderContent: 'Please adjust the shipping time of freight order "AB5425687655" to 2026-05-08 to 2026-05-10, and contact the customer of order "94738112451146" to inform the situation', assignTime: 'Current system time entered here', status: 'New' },
            { workOrderId: 'A0073', responsiblePerson: 'Zhang* Wei', employeeId: 'NT009', workOrderContent: 'Please adjust the shipping time of freight order "AB5425687656" to 2026-05-08 to 2026-05-10, and contact the customer of order "94738112451147" to inform the situation', assignTime: 'Current system time entered here', status: 'New' },
          ]
        }
      }
    ]
  }
}
