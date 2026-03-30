export const welcome = {
    text: '欢迎使用【模拟仿真】，我将根据您的问题进行推理和仿真预测。',
    questions: [
        {
            key: '1',
            text: '台风“桦加沙”对中国电信十一期间iphone17在华东地区的销售有哪些影响？有什么应对方案？',
        },
        {
            key: '2',
            text: '台风“桦加沙”对中国电信的哪些基站有影响？有什么应对方案？',
        },
        {
            key: '3',
            text: '台风“桦加沙”对中国电信的哪些户外营销活动有影响？有什么应对方案？',
        }
    ]
}
export const data = {
    1: {
        question: '台风“桦加沙”对中国电信十一期间iphone17在华东地区的销售有哪些影响？有什么应对方案？',
        flow: {
            nodes: [
                { id: 'node-1', data: { label: '天气' }, style: { x: 130, y: 50 } },
                { id: 'node-2', data: { label: '地址' }, style: { x: 130, y: 150 } },
                { id: 'node-3', data: { label: '航班' }, style: { x: 55, y: 250 } },
                { id: 'node-4', data: { label: '公路' }, style: { x: 205, y: 250 } },
                { id: 'node-5', data: { label: '货运单' }, style: { x: 130, y: 350 } },
                { id: 'node-6', data: { label: '订单' }, style: { x: 55, y: 450 } },
                { id: 'node-7', data: { label: '物流公司' }, style: { x: 205, y: 450 } },
                { id: 'node-8', data: { label: '客户' }, style: { x: 55, y: 550 } },
                { id: 'node-9', data: { label: '物流合同' }, style: { x: 205, y: 550 } },
                { id: 'node-10', data: { label: '销售合同' }, style: { x: 55, y: 650 } },
            ],
            edges: [
                { source: 'node-1', target: 'node-2' },
                { source: 'node-2', target: 'node-3' },
                { source: 'node-2', target: 'node-4' },
                { source: 'node-3', target: 'node-5' },
                { source: 'node-4', target: 'node-5' },
                { source: 'node-5', target: 'node-6' },
                { source: 'node-5', target: 'node-7' },
                { source: 'node-6', target: 'node-8' },
                { source: 'node-7', target: 'node-9' },
                { source: 'node-8', target: 'node-10' }
            ]
        },
        codeLoading: true,
        code: `以下为代码片段示例
import json
import datetime
from enum import Enum
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import math

class WeatherSeverity(Enum):
    """"""天气严重程度枚举""""""
    MILD = ""轻度""
    MODERATE = ""中度""
    SEVERE = ""重度""
    EXTREME = ""极端""

class BaseStationStatus(Enum):
    """"""基站状态枚举""""""
    NORMAL = ""正常运行""
    DEGRADED = ""性能降级""
    PARTIAL_OUTAGE = ""部分中断""
    COMPLETE_OUTAGE = ""完全中断""
    MAINTENANCE = ""维护中""

class WeatherType(Enum):
    """"""异常天气类型枚举""""""
    THUNDERSTORM = ""雷暴""
    HEAVY_RAIN = ""暴雨""
    SNOWSTORM = ""暴雪""
    TYPHOON = ""台风""
    HIGH_TEMPERATURE = ""高温""
    LOW_TEMPERATURE = ""低温""
    HAIL = ""冰雹""
    STRONG_WIND = ""强风""
    LIGHTNING = ""雷电""
    FOG = ""浓雾""

class BaseStationType(Enum):
    """"""基站类型枚举""""""
    MACRO = ""宏基站""
    MICRO = ""微基站""
    SMALL_CELL = ""小基站""
    ROOFTOP = ""楼顶基站""
    GROUND = ""地面基站""

@dataclass
class WeatherEvent:
    """"""异常天气事件""""""
    weather_type: WeatherType
    severity: WeatherSeverity
    location: str
    start_time: datetime.datetime
    end_time: datetime.datetime
    affected_areas: List[str]
    wind_speed: Optional[float] = None  # 风速 m/s
    temperature: Optional[float] = None  # 温度 ℃
    precipitation: Optional[float] = None  # 降水量 mm
    description: str = """"

@dataclass
class BaseStation:
    """"""基站信息""""""
    station_id: str
    name: str
    location: str
    station_type: BaseStationType
    altitude: float  # 海拔高度
    construction_standard: str  # 建设标准
    power_backup_hours: int  # 备用电源时长
    maintenance_level: str  # 维护等级
    coverage_radius: float  # 覆盖半径 km
    installed_date: datetime.datetime
    last_maintenance: datetime.datetime

@dataclass
class NetworkImpact:
    """"""网络影响评估""""""
    station_id: str
    weather_event: WeatherEvent
    base_station_status: BaseStationStatus
    signal_strength_reduction: float  # 信号强度衰减百分比
    coverage_reduction: float  # 覆盖范围减少百分比
    estimated_users_affected: int  # 受影响用户数
    risk_score: float  # 风险评分 0-10
    failure_probability: float  # 故障概率 0-1
    expected_downtime_hours: float  # 预计中断时长`,
        answer: [
            {
                type: 'pre',
                data: `嗯，中国电信正在计划十一期间在华东地区销售iphone17，货物需要从广东运输，但担心台风"桦加沙"会影响物流，需要我提供专业的影响分析，并提供应对方案。

首先，我查询到台风"桦加沙"预计于9月22日在广东深圳到徐闻一带沿海登陆，主要影响广东、广西、福建、海南等省份，这些省份将遭遇大风和强降雨，部分地区可能出现特大暴雨及洪涝、滑坡等次生灾害。台风将逐渐西行，预计于9月25日晚间逐渐离开我国大陆。

然后，我将调取“异常天气影响分析”本体，进行以下分析：

我发现，十一期间中国电信在华东地区销售的这批iphone17，产品将从广东深圳运输苏州、南京和上海，所以，我需要查询以上地理范围内，受影响的公路和航线。

1、第1步，我将通过“天气”和“地址”查询台风“桦加沙”影响的地区。

2、第2步，我将查询受影响地区覆盖的“航班”和“公路”。

3、第3步，我将查询航班和公路关联的“货运单”。

4、第4步，我将查询货运单关联的“订单”和“物流公司”。

5、第5步，我将分别通过“订单”查询关联的“客户”和“销售合同”，通过“物流公司”，查询关联的“物流合同”。

接下来，我将制定应对方案，主要思路是，对受影响的货运单进行提前或者延后，避开台风影响的时间段。在过程中，我将通过本体连接到数据库查询以下详细数据：

1、货运单的详细数据。

2、物流合同中关于调整计划带来的物流费用变更数据。

3、订单关联的销售合同中关于延迟到货的赔偿金额数据。

最后，我将提供提前发货和延迟发货两种应对方案，并分别计算这两种方案带来的成本和收益变更。`
            },
            {
                type: 'text',
                data: '台风“桦加沙”的影响时间预计为：2025年9月22日到2025年9月25日，主要影响的省份有：广东、广西、福建、海南。对于我司的此次发售来说，受影响的货运单和订单如下：'
            },
            {
                type: 'table',
                data: {
                    columns: [
                        {
                            dataIndex: '1',
                            title: '货运单号'
                        },
                        {
                            dataIndex: '2',
                            title: '物流服务商'
                        },
                        {
                            dataIndex: '3',
                            title: '寄件地址'
                        },
                        {
                            dataIndex: '4',
                            title: '收件地址'
                        },
                        {
                            dataIndex: '5',
                            title: '计划运输时间'
                        },
                        {
                            dataIndex: '6',
                            title: '关联订单ID'
                        },
                        {
                            dataIndex: '6',
                            title: '关联客户名称'
                        }
                    ],
                    data: [
                        {
                            1: 'AB5425687654',
                            2: '**公司',
                            3: '广东省深圳市**区**路**号',
                            4: '江苏省苏州市**区**路**号',
                            5: '2025-09-21到2025-09-23',
                            6: '94738112451145',
                            7: '***有限责任公司'
                        },
                        {
                            1: 'AB5425687656',
                            2: '**公司',
                            3: '广东省深圳市**区**路**号',
                            4: '江苏省苏州市**区**路**号',
                            5: '2025-09-21到2025-09-23',
                            6: '94738112451146',
                            7: '***有限责任公司'
                        },
                        {
                            1: 'AB5425687663',
                            2: '**公司',
                            3: '广东省深圳市**区**路**号',
                            4: '上海市**区**路**号',
                            5: '2025-09-21到2025-09-23',
                            6: '94738112451147',
                            7: '***科技有限责任公司'
                        },
                    ]
                }
            },
            {
                type: 'text',
                data: '以下是2种建议应对方案'
            },
            {
                type: 'tabs',
                data: [
                    {
                        title: '方案1：提早发货',
                        tab: [
                            {
                                type: 'text',
                                data: '建议赶在台风影响到来前，完成相关的物流运输，物流调整计划如下：'
                            },
                            {
                                type: 'table',
                                data: {
                                    columns: [
                                        {
                                            dataIndex: '1',
                                            title: '货运单号'
                                        },
                                        {
                                            dataIndex: '2',
                                            title: '物流服务商'
                                        },
                                        {
                                            dataIndex: '3',
                                            title: '关联订单ID'
                                        },
                                        {
                                            dataIndex: '4',
                                            title: '关联客户名称'
                                        },
                                        {
                                            dataIndex: '5',
                                            title: '原计划运输时间'
                                        },
                                        {
                                            dataIndex: '6',
                                            title: '调整后运输时间'
                                        },
                                        {
                                            dataIndex: '7',
                                            title: '预估成本变更（元）'
                                        },
                                        {
                                            dataIndex: '8',
                                            title: '预估收益变更（元'
                                        }
                                    ],
                                    data: [
                                        {
                                            1: 'AB5425687654',
                                            2: '**公司',
                                            3: '94738112451145',
                                            4: '***有限责任公司',
                                            5: '2025-09-21到2025-09-23',
                                            6: '2025-09-18到2025-09-20',
                                            7: '****',
                                            8: '****'
                                        },
                                        {
                                            1: 'AB5425687656',
                                            2: '**公司',
                                            3: '94738112451146',
                                            4: '***有限责任公司',
                                            5: '2025-09-21到2025-09-23',
                                            6: '2025-09-18到2025-09-20',
                                            7: '****',
                                            8: '****'
                                        },
                                        {
                                            1: 'AB5425687663',
                                            2: '**公司',
                                            3: '94738112451147',
                                            4: '***科技有限责任公司',
                                            5: '2025-09-21到2025-09-23',
                                            6: '2025-09-18到2025-09-20',
                                            7: '****',
                                            8: '****'
                                        },
                                    ]
                                }
                            }
                        ]
                    },
                    {
                        title: '方案2：延迟发货',
                        tab: [
                            {
                                type: 'text',
                                data: '建议在台风影响减弱后，再进行相关的物流运输，物流调整计划如下：'
                            },
                            {
                                type: 'table',
                                data: {
                                    columns: [
                                        {
                                            dataIndex: '1',
                                            title: '货运单号'
                                        },
                                        {
                                            dataIndex: '2',
                                            title: '物流服务商'
                                        },
                                        {
                                            dataIndex: '3',
                                            title: '关联订单ID'
                                        },
                                        {
                                            dataIndex: '4',
                                            title: '关联客户名称'
                                        },
                                        {
                                            dataIndex: '5',
                                            title: '原计划运输时间'
                                        },
                                        {
                                            dataIndex: '6',
                                            title: '调整后运输时间'
                                        },
                                        {
                                            dataIndex: '7',
                                            title: '预估成本变更（元）'
                                        },
                                        {
                                            dataIndex: '8',
                                            title: '预估收益变更（元'
                                        }
                                    ],
                                    data: [
                                        {
                                            1: 'AB5425687654',
                                            2: '**公司',
                                            3: '94738112451145',
                                            4: '***有限责任公司',
                                            5: '2025-09-21到2025-09-23',
                                            6: '2025-09-25到2025-09-27',
                                            7: '****',
                                            8: '****'
                                        },
                                        {
                                            1: 'AB5425687656',
                                            2: '**公司',
                                            3: '94738112451146',
                                            4: '***有限责任公司',
                                            5: '2025-09-21到2025-09-23',
                                            6: '2025-09-25到2025-09-27',
                                            7: '****',
                                            8: '****'
                                        },
                                        {
                                            1: 'AB5425687663',
                                            2: '**公司',
                                            3: '94738112451147',
                                            4: '***科技有限责任公司',
                                            5: '2025-09-21到2025-09-23',
                                            6: '2025-09-25到2025-09-27',
                                            7: '****',
                                            8: '****'
                                        },
                                    ]
                                }
                            }
                        ]
                    }
                ]
            },
            {
                type: 'oper-group',
                data: [
                    {
                        text: '执行方案1',
                        key: 4
                    },
                    {
                        text: '执行方案2',
                        key: 5
                    }
                ]
            },
            {
                type: 'text',
                data: '您还可以问：'
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信的哪些基站有影响？有什么应对方案？',
                key: 2
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信的哪些户外营销活动有影响？有什么应对方案？',
                key: 3
            }
        ]
    },
    4: {
        question: '执行“方案1：提早发货”。',
        flow: {
            nodes: [
                { id: 'node-1', data: { label: '天气' }, style: { x: 130, y: 50 } },
                { id: 'node-2', data: { label: '地址' }, style: { x: 130, y: 150 } },
                { id: 'node-3', data: { label: '航班' }, style: { x: 55, y: 250 } },
                { id: 'node-4', data: { label: '公路' }, style: { x: 205, y: 250 } },
                { id: 'node-5', data: { label: '货运单' }, style: { x: 130, y: 350 } },
                { id: 'node-6', data: { label: '订单' }, style: { x: 55, y: 450 } },
                { id: 'node-7', data: { label: '物流公司' }, style: { x: 205, y: 450 } },
                { id: 'node-8', data: { label: '客户' }, style: { x: 55, y: 550 } },
                { id: 'node-9', data: { label: '物流合同' }, style: { x: 205, y: 550 } },
                { id: 'node-10', data: { label: '销售合同' }, style: { x: 55, y: 650 } },
            ],
            edges: [
                { source: 'node-1', target: 'node-2' },
                { source: 'node-2', target: 'node-3' },
                { source: 'node-2', target: 'node-4' },
                { source: 'node-3', target: 'node-5' },
                { source: 'node-4', target: 'node-5' },
                { source: 'node-5', target: 'node-6' },
                { source: 'node-5', target: 'node-7' },
                { source: 'node-6', target: 'node-8' },
                { source: 'node-7', target: 'node-9' },
                { source: 'node-8', target: 'node-10' }
            ]
        },
        code: `以下为代码片段示例
import json
import datetime
from enum import Enum
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import math

class WeatherSeverity(Enum):
    """"""天气严重程度枚举""""""
    MILD = ""轻度""
    MODERATE = ""中度""
    SEVERE = ""重度""
    EXTREME = ""极端""

class BaseStationStatus(Enum):
    """"""基站状态枚举""""""
    NORMAL = ""正常运行""
    DEGRADED = ""性能降级""
    PARTIAL_OUTAGE = ""部分中断""
    COMPLETE_OUTAGE = ""完全中断""
    MAINTENANCE = ""维护中""

class WeatherType(Enum):
    """"""异常天气类型枚举""""""
    THUNDERSTORM = ""雷暴""
    HEAVY_RAIN = ""暴雨""
    SNOWSTORM = ""暴雪""
    TYPHOON = ""台风""
    HIGH_TEMPERATURE = ""高温""
    LOW_TEMPERATURE = ""低温""
    HAIL = ""冰雹""
    STRONG_WIND = ""强风""
    LIGHTNING = ""雷电""
    FOG = ""浓雾""

class BaseStationType(Enum):
    """"""基站类型枚举""""""
    MACRO = ""宏基站""
    MICRO = ""微基站""
    SMALL_CELL = ""小基站""
    ROOFTOP = ""楼顶基站""
    GROUND = ""地面基站""

@dataclass
class WeatherEvent:
    """"""异常天气事件""""""
    weather_type: WeatherType
    severity: WeatherSeverity
    location: str
    start_time: datetime.datetime
    end_time: datetime.datetime
    affected_areas: List[str]
    wind_speed: Optional[float] = None  # 风速 m/s
    temperature: Optional[float] = None  # 温度 ℃
    precipitation: Optional[float] = None  # 降水量 mm
    description: str = """"

@dataclass
class BaseStation:
    """"""基站信息""""""
    station_id: str
    name: str
    location: str
    station_type: BaseStationType
    altitude: float  # 海拔高度
    construction_standard: str  # 建设标准
    power_backup_hours: int  # 备用电源时长
    maintenance_level: str  # 维护等级
    coverage_radius: float  # 覆盖半径 km
    installed_date: datetime.datetime
    last_maintenance: datetime.datetime

@dataclass
class NetworkImpact:
    """"""网络影响评估""""""
    station_id: str
    weather_event: WeatherEvent
    base_station_status: BaseStationStatus
    signal_strength_reduction: float  # 信号强度衰减百分比
    coverage_reduction: float  # 覆盖范围减少百分比
    estimated_users_affected: int  # 受影响用户数
    risk_score: float  # 风险评分 0-10
    failure_probability: float  # 故障概率 0-1
    expected_downtime_hours: float  # 预计中断时长`,
        answer: [
            {
                type: 'text',
                data: '正在执行“方案1：提早发货”。'
            },
            {
                type: 'text',
                data: '1、已修改货运单"AB5425687654"、“AB5425687656”、“AB5425687663”的“发货时间”为：2025-09-18 09:00-11:00。'
            },
            {
                type: 'text',
                data: '2、已向物流公司“**公司”发送邮件通知，您也可以选择再进行电话沟通。'
            },
            {
                type: 'table',
                data: {
                    columns: [
                        {
                            dataIndex: '1',
                            title: '物流公司'
                        },
                        {
                            dataIndex: '2',
                            title: 'E-mail'
                        },
                        {
                            dataIndex: '3',
                            title: '联系人'
                        },
                        {
                            dataIndex: '4',
                            title: '手机'
                        }
                    ],
                    data: [
                        {
                            1: '**公司',
                            2: 'wangas@xtrans.com',
                            3: '王*书',
                            4: '133*****364'
                        }
                    ]
                }
            },
            {
                type: 'text',
                data: '3、已向以下客户发送邮件通知，您也可以选择再进行电话沟通：'
            },
            {
                type: 'table',
                data: {
                    columns: [
                        {
                            dataIndex: '1',
                            title: '物流公司'
                        },
                        {
                            dataIndex: '2',
                            title: 'E-mail'
                        },
                        {
                            dataIndex: '3',
                            title: '联系人'
                        },
                        {
                            dataIndex: '4',
                            title: '手机'
                        }
                    ],
                    data: [
                        {
                            1: '***有限责任公司',
                            2: 'xuegf@abc.com',
                            3: '薛*飞',
                            4: '153*****364'
                        },
                        {
                            1: '***有限责任公司',
                            2: 'xumy@edf.com',
                            3: '徐*莹',
                            4: '153*****231'
                        },
                        {
                            1: '***科技有限责任公司',
                            2: 'zwj@atech.com',
                            3: '张*隽',
                            4: '133*****886'
                        }
                    ]
                }
            },
            {
                type: 'text',
                data: '您还可以问：'
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信的哪些基站有影响？有什么应对方案？',
                key: 2
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信的哪些户外营销活动有影响？有什么应对方案？',
                key: 3
            }
        ]
    },
    5: {
        question: '执行“方案2：延迟发货”。',
        flow: {
            nodes: [
                { id: 'node-1', data: { label: '天气' }, style: { x: 130, y: 50 } },
                { id: 'node-2', data: { label: '地址' }, style: { x: 130, y: 150 } },
                { id: 'node-3', data: { label: '航班' }, style: { x: 55, y: 250 } },
                { id: 'node-4', data: { label: '公路' }, style: { x: 205, y: 250 } },
                { id: 'node-5', data: { label: '货运单' }, style: { x: 130, y: 350 } },
                { id: 'node-6', data: { label: '订单' }, style: { x: 55, y: 450 } },
                { id: 'node-7', data: { label: '物流公司' }, style: { x: 205, y: 450 } },
                { id: 'node-8', data: { label: '客户' }, style: { x: 55, y: 550 } },
                { id: 'node-9', data: { label: '物流合同' }, style: { x: 205, y: 550 } },
                { id: 'node-10', data: { label: '销售合同' }, style: { x: 55, y: 650 } },
            ],
            edges: [
                { source: 'node-1', target: 'node-2' },
                { source: 'node-2', target: 'node-3' },
                { source: 'node-2', target: 'node-4' },
                { source: 'node-3', target: 'node-5' },
                { source: 'node-4', target: 'node-5' },
                { source: 'node-5', target: 'node-6' },
                { source: 'node-5', target: 'node-7' },
                { source: 'node-6', target: 'node-8' },
                { source: 'node-7', target: 'node-9' },
                { source: 'node-8', target: 'node-10' }
            ]
        },
        code: `以下为代码片段示例
import json
import datetime
from enum import Enum
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import math

class WeatherSeverity(Enum):
    """"""天气严重程度枚举""""""
    MILD = ""轻度""
    MODERATE = ""中度""
    SEVERE = ""重度""
    EXTREME = ""极端""

class BaseStationStatus(Enum):
    """"""基站状态枚举""""""
    NORMAL = ""正常运行""
    DEGRADED = ""性能降级""
    PARTIAL_OUTAGE = ""部分中断""
    COMPLETE_OUTAGE = ""完全中断""
    MAINTENANCE = ""维护中""

class WeatherType(Enum):
    """"""异常天气类型枚举""""""
    THUNDERSTORM = ""雷暴""
    HEAVY_RAIN = ""暴雨""
    SNOWSTORM = ""暴雪""
    TYPHOON = ""台风""
    HIGH_TEMPERATURE = ""高温""
    LOW_TEMPERATURE = ""低温""
    HAIL = ""冰雹""
    STRONG_WIND = ""强风""
    LIGHTNING = ""雷电""
    FOG = ""浓雾""

class BaseStationType(Enum):
    """"""基站类型枚举""""""
    MACRO = ""宏基站""
    MICRO = ""微基站""
    SMALL_CELL = ""小基站""
    ROOFTOP = ""楼顶基站""
    GROUND = ""地面基站""

@dataclass
class WeatherEvent:
    """"""异常天气事件""""""
    weather_type: WeatherType
    severity: WeatherSeverity
    location: str
    start_time: datetime.datetime
    end_time: datetime.datetime
    affected_areas: List[str]
    wind_speed: Optional[float] = None  # 风速 m/s
    temperature: Optional[float] = None  # 温度 ℃
    precipitation: Optional[float] = None  # 降水量 mm
    description: str = """"

@dataclass
class BaseStation:
    """"""基站信息""""""
    station_id: str
    name: str
    location: str
    station_type: BaseStationType
    altitude: float  # 海拔高度
    construction_standard: str  # 建设标准
    power_backup_hours: int  # 备用电源时长
    maintenance_level: str  # 维护等级
    coverage_radius: float  # 覆盖半径 km
    installed_date: datetime.datetime
    last_maintenance: datetime.datetime

@dataclass
class NetworkImpact:
    """"""网络影响评估""""""
    station_id: str
    weather_event: WeatherEvent
    base_station_status: BaseStationStatus
    signal_strength_reduction: float  # 信号强度衰减百分比
    coverage_reduction: float  # 覆盖范围减少百分比
    estimated_users_affected: int  # 受影响用户数
    risk_score: float  # 风险评分 0-10
    failure_probability: float  # 故障概率 0-1
    expected_downtime_hours: float  # 预计中断时长`,
        answer: [
            {
                type: 'text',
                data: '正在执行“方案2：延迟发货”。'
            },
            {
                type: 'text',
                data: '1、已修改货运单"AB5425687654"、“AB5425687656”、“AB5425687663”的“发货时间”为：2025-09-25 09:00-11:00。'
            },
            {
                type: 'text',
                data: '2、已向物流公司“**公司”发送邮件通知。您也可以选择再进行电话沟通。'
            },
            {
                type: 'table',
                data: {
                    columns: [
                        {
                            dataIndex: '1',
                            title: '物流公司'
                        },
                        {
                            dataIndex: '2',
                            title: 'E-mail'
                        },
                        {
                            dataIndex: '3',
                            title: '联系人'
                        },
                        {
                            dataIndex: '4',
                            title: '手机'
                        }
                    ],
                    data: [
                        {
                            1: '**公司',
                            2: 'wangas@xtrans.com',
                            3: '王*书',
                            4: '133*****364'
                        }
                    ]
                }
            },
            {
                type: 'text',
                data: '3、已向以下客户发送邮件通知，您也可以选择再进行电话沟通：'
            },
            {
                type: 'table',
                data: {
                    columns: [
                        {
                            dataIndex: '1',
                            title: '物流公司'
                        },
                        {
                            dataIndex: '2',
                            title: 'E-mail'
                        },
                        {
                            dataIndex: '3',
                            title: '联系人'
                        },
                        {
                            dataIndex: '4',
                            title: '手机'
                        }
                    ],
                    data: [
                        {
                            1: '***有限责任公司',
                            2: 'xuegf@abc.com',
                            3: '薛*飞',
                            4: '153*****364'
                        },
                        {
                            1: '***有限责任公司',
                            2: 'xumy@edf.com',
                            3: '徐*莹',
                            4: '153*****231'
                        },
                        {
                            1: '***科技有限责任公司',
                            2: 'zwj@atech.com',
                            3: '张*隽',
                            4: '133*****886'
                        }
                    ]
                }
            },
            {
                type: 'text',
                data: '您还可以问：'
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信的哪些基站有影响？有什么应对方案？',
                key: 2
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信的哪些户外营销活动有影响？有什么应对方案？',
                key: 3
            }
        ]
    },
    2: {
        question: '台风“桦加沙”对中国电信的哪些基站有影响？有什么应对方案？',
        flow: {
            nodes: [
                { id: 'node-1', data: { label: '天气' }, style: { x: 130, y: 50 } },
                { id: 'node-2', data: { label: '地址' }, style: { x: 130, y: 150 } },
                { id: 'node-3', data: { label: '基站' }, style: { x: 130, y: 250 } },
                { id: 'node-4', data: { label: '员工' }, style: { x: 130, y: 350 } },
            ],
            edges: [
                { source: 'node-1', target: 'node-2' },
                { source: 'node-2', target: 'node-3' },
                { source: 'node-3', target: 'node-4' },
            ]
        },
        codeLoading: true,
        code: `以下为代码片段示例
import json
import datetime
from enum import Enum
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import math

class WeatherSeverity(Enum):
    """"""天气严重程度枚举""""""
    MILD = ""轻度""
    MODERATE = ""中度""
    SEVERE = ""重度""
    EXTREME = ""极端""

class BaseStationStatus(Enum):
    """"""基站状态枚举""""""
    NORMAL = ""正常运行""
    DEGRADED = ""性能降级""
    PARTIAL_OUTAGE = ""部分中断""
    COMPLETE_OUTAGE = ""完全中断""
    MAINTENANCE = ""维护中""

class WeatherType(Enum):
    """"""异常天气类型枚举""""""
    THUNDERSTORM = ""雷暴""
    HEAVY_RAIN = ""暴雨""
    SNOWSTORM = ""暴雪""
    TYPHOON = ""台风""
    HIGH_TEMPERATURE = ""高温""
    LOW_TEMPERATURE = ""低温""
    HAIL = ""冰雹""
    STRONG_WIND = ""强风""
    LIGHTNING = ""雷电""
    FOG = ""浓雾""

class BaseStationType(Enum):
    """"""基站类型枚举""""""
    MACRO = ""宏基站""
    MICRO = ""微基站""
    SMALL_CELL = ""小基站""
    ROOFTOP = ""楼顶基站""
    GROUND = ""地面基站""

@dataclass
class WeatherEvent:
    """"""异常天气事件""""""
    weather_type: WeatherType
    severity: WeatherSeverity
    location: str
    start_time: datetime.datetime
    end_time: datetime.datetime
    affected_areas: List[str]
    wind_speed: Optional[float] = None  # 风速 m/s
    temperature: Optional[float] = None  # 温度 ℃
    precipitation: Optional[float] = None  # 降水量 mm
    description: str = """"

@dataclass
class BaseStation:
    """"""基站信息""""""
    station_id: str
    name: str
    location: str
    station_type: BaseStationType
    altitude: float  # 海拔高度
    construction_standard: str  # 建设标准
    power_backup_hours: int  # 备用电源时长
    maintenance_level: str  # 维护等级
    coverage_radius: float  # 覆盖半径 km
    installed_date: datetime.datetime
    last_maintenance: datetime.datetime

@dataclass
class NetworkImpact:
    """"""网络影响评估""""""
    station_id: str
    weather_event: WeatherEvent
    base_station_status: BaseStationStatus
    signal_strength_reduction: float  # 信号强度衰减百分比
    coverage_reduction: float  # 覆盖范围减少百分比
    estimated_users_affected: int  # 受影响用户数
    risk_score: float  # 风险评分 0-10
    failure_probability: float  # 故障概率 0-1
    expected_downtime_hours: float  # 预计中断时长`,
        answer: [
            {
                type: 'pre',
                data: `嗯，用户想了解台风"桦加沙"对中国电信的哪些基站有影响以及相应的应对方案。需要我提供专业的影响分析，并提供应对方案。

首先，我查询到台风"桦加沙"预计于9月22日在广东深圳到徐闻一带沿海登陆，主要影响广东、广西、福建、海南等省份，这些省份将遭遇大风和强降雨，部分地区可能出现特大暴雨及洪涝、滑坡等次生灾害。台风将逐渐西行，预计于9月25日晚间逐渐离开我国大陆。

然后，我将调取“异常天气影响分析”本体，进行以下分析：

1、第1步，我将通过“天气”和“地址”查询台风“桦加沙”影响的地区。

2、第2步，我将查询受影响地区覆盖的“基站”。

3、第3步，我将查询基站关联的“员工”及其分管领导。

最后，我将制定应对方案，从“灾前-灾中-灾后”提供具体的应对措施。`
            },
            {
                type: 'text',
                data: `台风“桦加沙”的影响时间预计为：2025年9月22日到2025年9月25日，主要影响的省份有：广东、广西、福建、海南，主要影响中国电信集中在沿海地区、低洼区域及部分岛屿的基站，明细如下`
            },
            {
                type: 'table',
                data: {
                    columns: [
                        {
                            dataIndex: 1,
                            title: '基站ID'
                        },
                        {
                            dataIndex: 2,
                            title: '基站名称'
                        },
                        {
                            dataIndex: 3,
                            title: '基站类型'
                        },
                        {
                            dataIndex: 4,
                            title: '基站地址'
                        },
                        {
                            dataIndex: 5,
                            title: '管理员姓名'
                        },
                        {
                            dataIndex: 6,
                            title: '管理员手机'
                        }
                    ],
                    data: [
                        {
                            1: 'SZ-CT-001',
                            2: '深圳**基站',
                            3: '5G',
                            4: '广东省深圳市**区**路**号',
                            5: '徐*东',
                            6: '133****2346'
                        },
                        {
                            1: 'SZ-CT-001',
                            2: '深圳**基站',
                            3: '5G',
                            4: '广东省深圳市**区**路**号',
                            5: '徐*东',
                            6: '133****4312'
                        },
                        {
                            1: 'SZ-CT-002',
                            2: '深圳**基站',
                            3: '5G',
                            4: '广东省深圳市**区**路**号',
                            5: '李*亮',
                            6: '133****9874'
                        },
                        {
                            1: '......',
                            2: '......',
                            3: '......',
                            4: '......',
                            5: '......',
                            6: '......'
                        }
                    ]
                },
            },
            {
                type: 'text',
                data: `建议从“灾前-灾中-灾后”制定完整、细致的应对措施，如下：`
            },
            {
                type: 'text',
                data: `1、灾前预防与加固`
            },
            {
                type: 'text',
                data: `在台风来临前一周内，完成对受影响基站的全面检查，检查计划安排如下：`
            },
            {
                type: 'table',
                data: {
                    columns: [
                        {
                            dataIndex: 1,
                            title: '检查时间'
                        },
                        {
                            dataIndex: 2,
                            title: '基站ID'
                        },
                        {
                            dataIndex: 3,
                            title: '基站名称'
                        },
                        {
                            dataIndex: 4,
                            title: '基站类型'
                        },
                        {
                            dataIndex: 5,
                            title: '基站地址'
                        },
                        {
                            dataIndex: 6,
                            title: '检查人员姓名'
                        },
                        {
                            dataIndex: 7,
                            title: '检查人员手机'
                        }
                    ],
                    data: [
                        {
                            1: '2025-9-15',
                            2: 'SZ-CT-001',
                            3: '深圳**基站',
                            4: '5G',
                            5: '广东省深圳市**区**路**号',
                            6: '徐*东',
                            7: '133****2346',
                        },
                        {
                            1: '2025-9-15',
                            2: 'SZ-CT-018',
                            3: '深圳**基站',
                            4: '5G',
                            5: '广东省深圳市**区**路**号',
                            6: '李*亮',
                            7: '133****4312',
                        },
                        {
                            1: '2025-9-15',
                            2: 'GZ-CT-001',
                            3: '广州**基站',
                            4: '5G',
                            5: '广东省深圳市**区**路**号',
                            6: '张*飞',
                            7: '133****9874',
                        },
                        {
                            1: '2025-9-16',
                            2: '......',
                            3: '......',
                            4: '......',
                            5: '......',
                            6: '......',
                            7: '......',
                        }
                    ]
                }
            },
            {
                type: 'text',
                data: '2、灾中快速抢修'
            },
            {
                type: 'text',
                data: '为了能在故障发生后第一时间进行修复，在2025年9月22日到2025年9月25日期间，实施24小时快速响应保障计划，计划安排如下'
            },
            {
                type: 'table',
                data: {
                    "columns": [
                        {
                            "title": "时间",
                            "dataIndex": "date"
                        },
                        {
                            "title": "值班人员",
                            "dataIndex": "dutyPerson"
                        },
                        {
                            "title": "值班人员手机",
                            "dataIndex": "phone"
                        },
                        {
                            "title": "分管领导",
                            "dataIndex": "leader"
                        },
                        {
                            "title": "监控区域",
                            "dataIndex": "monitorArea"
                        },
                        {
                            "title": "区域内基站",
                            "dataIndex": "baseStations"
                        }
                    ],
                    "data": [
                        {
                            "date": "2025-9-22",
                            "dutyPerson": "徐*东",
                            "phone": "138****2346",
                            "leader": "王*清",
                            "monitorArea": "深圳市**区",
                            "baseStations": "SZ-CT-001、SZ-CT-002、SZ-CT-003"
                        },
                        {
                            "date": "2025-9-23",
                            "dutyPerson": "李*亮",
                            "phone": "138****4312",
                            "leader": "王*清",
                            "monitorArea": "深圳市**区",
                            "baseStations": "SZ-CT-010、SZ-CT-011、SZ-CT-018"
                        },
                        {
                            "date": "2025-9-24",
                            "dutyPerson": "张*飞",
                            "phone": "138****9874",
                            "leader": "王*清",
                            "monitorArea": "广州市**区",
                            "baseStations": "GZ-CT-001、GZ-CT-002、GZ-CT-003"
                        },
                        {
                            "date": "2025-9-25",
                            "dutyPerson": "......",
                            "phone": "......",
                            "leader": "......",
                            "monitorArea": "......",
                            "baseStations": "......"
                        }
                    ]
                }
            },
            {
                type: 'text',
                data: '3、灾后二次体检'
            },
            {
                type: 'text',
                data: '台风过境后，建议再次对受影响地区的基站进行快速体检，确保受影响地区内的基站未收到各种程度的损坏，检查计划安排如下：'
            },
            {
                type: 'table',
                data: {
                    "columns": [
                        {
                            "title": "检查时间",
                            "dataIndex": "inspectionTime"
                        },
                        {
                            "title": "基站ID",
                            "dataIndex": "baseStationId"
                        },
                        {
                            "title": "基站名称",
                            "dataIndex": "baseStationName"
                        },
                        {
                            "title": "基站类型",
                            "dataIndex": "baseStationType"
                        },
                        {
                            "title": "基站地址",
                            "dataIndex": "baseStationAddress"
                        },
                        {
                            "title": "检查人员姓名",
                            "dataIndex": "inspectorName"
                        },
                        {
                            "title": "检查人员手机",
                            "dataIndex": "inspectorPhone"
                        }
                    ],
                    "data": [
                        {
                            "inspectionTime": "2025-9-26",
                            "baseStationId": "SZ-CT-001",
                            "baseStationName": "深圳**基站",
                            "baseStationType": "5G",
                            "baseStationAddress": "广东省深圳市**区**路**号",
                            "inspectorName": "徐*东",
                            "inspectorPhone": "133****2346"
                        },
                        {
                            "inspectionTime": "2025-9-26",
                            "baseStationId": "SZ-CT-018",
                            "baseStationName": "深圳**基站",
                            "baseStationType": "5G",
                            "baseStationAddress": "广东省深圳市**区**路**号",
                            "inspectorName": "李*亮",
                            "inspectorPhone": "133****4312"
                        },
                        {
                            "inspectionTime": "2025-9-26",
                            "baseStationId": "GZ-CT-001",
                            "baseStationName": "广州**基站",
                            "baseStationType": "5G",
                            "baseStationAddress": "广东省广州市**区**路**号",
                            "inspectorName": "张*飞",
                            "inspectorPhone": "133****9874"
                        },
                        {
                            "inspectionTime": "2025-9-27",
                            "baseStationId": "......",
                            "baseStationName": "......",
                            "baseStationType": "......",
                            "baseStationAddress": "......",
                            "inspectorName": "......",
                            "inspectorPhone": "......"
                        }
                    ]
                }
            },
            {
                type: 'oper-group',
                data: [
                    {
                        text: '发送运维工单',
                        key: 6
                    }
                ]
            },
            {
                type: 'text',
                data: '您还可以问：'
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信十一期间iphone17在华东地区的销售有哪些影响？有什么应对方案？',
                key: 1
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信的哪些户外营销活动有影响？有什么应对方案？',
                key: 3
            }
        ]
    },
    6: {
        question: '发送运维工单。',
        flow: {
            nodes: [
                { id: 'node-1', data: { label: '天气' }, style: { x: 130, y: 50 } },
                { id: 'node-2', data: { label: '地址' }, style: { x: 130, y: 150 } },
                { id: 'node-3', data: { label: '基站' }, style: { x: 130, y: 250 } },
                { id: 'node-4', data: { label: '员工' }, style: { x: 130, y: 350 } },
            ],
            edges: [
                { source: 'node-1', target: 'node-2' },
                { source: 'node-2', target: 'node-3' },
                { source: 'node-3', target: 'node-4' },
            ]
        },
        code: `以下为代码片段示例
import json
import datetime
from enum import Enum
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import math

class WeatherSeverity(Enum):
    """"""天气严重程度枚举""""""
    MILD = ""轻度""
    MODERATE = ""中度""
    SEVERE = ""重度""
    EXTREME = ""极端""

class BaseStationStatus(Enum):
    """"""基站状态枚举""""""
    NORMAL = ""正常运行""
    DEGRADED = ""性能降级""
    PARTIAL_OUTAGE = ""部分中断""
    COMPLETE_OUTAGE = ""完全中断""
    MAINTENANCE = ""维护中""

class WeatherType(Enum):
    """"""异常天气类型枚举""""""
    THUNDERSTORM = ""雷暴""
    HEAVY_RAIN = ""暴雨""
    SNOWSTORM = ""暴雪""
    TYPHOON = ""台风""
    HIGH_TEMPERATURE = ""高温""
    LOW_TEMPERATURE = ""低温""
    HAIL = ""冰雹""
    STRONG_WIND = ""强风""
    LIGHTNING = ""雷电""
    FOG = ""浓雾""

class BaseStationType(Enum):
    """"""基站类型枚举""""""
    MACRO = ""宏基站""
    MICRO = ""微基站""
    SMALL_CELL = ""小基站""
    ROOFTOP = ""楼顶基站""
    GROUND = ""地面基站""

@dataclass
class WeatherEvent:
    """"""异常天气事件""""""
    weather_type: WeatherType
    severity: WeatherSeverity
    location: str
    start_time: datetime.datetime
    end_time: datetime.datetime
    affected_areas: List[str]
    wind_speed: Optional[float] = None  # 风速 m/s
    temperature: Optional[float] = None  # 温度 ℃
    precipitation: Optional[float] = None  # 降水量 mm
    description: str = """"

@dataclass
class BaseStation:
    """"""基站信息""""""
    station_id: str
    name: str
    location: str
    station_type: BaseStationType
    altitude: float  # 海拔高度
    construction_standard: str  # 建设标准
    power_backup_hours: int  # 备用电源时长
    maintenance_level: str  # 维护等级
    coverage_radius: float  # 覆盖半径 km
    installed_date: datetime.datetime
    last_maintenance: datetime.datetime

@dataclass
class NetworkImpact:
    """"""网络影响评估""""""
    station_id: str
    weather_event: WeatherEvent
    base_station_status: BaseStationStatus
    signal_strength_reduction: float  # 信号强度衰减百分比
    coverage_reduction: float  # 覆盖范围减少百分比
    estimated_users_affected: int  # 受影响用户数
    risk_score: float  # 风险评分 0-10
    failure_probability: float  # 故障概率 0-1
    expected_downtime_hours: float  # 预计中断时长`,
        answer: [
            {
                type: 'text',
                data: '已向相关人员发送运维工单。'
            },
            {
                type: 'text',
                data: '您还可以问：'
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信十一期间iphone17在华东地区的销售有哪些影响？有什么应对方案？',
                key: 1
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信的哪些户外营销活动有影响？有什么应对方案？',
                key: 3
            }
        ]
    },
    3: {
        question: '台风“桦加沙”对中国电信的哪些户外营销活动有影响？有什么应对方案？',
        flow: {
            nodes: [
                { id: 'node-1', data: { label: '天气' }, style: { x: 130, y: 50 } },
                { id: 'node-2', data: { label: '地址' }, style: { x: 130, y: 150 } },
                { id: 'node-3', data: { label: '营销活动' }, style: { x: 130, y: 250 } },
                { id: 'node-4', data: { label: '员工' }, style: { x: 130, y: 350 } },
            ],
            edges: [
                { source: 'node-1', target: 'node-2' },
                { source: 'node-2', target: 'node-3' },
                { source: 'node-3', target: 'node-4' },
            ]
        },
        codeLoading: true,
        code: `以下为代码片段示例
import json
import datetime
from enum import Enum
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import math

class WeatherSeverity(Enum):
    """"""天气严重程度枚举""""""
    MILD = ""轻度""
    MODERATE = ""中度""
    SEVERE = ""重度""
    EXTREME = ""极端""

class ActivityStatus(Enum):
    """"""营销活动状态枚举""""""
    NORMAL = ""正常进行""
    ADJUSTED = ""调整进行""
    DELAYED = ""延期举行""
    CANCELLED = ""取消""
    INDOOR_MOVED = ""转为室内""

class WeatherType(Enum):
    """"""异常天气类型枚举""""""
    RAIN = ""降雨""
    HEAVY_RAIN = ""暴雨""
    THUNDERSTORM = ""雷暴""
    SNOW = ""降雪""
    HIGH_TEMPERATURE = ""高温""
    LOW_TEMPERATURE = ""低温""
    STRONG_WIND = ""强风""
    FOG = ""浓雾""
    HAIL = ""冰雹""
    TYPHOON = ""台风""

class MarketingActivityType(Enum):
    """"""营销活动类型枚举""""""
    ROADSHOW = ""路演活动""
    EXHIBITION = ""展会展览""
    PRODUCT_LAUNCH = ""产品发布会""
    SPORTS_EVENT = ""体育赛事赞助""
    MUSIC_FESTIVAL = ""音乐节""
    COMMUNITY_EVENT = ""社区活动""
    SHOPPING_MALL = ""商场促销""
    OUTDOOR_AD = ""户外广告投放""

class AudienceType(Enum):
    """"""受众类型枚举""""""
    GENERAL = ""普通大众""
    YOUTH = ""年轻群体""
    FAMILY = ""家庭群体""
    BUSINESS = ""商务人士""
    ELDERLY = ""中老年群体""
    CHILDREN = ""儿童群体""

@dataclass
class WeatherEvent:
    """"""异常天气事件""""""
    weather_type: WeatherType
    severity: WeatherSeverity
    location: str
    start_time: datetime.datetime
    end_time: datetime.datetime
    affected_areas: List[str]
    temperature: Optional[float] = None  # 温度 ℃
    precipitation: Optional[float] = None  # 降水量 mm
    wind_speed: Optional[float] = None  # 风速 m/s
    humidity: Optional[float] = None  # 湿度 %
    description: str = """"

@dataclass
class MarketingActivity:
    """"""营销活动信息""""""
    activity_id: str
    name: str
    activity_type: MarketingActivityType
    location: str
    venue_type: str  # 场地类型
    planned_date: datetime.datetime
    duration_hours: int
    expected_attendance: int
    budget: float
    audience_type: AudienceType
    has_rain_plan: bool
    has_indoor_backup: bool
    importance_level: str  # 重要性等级
    preparation_status: str  # 准备状态

@dataclass
class ImpactAssessment:
    """"""影响评估结果""""""
    activity_id: str
    weather_event: WeatherEvent
    recommended_status: ActivityStatus
    attendance_reduction: float  # 参与人数减少比例
    revenue_impact: float  # 收入影响比例
    cost_increase: float  # 成本增加比例
    safety_risk_level: str  # 安全风险等级
    brand_impact_score: float  # 品牌影响评分 1-10
    roi_reduction: float  # 投资回报率减少比例
    contingency_effectiveness: float  # 应急预案有效性`,
        answer: [
            {
                type: 'pre',
                data: `嗯，用户想了解台风"桦加沙"对中国电信的哪些户外营销活动有影响以及相应的应对方案。需要我提供专业的影响分析，并提供应对方案。

首先，我查询到台风"桦加沙"预计于9月22日在广东深圳到徐闻一带沿海登陆，主要影响广东、广西、福建、海南等省份，这些省份将遭遇大风和强降雨，部分地区可能出现特大暴雨及洪涝、滑坡等次生灾害。台风将逐渐西行，预计于9月25日晚间逐渐离开我国大陆。

然后，我将调取“异常天气影响分析”本体，进行以下分析：

1、第1步，我将通过“天气”和“地址”查询台风“桦加沙”影响的地区。

2、第2步，我将查询受影响地区覆盖的“营销活动”。

3、第3步，我将查询营销活动关联的“员工”。

最后，我将从提前举行活动和延迟举行活动两种思路提供应对方案，并分别计算方案变更带来的活动预算变更。`
            },
            {
                type: 'text',
                data: `台风“桦加沙”的影响时间预计为：2025年9月22日到2025年9月25日，主要影响的省份有：广东、广西、福建、海南。在这段时间内，我司受影响的户外营销活动如下`
            },
            {
                type: 'table',
                data: {
                    "columns": [
                        {
                            "title": "活动ID",
                            "dataIndex": "activityId"
                        },
                        {
                            "title": "活动名称",
                            "dataIndex": "activityName"
                        },
                        {
                            "title": "活动时间",
                            "dataIndex": "activityTime"
                        },
                        {
                            "title": "活动地点",
                            "dataIndex": "activityLocation"
                        },
                        {
                            "title": "活动预算(元)",
                            "dataIndex": "activityBudget"
                        },
                        {
                            "title": "所属分公司",
                            "dataIndex": "branchCompany"
                        },
                        {
                            "title": "负责人姓名",
                            "dataIndex": "personInCharge"
                        },
                        {
                            "title": "负责人手机",
                            "dataIndex": "contactPhone"
                        }
                    ],
                    "data": [
                        {
                            "activityId": "M8273134",
                            "activityName": "动感5G，不潮不玩快闪店活动",
                            "activityTime": "2025-9-22",
                            "activityLocation": "广东省深圳市**区**路**号",
                            "activityBudget": "****",
                            "branchCompany": "深圳分公司",
                            "personInCharge": "裴*丽",
                            "contactPhone": "133****3421"
                        },
                        {
                            "activityId": "M8273135",
                            "activityName": "“防诈骗、现场答、上门修”主题服务活动",
                            "activityTime": "2025-9-23",
                            "activityLocation": "广东省深圳市**区**路**号",
                            "activityBudget": "****",
                            "branchCompany": "深圳分公司",
                            "personInCharge": "杨*娟",
                            "contactPhone": "133****7645"
                        },
                        {
                            "activityId": "M8273136",
                            "activityName": "开学季“国庆迎新”活动",
                            "activityTime": "2025-9-24",
                            "activityLocation": "广东省广州市**大学**校区",
                            "activityBudget": "****",
                            "branchCompany": "广州分公司",
                            "personInCharge": "房*珊",
                            "contactPhone": "153****1314"
                        }
                    ]
                }
            },
            {
                type: 'text',
                data: '根据影响大小的不同，建议采取不同的应对方案，并通过短信、外呼、公众号等多渠道提前通知参与者活动变更信息，劝导大家减少强风雨时段外出，远离危险区域。'
            },
            {
                type: 'tabs',
                data: [
                    {
                        title: '方案1：提前举行',
                        tab: [
                            {
                                type: 'text',
                                data: '建议赶在台风影响到来前，提前举行相关活动，调整计划如下：'
                            },
                            {
                                type: 'table',
                                data: {
                                    "columns": [
                                        {
                                            "title": "活动ID",
                                            "dataIndex": "activityId"
                                        },
                                        {
                                            "title": "活动名称",
                                            "dataIndex": "activityName"
                                        },
                                        {
                                            "title": "原计划时间",
                                            "dataIndex": "originalTime"
                                        },
                                        {
                                            "title": "调整后时间",
                                            "dataIndex": "adjustedTime"
                                        },
                                        {
                                            "title": "预估预算变更（元）",
                                            "dataIndex": "budgetChange"
                                        },
                                        {
                                            "title": "所属分公司",
                                            "dataIndex": "branchCompany"
                                        },
                                        {
                                            "title": "负责人姓名",
                                            "dataIndex": "personInCharge"
                                        },
                                        {
                                            "title": "负责人手机",
                                            "dataIndex": "contactPhone"
                                        }
                                    ],
                                    "data": [
                                        {
                                            "activityId": "M8273134",
                                            "activityName": "动感5G，不潮不玩快闪店活动",
                                            "originalTime": "2025-9-22",
                                            "adjustedTime": "2025-9-15",
                                            "budgetChange": "***",
                                            "branchCompany": "深圳分公司",
                                            "personInCharge": "裴*丽",
                                            "contactPhone": "133****3421"
                                        },
                                        {
                                            "activityId": "M8273135",
                                            "activityName": "“防诈骗、现场答、上门修”主题服务活动",
                                            "originalTime": "2025-9-23",
                                            "adjustedTime": "2025-9-16",
                                            "budgetChange": "***",
                                            "branchCompany": "深圳分公司",
                                            "personInCharge": "杨*娟",
                                            "contactPhone": "133****7645"
                                        },
                                        {
                                            "activityId": "M8273136",
                                            "activityName": "开学季“国庆迎新”活动",
                                            "originalTime": "2025-9-24",
                                            "adjustedTime": "2025-9-17",
                                            "budgetChange": "***",
                                            "branchCompany": "广州分公司",
                                            "personInCharge": "房*珊",
                                            "contactPhone": "153****1314"
                                        }
                                    ]
                                }
    
                            }
                        ]
                    },
                    {
                        title: '方案2：延迟举行',
                        tab: [
                            {
                                type: 'text',
                                data: '建议在台风影响减弱后，再举行相关的活动，调整计划如下：'
                            },
                            {
                                type: 'table',
                                data: {
                                    "columns": [
                                        {
                                            "title": "活动ID",
                                            "dataIndex": "activityId"
                                        },
                                        {
                                            "title": "活动名称",
                                            "dataIndex": "activityName"
                                        },
                                        {
                                            "title": "原计划时间",
                                            "dataIndex": "originalPlanTime"
                                        },
                                        {
                                            "title": "调整后时间",
                                            "dataIndex": "adjustedTime"
                                        },
                                        {
                                            "title": "预估预算变更（元）",
                                            "dataIndex": "estimatedBudgetChange"
                                        },
                                        {
                                            "title": "所属分公司",
                                            "dataIndex": "affiliatedBranch"
                                        },
                                        {
                                            "title": "负责人姓名",
                                            "dataIndex": "personInChargeName"
                                        },
                                        {
                                            "title": "负责人手机",
                                            "dataIndex": "personInChargePhone"
                                        }
                                    ],
                                    "data": [
                                        {
                                            "activityId": "M8273134",
                                            "activityName": "动感5G，不潮不玩快闪店活动",
                                            "originalPlanTime": "2025-9-22",
                                            "adjustedTime": "2025-9-27",
                                            "estimatedBudgetChange": "***",
                                            "affiliatedBranch": "深圳分公司",
                                            "personInChargeName": "裴*丽",
                                            "personInChargePhone": "133****3421"
                                        },
                                        {
                                            "activityId": "M8273135",
                                            "activityName": "“防诈骗、现场答、上门修”主题服务活动",
                                            "originalPlanTime": "2025-9-23",
                                            "adjustedTime": "2025-9-28",
                                            "estimatedBudgetChange": "***",
                                            "affiliatedBranch": "深圳分公司",
                                            "personInChargeName": "杨*娟",
                                            "personInChargePhone": "133****7645"
                                        },
                                        {
                                            "activityId": "M8273136",
                                            "activityName": "开学季“国庆迎新”活动",
                                            "originalPlanTime": "2025-9-24",
                                            "adjustedTime": "2025-9-29",
                                            "estimatedBudgetChange": "***",
                                            "affiliatedBranch": "广州分公司",
                                            "personInChargeName": "房*珊",
                                            "personInChargePhone": "153****1314"
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            },
            {
                type: 'oper-group',
                data: [
                    {
                        text: '执行方案1',
                        key: 7
                    },
                    {
                        text: '执行方案2',
                        key: 8
                    }
                ]
            },
            {
                type: 'text',
                data: '您还可以问：'
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信十一期间iphone17在华东地区的销售有哪些影响？有什么应对方案？',
                key: 1
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信的哪些基站有影响？有什么应对方案？',
                key: 2
            }
        ]
    },
    '7': {
        question: '执行方案1。',
        flow: {
            nodes: [
                { id: 'node-1', data: { label: '天气' }, style: { x: 130, y: 50 } },
                { id: 'node-2', data: { label: '地址' }, style: { x: 130, y: 150 } },
                { id: 'node-3', data: { label: '营销活动' }, style: { x: 130, y: 250 } },
                { id: 'node-4', data: { label: '员工' }, style: { x: 130, y: 350 } },
            ],
            edges: [
                { source: 'node-1', target: 'node-2' },
                { source: 'node-2', target: 'node-3' },
                { source: 'node-3', target: 'node-4' },
            ]
        },
        code: `以下为代码片段示例
import json
import datetime
from enum import Enum
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import math

class WeatherSeverity(Enum):
    """"""天气严重程度枚举""""""
    MILD = ""轻度""
    MODERATE = ""中度""
    SEVERE = ""重度""
    EXTREME = ""极端""

class ActivityStatus(Enum):
    """"""营销活动状态枚举""""""
    NORMAL = ""正常进行""
    ADJUSTED = ""调整进行""
    DELAYED = ""延期举行""
    CANCELLED = ""取消""
    INDOOR_MOVED = ""转为室内""

class WeatherType(Enum):
    """"""异常天气类型枚举""""""
    RAIN = ""降雨""
    HEAVY_RAIN = ""暴雨""
    THUNDERSTORM = ""雷暴""
    SNOW = ""降雪""
    HIGH_TEMPERATURE = ""高温""
    LOW_TEMPERATURE = ""低温""
    STRONG_WIND = ""强风""
    FOG = ""浓雾""
    HAIL = ""冰雹""
    TYPHOON = ""台风""

class MarketingActivityType(Enum):
    """"""营销活动类型枚举""""""
    ROADSHOW = ""路演活动""
    EXHIBITION = ""展会展览""
    PRODUCT_LAUNCH = ""产品发布会""
    SPORTS_EVENT = ""体育赛事赞助""
    MUSIC_FESTIVAL = ""音乐节""
    COMMUNITY_EVENT = ""社区活动""
    SHOPPING_MALL = ""商场促销""
    OUTDOOR_AD = ""户外广告投放""

class AudienceType(Enum):
    """"""受众类型枚举""""""
    GENERAL = ""普通大众""
    YOUTH = ""年轻群体""
    FAMILY = ""家庭群体""
    BUSINESS = ""商务人士""
    ELDERLY = ""中老年群体""
    CHILDREN = ""儿童群体""

@dataclass
class WeatherEvent:
    """"""异常天气事件""""""
    weather_type: WeatherType
    severity: WeatherSeverity
    location: str
    start_time: datetime.datetime
    end_time: datetime.datetime
    affected_areas: List[str]
    temperature: Optional[float] = None  # 温度 ℃
    precipitation: Optional[float] = None  # 降水量 mm
    wind_speed: Optional[float] = None  # 风速 m/s
    humidity: Optional[float] = None  # 湿度 %
    description: str = """"

@dataclass
class MarketingActivity:
    """"""营销活动信息""""""
    activity_id: str
    name: str
    activity_type: MarketingActivityType
    location: str
    venue_type: str  # 场地类型
    planned_date: datetime.datetime
    duration_hours: int
    expected_attendance: int
    budget: float
    audience_type: AudienceType
    has_rain_plan: bool
    has_indoor_backup: bool
    importance_level: str  # 重要性等级
    preparation_status: str  # 准备状态

@dataclass
class ImpactAssessment:
    """"""影响评估结果""""""
    activity_id: str
    weather_event: WeatherEvent
    recommended_status: ActivityStatus
    attendance_reduction: float  # 参与人数减少比例
    revenue_impact: float  # 收入影响比例
    cost_increase: float  # 成本增加比例
    safety_risk_level: str  # 安全风险等级
    brand_impact_score: float  # 品牌影响评分 1-10
    roi_reduction: float  # 投资回报率减少比例
    contingency_effectiveness: float  # 应急预案有效性`,
        answer: [
            {
                type: 'text',
                data: '已完成方案1执行。'
            },
            {
                type: 'text',
                data: '您还可以问：'
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信十一期间iphone17在华东地区的销售有哪些影响？有什么应对方案？',
                key: 1
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信的哪些基站有影响？有什么应对方案？',
                key: 2
            }
        ]
    },
    '8': {
        question: '执行方案2。',
        flow: {
            nodes: [
                { id: 'node-1', data: { label: '天气' }, style: { x: 130, y: 50 } },
                { id: 'node-2', data: { label: '地址' }, style: { x: 130, y: 150 } },
                { id: 'node-3', data: { label: '营销活动' }, style: { x: 130, y: 250 } },
                { id: 'node-4', data: { label: '员工' }, style: { x: 130, y: 350 } },
            ],
            edges: [
                { source: 'node-1', target: 'node-2' },
                { source: 'node-2', target: 'node-3' },
                { source: 'node-3', target: 'node-4' },
            ]
        },
        code: `以下为代码片段示例
import json
import datetime
from enum import Enum
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import math

class WeatherSeverity(Enum):
    """"""天气严重程度枚举""""""
    MILD = ""轻度""
    MODERATE = ""中度""
    SEVERE = ""重度""
    EXTREME = ""极端""

class ActivityStatus(Enum):
    """"""营销活动状态枚举""""""
    NORMAL = ""正常进行""
    ADJUSTED = ""调整进行""
    DELAYED = ""延期举行""
    CANCELLED = ""取消""
    INDOOR_MOVED = ""转为室内""

class WeatherType(Enum):
    """"""异常天气类型枚举""""""
    RAIN = ""降雨""
    HEAVY_RAIN = ""暴雨""
    THUNDERSTORM = ""雷暴""
    SNOW = ""降雪""
    HIGH_TEMPERATURE = ""高温""
    LOW_TEMPERATURE = ""低温""
    STRONG_WIND = ""强风""
    FOG = ""浓雾""
    HAIL = ""冰雹""
    TYPHOON = ""台风""

class MarketingActivityType(Enum):
    """"""营销活动类型枚举""""""
    ROADSHOW = ""路演活动""
    EXHIBITION = ""展会展览""
    PRODUCT_LAUNCH = ""产品发布会""
    SPORTS_EVENT = ""体育赛事赞助""
    MUSIC_FESTIVAL = ""音乐节""
    COMMUNITY_EVENT = ""社区活动""
    SHOPPING_MALL = ""商场促销""
    OUTDOOR_AD = ""户外广告投放""

class AudienceType(Enum):
    """"""受众类型枚举""""""
    GENERAL = ""普通大众""
    YOUTH = ""年轻群体""
    FAMILY = ""家庭群体""
    BUSINESS = ""商务人士""
    ELDERLY = ""中老年群体""
    CHILDREN = ""儿童群体""

@dataclass
class WeatherEvent:
    """"""异常天气事件""""""
    weather_type: WeatherType
    severity: WeatherSeverity
    location: str
    start_time: datetime.datetime
    end_time: datetime.datetime
    affected_areas: List[str]
    temperature: Optional[float] = None  # 温度 ℃
    precipitation: Optional[float] = None  # 降水量 mm
    wind_speed: Optional[float] = None  # 风速 m/s
    humidity: Optional[float] = None  # 湿度 %
    description: str = """"

@dataclass
class MarketingActivity:
    """"""营销活动信息""""""
    activity_id: str
    name: str
    activity_type: MarketingActivityType
    location: str
    venue_type: str  # 场地类型
    planned_date: datetime.datetime
    duration_hours: int
    expected_attendance: int
    budget: float
    audience_type: AudienceType
    has_rain_plan: bool
    has_indoor_backup: bool
    importance_level: str  # 重要性等级
    preparation_status: str  # 准备状态

@dataclass
class ImpactAssessment:
    """"""影响评估结果""""""
    activity_id: str
    weather_event: WeatherEvent
    recommended_status: ActivityStatus
    attendance_reduction: float  # 参与人数减少比例
    revenue_impact: float  # 收入影响比例
    cost_increase: float  # 成本增加比例
    safety_risk_level: str  # 安全风险等级
    brand_impact_score: float  # 品牌影响评分 1-10
    roi_reduction: float  # 投资回报率减少比例
    contingency_effectiveness: float  # 应急预案有效性`,
        answer: [
            {
                type: 'text',
                data: '已完成方案2执行。'
            },
            {
                type: 'text',
                data: '您还可以问：'
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信十一期间iphone17在华东地区的销售有哪些影响？有什么应对方案？',
                key: 1
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信的哪些基站有影响？有什么应对方案？',
                key: 2
            }
        ]
    },
    '1-false': {
        question: '台风“桦加沙”对中国电信十一期间iphone17在华东地区的销售有哪些影响？有什么应对方案？',
        answer: [
            {
                type: 'pre',
                data: `嗯，用户询问的是台风"桦加沙"对iPhone 17在华东地区销售的影响，这是个很具体的商业问题。用户可能是手机零售商或经销商，需要评估天气对销售业务的潜在影响。

我首先需要分析台风对华东地区的实际影响程度，然后才能推断对销售的影响。根据搜索结果，等权威媒体报道显示，虽然"桦加沙"主要在广东登陆，但通过远程水汽输送也影响了华东多个省份。详细描述了浙江温州、台州等地的暴雨情况，这些都属于华东地区。

不过提到江苏的降雨是台风倒槽和冷空气共同作用的结果，这说明影响机制比较复杂。关于销售中断的具体情况，虽然讨论了iPhone发售与台风的关系，但主要针对香港地区，对华东地区的参考价值有限。

我注意到搜索结果中没有直接提到iPhone 17销售受影响的具体案例，这意味着可能需要基于天气影响来合理推断。考虑到显示温州等地出现了大暴雨和局部内涝，这很可能导致门店客流减少和物流配送延迟。`
            },
            {
                type: 'text',
                data: '关于台风“桦加沙”对iPhone 17在华东地区销售的具体影响，目前公开的新闻报道中并未提供直接的说明。不过，我可以根据台风的实际影响情况，为你分析和推测可能出现的几个方面。'
            },
            {
                type: 'text',
                data: '天气状况：江苏、浙江、上海、安徽等地出现强降雨，部分地区达到暴雨或大暴雨级别。'
            },
            {
                type: 'text',
                data: '直接冲击：台风本身在广东沿海登陆，其主要风雨影响集中在华南地区，对华东地区属于远程影响'
            },
            {
                type: 'text',
                data: '基于以上天气情况，台风可能通过以下途径影响线下销售：'
            },
            {
                type: 'text',
                data: '门店客流减少：恶劣天气会直接导致外出人数锐减，前往实体店购买手机的顾客可能会大幅减少。'
            },
            {
                type: 'text',
                data: '物流配送延迟：暴雨和大风天气可能影响交通网络，导致快递延误，从而影响线上订单的交付速度和预约到店取货的体验。'
            },
            {
                type: 'text',
                data: '市场活动暂停：如果品牌方或经销商计划在户外或依赖人流的大型商场举办线下推广活动，很可能因天气原因被迫取消或延期。'
            },
            {
                type: 'text',
                data: '为了在未来更好地应对类似情况，你可以考虑：'
            },
            {
                type: 'text',
                data: '关注官方预警：密切留意气象部门发布的天气预报和预警信号，以及地方政府的相关通知。'
            },
            {
                type: 'text',
                data: '制定应急预案：为门店运营、物流保障和市场活动制定详细的应急预案。例如，在恶劣天气下，及时通过官方渠道告知消费者门店营业时间的调整、物流可能延迟等信息。'
            },
            {
                type: 'text',
                data: '加强线上服务：在天气不佳时，强化线上商城的服务和宣传，或许能部分抵消线下客流减少带来的影响。'
            },
            {
                type: 'text',
                data: '希望这些分析能为你提供一些参考。如果你能分享更具体的销售渠道（例如以线下门店为主还是线上为主），或许我可以帮你做更细致的分析。'
            },
            {
                type: 'text',
                data: '您还可以问：'
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信的哪些基站有影响？有什么应对方案？',
                key: 2
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信的哪些户外营销活动有影响？有什么应对方案？',
                key: 3
            }
        ]
    },
    '2-false': {
        question: '台风“桦加沙”对中国电信的哪些基站有影响？有什么应对方案？',
        answer: [
            {
                type: 'pre',
                data: `嗯，用户想了解台风"桦加沙"对电信基站的影响及应对方案。这个问题具有很强的时效性，因为台风是近期发生的自然灾害事件，用户可能身处受影响区域，关心通信服务的恢复情况。
我打算从两个主要方面来回答：首先是台风对基站造成的实际影响，然后是移动公司采取的应对措施。根据搜索结果，提供了非常具体的阳江地区基站受损情况，虽然来自论坛但内容详实具体。则给出了官方统计的全省基站受损数据，权威性较高。
我考虑先展示不同地区的基站影响情况，这样用户能快速了解受灾范围。然后分阶段介绍应对方案，从预防到抢修再到创新技术应用，这样逻辑更清晰。虽然讲的是其他台风，但其中的技术创新案例很有参考价值，可以适当引用。
最后我会提醒用户，如果仍在受影响区域，可以尝试一些自助方法改善信号，并提供官方反馈渠道。`
            },
            {
                type: 'text',
                data: '台风“桦加沙”可能对广东、海南、广西等地的移动通信基站造成了影响，下面是主要的影响情况和应对方案，你可以快速了解。'
            },
            {
                type: 'text',
                data: '影响范围：主要影响广东、海南、广西等地等地。对农村地区影响可能更为严重，因可能仅由单一基站覆盖，损坏后会导致大面积信号中断'
            },
            {
                type: 'text',
                data: '应对方案：建议启动应急响应机制，提前部署抢修力量，在确保安全的前提下，第一时间对受损设施进行抢修。'
            },
            {
                type: 'text',
                data: '如果台风过后，你所在的区域移动网络信号仍然不稳定，可以尝试以下方法：'
            },
            {
                type: 'text',
                data: '尝试重启设备：可以尝试重启手机或家中的路由器、数据机等设备，这有时能帮助重新接入网络。'
            },
            {
                type: 'text',
                data: `寻找稳定信号：在确保自身安全的情况下，可尝试移动到室外或地势较高的开阔地点，手机信号可能会有所改善。`
            },
            {
                type: 'text',
                data: `通过固话或他人反馈：如果固话或其他运营商的手机有信号，可以通过这些渠道向你的运营商（如中国电信）反馈情况，拨打客服热线（如中国电信客服10000）说明具体位置和问题。`
            },
            {
                type: 'text',
                data: `保持耐心：运营商正在全力抢修，对于农村等恢复难度较大的地区，可能需要更多一些时间。`
            },
            {
                type: 'text',
                data: `希望这些信息能帮助你了解情况。请多一分耐心，通信的全面恢复正在积极推进中。`
            },
            {
                type: 'text',
                data: '您还可以问：'
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信十一期间iphone17在华东地区的销售有哪些影响？有什么应对方案？',
                key: 1
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信的哪些户外营销活动有影响？有什么应对方案？',
                key: 3
            }
        ]
    },
    '3-false': {
        question: '台风“桦加沙”对中国电信的哪些户外营销活动有影响？有什么应对方案？',
        answer: [
            {
                type: 'pre',
                data: `好的，用户公司在9月下旬计划举行户外营销活动，需要了解台风"桦加沙"的影响和应对方案。我首先需要评估台风的实际影响范围和强度，然后根据搜索结果提供具体的防御建议。

我查询到"桦加沙"作为超强台风的特点，包括17级以上风力、可能登陆区域和影响时间。这些信息对判断活动风险很有帮助。特别是提到深圳在23日夜间到24日风雨最强，而显示24日已出现暴雨，这能帮助用户确定最关键的风险时段。

接下来要考虑应对措施。来自官方文旅部门，提供了针对旅游活动的专业防台指导，虽然针对不同台风但原则通用。的居民防台手册和的深圳应急管理局防御指南给出了很实用的具体操作建议，比如物资准备和居家防护。`
            },
            {
                type: 'text',
                data: '台风“桦加沙”对户外营销活动的主要影响包括：'
            },
            {
                type: 'text',
                data: '极端天气导致活动被迫暂停或延期，如强风、暴雨、洪涝等，严重时还可能造成人员伤亡和财产损失。'
            },
            {
                type: 'text',
                data: '交通中断、电力及通信设施受损，活动现场及周边可能出现道路封闭、积水、断电等情况，影响活动正常开展和参与者安全。'
            },
            {
                type: 'text',
                data: '人员安全风险加大，大风和强降雨容易引发山洪、泥石流、建筑倒塌等次生灾害，户外人员活动极为危险。'
            },
            {
                type: 'text',
                data: '应对方案建议'
            },
            {
                type: 'text',
                data: '1. 通过官方气象渠道（如中央气象台、地方气象局）持续跟进台风路径和强度变化，一旦发现活动区域将受台风直接影响，应立刻启动延期或取消预案。'
            },
            {
                type: 'text',
                data: '2. 活动现场应配备足够的防风、防雨、救生设备，安排专职安全员巡查隐患点，及时组织疏散。'
            },
            {
                type: 'text',
                data: '3. 提前准备卫星电话、对讲机、发电设备、急救包等应急物资，确保一旦发生突发情况能及时处置和对外求援。'
            },
            {
                type: 'text',
                data: '您还可以问：'
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信十一期间iphone17在华东地区的销售有哪些影响？有什么应对方案？',
                key: 1
            },
            {
                type: 'tip',
                data: '台风“桦加沙”对中国电信的哪些基站有影响？有什么应对方案？',
                key: 2
            }
        ]
    }
}