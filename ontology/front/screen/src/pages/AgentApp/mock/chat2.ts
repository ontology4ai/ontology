export const welcome = {
    text: '欢迎使用【数据分析】，我将根据您的问题进行数据分析。',
    questions: [
        {
            key: '1',
            text: '台风“桦加沙”即将来袭，请分析它可能对中国电信客户造成的影响，并提供应对方案。',
        },
        {
            key: '2',
            text: '9月25日，某市多个区域客户投诉激增，请分析主要原因，并提供应对方案。',
        },
        {
            key: '3',
            text: '请根据历史数据分析，台风“桦加沙”影响期间，有哪些潜在的营销机会？',
        }
    ]
}
export const data = {
    1: {
        question: '台风“桦加沙”即将来袭，请分析它可能对中国电信客户造成的影响，并提供应对方案。',
        flow: {
            nodes: [
                { id: 'node-1', data: { label: '天气' }, style: { x: 130, y: 50 } },
                { id: 'node-2', data: { label: '地址' }, style: { x: 130, y: 150 } },
                { id: 'node-3', data: { label: '基站' }, style: { x: 130, y: 250 } },
                { id: 'node-4', data: { label: '客户' }, style: { x: 130, y: 350 } },
                { id: 'node-5', data: { label: '合同' }, style: { x: 130, y: 450 } },
            ],
            edges: [
                { source: 'node-1', target: 'node-2' },
                { source: 'node-2', target: 'node-3' },
                { source: 'node-3', target: 'node-4' },
                { source: 'node-4', target: 'node-5' }
            ]
        },
        codeLoading: true,
        code: `"以下为代码片段示例
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
    expected_downtime_hours: float  # 预计中断时长"`,
        answer: [
            {
                type: 'pre',
                data: `嗯，用户想了解台风"桦加沙"对公司客户造成的影响，并提供应对方案。

首先，我查询到台风"桦加沙"预计于9月22日在广东深圳到徐闻一带沿海登陆，主要影响广东、广西、福建、海南等省份，这些省份将遭遇大风和强降雨，部分地区可能出现特大暴雨及洪涝、滑坡等次生灾害。台风将逐渐西行，预计于9月25日晚间逐渐离开我国大陆。

然后，我将调取“异常天气影响分析”本体，进行以下分析：

1、第1步，我将通过“天气”和“地址”查询台风“桦加沙”影响的地区。

2、第2步，我将查询受影响地区覆盖的“基站”。

3、第3步，我将查询业务关联的“客户”，包括公众客户和政企客户。

4、第4步，我将查询客户关联的“合同”，以及其中的SLA条款。

接下来，我将根据历史数据，分析可能造成的投诉数量和违约损失。

最后，我将制定客服应对方案。`
            },
            {
                type: 'text',
                data:  `台风“桦加沙”的影响时间预计为：2025年9月22日到2025年9月25日，主要影响的省份有：广东、广西、福建、海南。在这段时间内，我司受影响的基站、关联业务和关联客户如下：`
            },
            {
                type: 'line-chart'
            },
            /*{
                type: 'table',
                data: {
                    "columns": [
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
                            "title": "影响业务",
                            "dataIndex": "affectedService"
                        },
                        {
                            "title": "影响客户类型",
                            "dataIndex": "affectedCustomerType"
                        },
                        {
                            "title": "影响客户数",
                            "dataIndex": "numberOfAffectedCustomers"
                        },
                        {
                            "title": "预计投诉数",
                            "dataIndex": "estimatedComplaints"
                        },
                        {
                            "title": "预计违约损失(元)",
                            "dataIndex": "estimatedDefaultLoss"
                        }
                    ],
                    "data": [
                        {
                            "baseStationId": "SZ-CT-001",
                            "baseStationName": "深圳**基站",
                            "baseStationType": "5G",
                            "baseStationAddress": "广东省深圳市**区**路**号",
                            "affectedService": "A业务",
                            "affectedCustomerType": "政企客户",
                            "numberOfAffectedCustomers": 451,
                            "estimatedComplaints": 423,
                            "estimatedDefaultLoss": "*****"
                        },
                        {
                            "baseStationId": "SZ-CT-002",
                            "baseStationName": "深圳**基站",
                            "baseStationType": "5G",
                            "baseStationAddress": "广东省深圳市**区**路**号",
                            "affectedService": "B业务",
                            "affectedCustomerType": "家庭客户",
                            "numberOfAffectedCustomers": 57831,
                            "estimatedComplaints": 50983,
                            "estimatedDefaultLoss": "*****"
                        },
                        {
                            "baseStationId": "GZ-CT-001",
                            "baseStationName": "广州**基站",
                            "baseStationType": "5G",
                            "baseStationAddress": "广东省广州市**区**路**号",
                            "affectedService": "C业务",
                            "affectedCustomerType": "个人客户",
                            "numberOfAffectedCustomers": 138472,
                            "estimatedComplaints": 12873,
                            "estimatedDefaultLoss": "*****"
                        },
                        {
                            "baseStationId": "......",
                            "baseStationName": "......",
                            "baseStationType": "......",
                            "baseStationAddress": "......",
                            "affectedService": "......",
                            "affectedCustomerType": "......",
                            "numberOfAffectedCustomers": "",
                            "estimatedComplaints": "",
                            "estimatedDefaultLoss": ""
                        }
                    ]
                }
            },*/
            {
                "type": "text",
                "data": "以下是建议应对方案："
            },
            {
                "type": "text",
                "data": "一、灾前发送预警短信"
            },
            {
                "type": "text",
                "data": "向受影响区域的用户发送预警短信，告知可能出现的网络中断风险，并提供官方状态查询渠道。这能极大缓解客服压力，提升客户体验。发送内容和对象如下："
            },
            {
                "type": "text",
                "data": "1、发送内容"
            },
            {
                "type": "text",
                "data": "温馨提示，超强台风\"桦加沙\"将影响我省，在9月23日9点至9月25日17点时间段内，可能造成以下区域通信信号异常：**区，**区，**区。我公司已全力部署应急保障。请各位客户密切关注天气，提前做好物资储备，注意人身安全。台风期间如遇通信问题，敬请谅解。"
            },
            {
                "type": "text",
                "data": "2、发送对象"
            },
            {
                "type": "text",
                "data": "133****1234、133****5678、133****9876、133****4321、153****6543、153****8765、133****2468、173****1357、173****9753、173****8642、173****7531、177****6420、177****5318、177****4207、191****3186、191****2075、191****1864、193****8530、193****7429、193****6318、193****5206、......"
            },
            {
                "type": "text",
                "data": "二、灾中加强客服保障"
            },
            {
                "type": "text",
                "data": "1、统一客服口径"
            },
            {
                "type": "text",
                "data": "提供统一的客服口径，内容如下：您好，我们非常理解您此刻焦急的心情。受台风\"桦加沙\"影响，目前部分区域的通信设施遭到破坏，我公司已启动最高级别应急响应，正在全力抢修。通信恢复正常后，我们将立刻告知。台风影响期间，请您务必注意安全，感谢您的理解与支持！"
            },
            {
                type: 'table',
                data: {
                    "columns": [
                        {
                            "title": "班次名称",
                            "dataIndex": "shiftName"
                        },
                        {
                            "title": "工作时间",
                            "dataIndex": "workingHours"
                        },
                        {
                            "title": "核心任务",
                            "dataIndex": "coreTask"
                        },
                        {
                            "title": "客服人员",
                            "dataIndex": "customerServiceStaff"
                        }
                    ],
                    "data": [
                        {
                            "shiftName": "加强早班 (A班)",
                            "workingHours": "06:30 - 14:30",
                            "coreTask": "承接清晨积压话务，为全天高峰做准备。",
                            "customerServiceStaff": "张*轩、李*睿、王*涵、刘*辰、陈*熙、杨*宁、赵*阳、黄*怡、周*杰、吴*琳、......"
                        },
                        {
                            "shiftName": "核心中班 (B班)",
                            "workingHours": "14:30 - 22:30",
                            "coreTask": "核心覆盖晚间高峰，应对夜间网络咨询与投诉。",
                            "customerServiceStaff": "徐*豪、孙*悦、胡*峰、朱*娜、高*宇、林*静、何*涛、郭*琳、马*超、罗*文、......"
                        },
                        {
                            "shiftName": "应急夜班 (C班)",
                            "workingHours": "22:30 - 06:30",
                            "coreTask": "处理紧急报障，为次日早班梳理问题清单。",
                            "customerServiceStaff": "梁*欣、宋*航、郑*瑶、谢*铭、冯*雪、邓*凯、曹*娟、彭*亮、曾*敏、吕*鑫、苏*晴、......"
                        },
                        {
                            "shiftName": "机动支援班 (D班)",
                            "workingHours": "根据话务预警随时投入",
                            "coreTask": "由休班客服、后勤人员组成，实时响应话务浪涌。",
                            "customerServiceStaff": "卢*浩、蒋*菲、蔡*恒、贾*雯、丁*磊、魏*琪、程*远、沈*佳、唐*昕、......"
                        }
                    ]
                }
            },
            {
                "type": "text",
                "data": "三、灾后精准回访关怀"
            },
            {
                "type": "text",
                "data": "1、对普通的公众客户"
            },
            {
                "type": "text",
                "data": "通过短信或电话方式回访，说明通信和网络已恢复正常，安抚客户情绪。"
            },
            {
                "type": "text",
                "data": "1）发送内容"
            },
            {
                "type": "text",
                "data": "尊敬的客户，台风“桦加沙”影响已减弱，我市通信网络已全面恢复正常。对台风期间可能出现的信号中断给您造成的不便，我们深表歉意。感谢您的理解与支持，我们将持续做好网络保障，为您提供更优质的服务。"
            },
            {
                "type": "text",
                "data": "2）发送对象"
            },
            {
                "type": "text",
                "data": "133****1234、133****5678、133****9876、133****4321、153****6543、153****8765、133****2468、173****1357、173****9753、173****8642、173****7531、177****6420、177****5318、177****4207、191****3186、191****2075、191****1864、193****8530、193****7429、193****6318、193****5206、......"
            },
            {
                "type": "text",
                "data": "2、对高价值公众客户"
            },
            {
                "type": "text",
                "data": "通过赠送流量的方式实施个性化关怀与补偿。"
            },
            {
                "type": "text",
                "data": "1）发送内容"
            },
            {
                "type": "text",
                "data": "尊敬的**会员，我们监测到近日的台风可能影响了您在**区域的通话质量。为表歉意，我们已为您账户赠送10GB的通用流量，有效期30天。"
            },
            {
                "type": "text",
                "data": "2）发送对象"
            },
            {
                "type": "text",
                "data": "173****9753、173****8642、173****7531、177****6420、177****5318、177****4207、191****3186、191****2075、191****1864、193****8530、193****7429、193****6318、193****5206、......"
            },
            {
                "type": "text",
                "data": "3）对高价值政企客户"
            },
            {
                type: 'table',
                data: {
                    "columns": [
                        {
                            "title": "客户经理",
                            "dataIndex": "accountManager"
                        },
                        {
                            "title": "回访时间",
                            "dataIndex": "visitTime"
                        },
                        {
                            "title": "客户名单",
                            "dataIndex": "customerList"
                        }
                    ],
                    "data": [
                        {
                            "accountManager": "李*山",
                            "visitTime": "9月26日",
                            "customerList": "**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司"
                        },
                        {
                            "accountManager": "杨*昌",
                            "visitTime": "9月26日",
                            "customerList": "**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司"
                        },
                        {
                            "accountManager": "张*国",
                            "visitTime": "9月26日",
                            "customerList": "**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司"
                        },
                        {
                            "accountManager": "曹*娟",
                            "visitTime": "9月26日",
                            "customerList": "**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司"
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
                data: '9月25日，某市多个区域客户投诉激增，请分析主要原因，并提供应对方案',
                key: 2
            },
            {
                type: 'tip',
                data: '请根据历史数据分析，台风“桦加沙”影响期间，有哪些潜在的营销机会？',
                key: 3
            }
        ]
    },
    2: {
        question: '9月25日，某市多个区域客户投诉激增，请分析主要原因，并提供应对方案。',
        flow: {
            nodes: [
                { id: 'node-1', data: { label: '客户投诉' }, style: { x: 130, y: 50 } },
                { id: 'node-2', data: { label: '天气' }, style: { x: 130, y: 150 } },
                { id: 'node-3', data: { label: '地址' }, style: { x: 130, y: 250 } },
                { id: 'node-4', data: { label: '电力线路' }, style: { x: 130, y: 350 } },
                { id: 'node-5', data: { label: '基站' }, style: { x: 130, y: 450 } },
                { id: 'node-6', data: { label: '员工' }, style: { x: 55, y: 550 } },
                { id: 'node-7', data: { label: '客户' }, style: { x: 205, y: 550 } },
            ],
            edges: [
                { source: 'node-1', target: 'node-2' },
                { source: 'node-2', target: 'node-3' },
                { source: 'node-3', target: 'node-4' },
                { source: 'node-4', target: 'node-5' },
                { source: 'node-5', target: 'node-6' },
                { source: 'node-5', target: 'node-7' },
            ]
        },
        codeLoading: true,
        code: `"以下为代码片段示例
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
    expected_downtime_hours: float  # 预计中断时长"`,
        answer: [
            {
                type: 'pre',
                data:  `嗯，用户想了解9月25日客户投诉量突然增多的主要原因，并提供应对方案。

首先，我查询到9月22日到9月25日正是台风"桦加沙"影响我省的时间，客诉量由很大可能是天气异常导致的通信和网络信号异常。

然后，我将调取“异常天气影响分析”本体，进行以下分析：

1、第1步，我将通过“客户投诉”查询9月25日客户投诉的区域、类别和内容，找出投诉占比高的区域和类别。

2、第2步，我将通过“天气”和“地址”查询台风“桦加沙”影响的地区，并与投诉区域进行匹配。

3、第3步，我将查询“电力线路”，了解当天相关区域是否存在停电情况，

4、第4步，我将查询受影响地区出现异常告警的“基站”。

5、第5步，我将分别查询“员工”和“客户”，安排对应的人员进行基站维修，并筛选高价值客户。

最后，我将制定基站维修方案和客户安抚方案。`
            },
            {
                type: 'text',
                data: `9月25日我省客户投诉量分布情况如下：`
            },
            {
                type: 'pie-chart'
            },
            /*{
                type: 'table',
                data: {
                    "columns": [
                        {
                            "title": "投诉类别",
                            "dataIndex": "complaintCategory"
                        },
                        {
                            "title": "投诉数量",
                            "dataIndex": "complaintQuantity"
                        },
                        {
                            "title": "投诉数量占比",
                            "dataIndex": "complaintProportion"
                        }
                    ],
                    "data": [
                        {
                            "complaintCategory": "通信和网络质量",
                            "complaintQuantity": 16531,
                            "complaintProportion": "95.5%"
                        },
                        {
                            "complaintCategory": "产品质量",
                            "complaintQuantity": 23,
                            "complaintProportion": "1.2%"
                        },
                        {
                            "complaintCategory": "业务营销",
                            "complaintQuantity": 11,
                            "complaintProportion": "0.3%"
                        },
                        {
                            "complaintCategory": "......",
                            "complaintQuantity": "......",
                            "complaintProportion": "......"
                        }
                    ]
                }
            },*/
            {
                type: 'text',
                data: `从上面的数据可以看出，9月25日95%以上的投诉原因是通信和网络异常，而这期间恰好也是台风“桦加沙”影响我省的时间。经分析，当天异常的基站和原因如下：`
            },
            {
                type: 'table',
                data:  {
                    "columns": [
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
                            "title": "异常原因",
                            "dataIndex": "abnormalReason"
                        }
                    ],
                    "data": [
                        {
                            "baseStationId": "SZ-CT-001",
                            "baseStationName": "深圳**基站",
                            "baseStationType": "5G",
                            "baseStationAddress": "广东省深圳市**区**路**号",
                            "abnormalReason": "设备与硬件故障"
                        },
                        {
                            "baseStationId": "SZ-CT-018",
                            "baseStationName": "深圳**基站",
                            "baseStationType": "5G",
                            "baseStationAddress": "广东省深圳市**区**路**号",
                            "abnormalReason": "设备与硬件故障"
                        },
                        {
                            "baseStationId": "GZ-CT-001",
                            "baseStationName": "广州**基站",
                            "baseStationType": "5G",
                            "baseStationAddress": "广东省广州市**区**路**号",
                            "abnormalReason": "所在片区停电"
                        },
                        {
                            "baseStationId": "......",
                            "baseStationName": "......",
                            "baseStationType": "......",
                            "baseStationAddress": "......",
                            "abnormalReason": "......"
                        }
                    ]
                }
            },
            {
                "type": "text",
                "data": "以下是建议应对方案："
            },
            {
                "type": "text",
                "data": "一、基站维修"
            },
            {
                "type": "text",
                "data": "对异常原因为“设备和硬件故障”的基站进行维修，维修计划如下："
            },
            {
                type: 'table',
                data: {
                    "columns": [
                        {
                            "title": "维修时间",
                            "dataIndex": "repairTime"
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
                            "title": "维修人员姓名",
                            "dataIndex": "repairPersonName"
                        },
                        {
                            "title": "维修人员手机",
                            "dataIndex": "repairPersonPhone"
                        }
                    ],
                    "data": [
                        {
                            "repairTime": "2025-9-27",
                            "baseStationId": "SZ-CT-001",
                            "baseStationName": "深圳**基站",
                            "baseStationType": "5G",
                            "baseStationAddress": "广东省深圳市**区**路**号",
                            "repairPersonName": "徐*东",
                            "repairPersonPhone": "133****2346"
                        },
                        {
                            "repairTime": "2025-9-27",
                            "baseStationId": "SZ-CT-018",
                            "baseStationName": "深圳**基站",
                            "baseStationType": "5G",
                            "baseStationAddress": "广东省深圳市**区**路**号",
                            "repairPersonName": "李*亮",
                            "repairPersonPhone": "133****4312"
                        }
                    ]
                }
            },
            {
                "type": "text",
                "data": "二、客户安抚"
            },
            {
                "type": "text",
                "data": "1、对普通的公众客户"
            },
            {
                "type": "text",
                "data": "通过短信或电话方式回访，说明通信和网络已恢复正常，安抚客户情绪。"
            },
            {
                "type": "text",
                "data": "1）发送内容"
            },
            {
                "type": "text",
                "data": "尊敬的客户，台风“桦加沙”影响已减弱，我市通信网络已全面恢复正常。对台风期间可能出现的信号中断给您造成的不便，我们深表歉意。感谢您的理解与支持，我们将持续做好网络保障，为您提供更优质的服务。"
            },
            {
                "type": "text",
                "data": "2）发送对象"
            },
            {
                "type": "text",
                "data": "133****1234、133****5678、133****9876、133****4321、153****6543、153****8765、133****2468、173****1357、173****9753、173****8642、173****7531、177****6420、177****5318、177****4207、191****3186、191****2075、191****1864、193****8530、193****7429、193****6318、193****5206、......"
            },
            {
                "type": "text",
                "data": "2、对高价值公众客户"
            },
            {
                "type": "text",
                "data": "通过赠送流量的方式实施个性化关怀与补偿。"
            },
            {
                "type": "text",
                "data": "1）发送内容"
            },
            {
                "type": "text",
                "data": "尊敬的**会员，我们监测到近日的台风可能影响了您在**区域的通话质量。为表歉意，我们已为您账户赠送10GB的通用流量，有效期30天。"
            },
            {
                "type": "text",
                "data": "2）发送对象"
            },
            {
                "type": "text",
                "data": "173****9753、173****8642、173****7531、177****6420、177****5318、177****4207、191****3186、191****2075、191****1864、193****8530、193****7429、193****6318、193****5206、......"
            },
            {
                "type": "text",
                "data": "3、对高价值政企客户"
            },
            {
                "type": "text",
                "data": "建议由客户经理进行电话或上门回访，名单如下："
            },
            {
                type: 'table',
                data: {
                    "columns": [
                        {
                            "title": "客户经理",
                            "dataIndex": "accountManager"
                        },
                        {
                            "title": "回访时间",
                            "dataIndex": "visitTime"
                        },
                        {
                            "title": "客户名单",
                            "dataIndex": "customerList"
                        }
                    ],
                    "data": [
                        {
                            "accountManager": "李*山",
                            "visitTime": "9月26日",
                            "customerList": "**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司"
                        },
                        {
                            "accountManager": "杨*昌",
                            "visitTime": "9月26日",
                            "customerList": "**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司"
                        },
                        {
                            "accountManager": "张*国",
                            "visitTime": "9月26日",
                            "customerList": "**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司"
                        },
                        {
                            "accountManager": "曹*娟",
                            "visitTime": "9月26日",
                            "customerList": "**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司，**公司"
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
                data: '台风“桦加沙”即将来袭，请分析它可能对中国电信客户造成的影响，并提供应对方案。',
                key: 1
            },
            {
                type: 'tip',
                data: '请根据历史数据分析，台风“桦加沙”影响期间，有哪些潜在的营销机会？',
                key: 3
            }
        ]
    },
    3: {
        question: '请根据历史数据分析，台风“桦加沙”影响期间，有哪些潜在的营销机会？',
        flow: {
            nodes: [
                { id: 'node-1', data: { label: '天气' }, style: { x: 130, y: 50 } },
                { id: 'node-2', data: { label: '订单' }, style: { x: 130, y: 150 } },
                { id: 'node-3', data: { label: '产品' }, style: { x: 130, y: 250 } },
                { id: 'node-4', data: { label: '客户' }, style: { x: 130, y: 350 } }
            ],
            edges: [
                { source: 'node-1', target: 'node-2' },
                { source: 'node-2', target: 'node-3' },
                { source: 'node-3', target: 'node-4' }
            ]
        },
        codeLoading: true,
        code: `"以下为代码片段示例
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
    contingency_effectiveness: float  # 应急预案有效性"`,
        answer: [
            {
                type: 'pre',
                data: `嗯，用户想了解根据历史数据分析台风"桦加沙"影响期间，根据客户行为模式的改变，有哪些潜在的营销机会。

我将调取“异常天气影响分析”本体，进行以下分析：

1、第1步，我将通过“天气”查询过去1年来本省发生过的异常天气及其影响时间段。

2、第2步，我将通过“订单”查询这些时间段内客户的订购行为，并将其与天气正常时间的订购行为进行对比，得出异常天气时间段内，客户订购意愿较强的产品。

3、第3步，我将通过“产品”查询，哪些产品目前仍然生效，并查找同类的产品。

4、第4步，我将通过“客户”查询有过类似订购行为的客户。

最后，我将制定对应的营销方案。`
            },
            {
                type: 'text',
                data: '台风“桦加沙”影响期间，大多数客户生活模式的变化，及其带来的通信需求如下：'
            },
            {
                type: 'table',
                data: {
                    "columns": [
                        {
                            "title": "生活模式变化",
                            "dataIndex": "lifePatternChange"
                        },
                        {
                            "title": "衍生的通信与网络需求",
                            "dataIndex": "derivedCommunicationNeeds"
                        }
                    ],
                    "data": [
                        {
                            "lifePatternChange": "活动空间固化：从户外转为严格的室内生活，家成为唯一的活动中心。",
                            "derivedCommunicationNeeds": "稳定性需求：对家庭宽带和室内Wi-Fi的信号强度、稳定性要求急剧升高。"
                        },
                        {
                            "lifePatternChange": "信息获取方式改变：无法外出获取信息，完全依赖手机和电视。",
                            "derivedCommunicationNeeds": "实时性需求：需要实时、权威的台风动态、政府通知、交通路况等资讯。大流量需求：视频、直播、新闻App消耗流量激增。"
                        },
                        {
                            "lifePatternChange": "工作与学习模式中断：停工停学，转为远程办公与在线课堂。",
                            "derivedCommunicationNeeds": "高质量网络需求：对视频会议、云桌面、在线教育平台的网络延迟和上行带宽要求极高。"
                        },
                        {
                            "lifePatternChange": "娱乐方式高度集中：休闲娱乐完全依赖于在线影视、短视频、手机游戏。",
                            "derivedCommunicationNeeds": "高带宽与低延迟需求：4K/8K视频流、大型手游需要高速网络支撑，避免卡顿。"
                        },
                        {
                            "lifePatternChange": "社交与亲情联络强化：与亲友，尤其是年长父母和外地的家人报平安、沟通频率增加。",
                            "derivedCommunicationNeeds": "基础通信保障需求：需要稳定、清晰的语音通话和视频通话功能。"
                        }
                    ]
                }

            },
            {
                type: 'text',
                data: '基于以上分析，我们不应是简单地推销，而是以“解决方案”的形式，为客户提供关怀和支持。以下是建议推荐的销售品和销售策略：'
            },
            {
                type: 'bar-chart'
            },
            {
                type: 'table',
                data: {
                    "columns": [
                        {
                            "title": "客户类型",
                            "dataIndex": "customerType"
                        },
                        {
                            "title": "推荐销售品",
                            "dataIndex": "recommendedProduct"
                        },
                        {
                            "title": "话术",
                            "dataIndex": "salesScript"
                        },
                        {
                            "title": "客户名单",
                            "dataIndex": "customerList"
                        }
                    ],
                    "data": [
                        {
                            "customerType": "公众客户",
                            "recommendedProduct": "免停机服务 & 话费急救包",
                            "salesScript": "台风期间，中国移动为您提供免停机服务，保障您与家人的通话畅通。如需紧急开机或话费充值，可通过中国移动APP一键办理，免外出，更安全。",
                            "customerList": "133****5678、133****1234、133****8765、133****4321、133****6543、153****7890、133****2468、......"
                        },
                        {
                            "customerType": "公众客户",
                            "recommendedProduct": "定向流量包 / 通用流量日包",
                            "salesScript": "宅家刷剧、看新闻，流量不够用？推荐您办理‘台风观影包’（含视频App定向流量）或‘极速日包’，满足您居家期间的信息娱乐需求。",
                            "customerList": "133****1337、133****9753、133****8642、133****5206、153****4195、133****3084、133****2973、......"
                        },
                        {
                            "customerType": "公众客户",
                            "recommendedProduct": "亲情网升级 / 视频通话包",
                            "salesScript": "牵挂家人安危？立即为家人组建或升级亲情网，享受成员间长时间免费通话。还可订购视频通话包，与家人‘面对面’报平安。",
                            "customerList": "133****1862、133****0751、133****9640、153****8529、133****7418、......"
                        },
                        {
                            "customerType": "公众客户",
                            "recommendedProduct": "千兆宽带体验包 / Wi-Fi信号增强服务",
                            "salesScript": "全家在线，网络卡顿？现在可免费体验千兆宽带提速，或预约我们的智慧家庭工程师，为您优化全屋Wi-Fi，确保每个角落信号满格。",
                            "customerList": "133****1234、133****5678、133****9876、133****4321、133****6543、......"
                        },
                        {
                            "customerType": "公众客户",
                            "recommendedProduct": "移动高清/咪咕视频VIP会员包",
                            "salesScript": "开通移动高清电视影视包或咪咕视频会员，海量院线大片、体育赛事随心看，陪您安心度过台风天。",
                            "customerList": "133****1234、133****5678、133****9876、133****4321、133****6543、......"
                        },
                        {
                            "customerType": "政企客户",
                            "recommendedProduct": "云空间/和飞信会议包",
                            "salesScript": "停工不停产。中国移动为您提供企业云盘临时扩容，保障文件安全共享；以及‘和飞信’高清视频会议包，支持百人同时在线，助力团队远程协作。",
                            "customerList": "132****1337、177****9753、130****8642、133****7531、133****6420、......"
                        },
                        {
                            "customerType": "政企客户",
                            "recommendedProduct": "企业宽带保障服务",
                            "salesScript": "为确保您关键业务不中断，我们可为您的办公地点提供企业宽带SLA保障服务，优先抢修，确保网络稳定。",
                            "customerList": "132****1337、177****9753、130****8642、133****7531、133****6420、......"
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
                data: '台风“桦加沙”即将来袭，请分析它可能对中国电信客户造成的影响，并提供应对方案。',
                key: 1
            },
            {
                type: 'tip',
                data: '9月25日，某市多个区域客户投诉激增，请分析主要原因，并提供应对方案。',
                key: 2
            }
        ]
    },
    '1-false': {
        question: '台风“桦加沙”即将来袭，请分析它可能对中国电信客户造成的影响，并提供应对方案。',
        answer: [
            {
                type: 'pre',
                data: `嗯，用户询问的是台风"桦加沙"对公司客户可能造成的影响及客服应对方案。这是一个很实际的运营问题，说明用户可能是某企业的客服或运营管理人员，需要提前做好台风期间的客户服务准备。

我打算从台风可能对客户造成的影响入手，然后提供系统的客服应对方案。这样既能帮助用户理解风险，又能给出具体可行的操作建议。

基于这些信息，我考虑先整理台风的关键数据，让用户对威胁有清晰认识。然后分析对客户的具体影响，主要从物流、出行、安全、财产四个维度展开。最后提供客服应对方案，包括应急准备、沟通策略、业务协调等。`
            },
            {
                "type": "text",
                "data": "根据气象部门最新预报，超强台风\"桦加沙\"将向广东西部到海南岛东部一带沿海靠近，预计24日中午到晚上在广东珠海到湛江一带沿海登陆，登陆强度可达台风级或强台风级（13-15级）。"
            },
            {
                "type": "text",
                "data": "一、对客户的主要影响分析"
            },
            {
                "type": "text",
                "data": "台风\"桦加沙\"可能从以下几个方面对您的客户造成影响："
            },
            {
                "type": "text",
                "data": "1、物流配送延迟：受台风影响，海南岛四周海面和北部湾海面风力将自东向西逐渐增大到11-12级、阵风13-14级，这将导致快递物流在受影响区域大面积暂停或严重延误。"
            },
            {
                "type": "text",
                "data": "2、出行计划受阻：台风影响期间，航班、铁路等交通系统可能大规模调整。"
            },
            {
                "type": "text",
                "data": "3、安全风险增加：台风伴随的强风暴雨可能导致高空坠物、积水内涝等安全隐患。部分地区可能出现临时性的停电、停水或通信不稳定情况，影响客户正常使用线上服务或与客服联系。"
            },
            {
                "type": "text",
                "data": "二、以下是客服应对方案，可帮助你们更好地服务客户："
            },
            {
                "type": "text",
                "data": "1、优化沟通策略"
            },
            {
                "type": "text",
                "data": "主动预警通知：通过APP推送、短信、社交媒体等渠道，主动向可能受影响区域的客户发送台风动态及公司服务调整信息。"
            },
            {
                "type": "text",
                "data": "设置自动语音提醒：客户拨打客服热线时，即时触发台风期间服务提醒，对客户进行安抚。"
            },
            {
                "type": "text",
                "data": "内部知识库更新：确保客服人员掌握最新的台风路径、公司应急政策及区域服务调整详情。"
            },
            {
                "type": "text",
                "data": "2、调整服务政策"
            },
            {
                "type": "text",
                "data": "放宽售后标准：临时调整受影响区域的售后政策，延长退货退款时限，免除因台风导致的退换货运费。"
            },
            {
                "type": "text",
                "data": "灵活处理违约：对于因台风造成的履约延迟（如发货、服务交付），主动向客户说明情况并提供补救方案，参照淘宝网对台风延迟发货的豁免政策。"
            },
            {
                "type": "text",
                "data": "3、加强后台支持"
            },
            {
                "type": "text",
                "data": "远程办公支持：必要时启用远程居家座席模式，实现线上线下无缝衔接，确保服务\"不停摆\"。"
            },
            {
                "type": "text",
                "data": "系统故障应急：建立技术团队应急响应机制，确保客服系统稳定运行。"
            },
            {
                "type": "text",
                "data": "员工关怀保障：统筹安排话务力量，关注客服员工安全，为往返困难的员工提供临时住宿或交通支持。"
            },
            {
                type: 'text',
                data: '您还可以问：'
            },
            {
                type: 'tip',
                data: '9月25日，某市多个区域客户投诉激增，请分析主要原因，并提供应对方案',
                key: 2
            },
            {
                type: 'tip',
                data: '请根据历史数据分析，台风“桦加沙”影响期间，有哪些潜在的营销机会？',
                key: 3
            }
        ]
    },
    '2-false': {
        question: `9月25日，某市多个区域客户投诉激增，请分析主要原因，并提供应对方案。`,
        answer: [
            {
                type: 'pre',
                data: `嗯，用户需要分析9月25日多个区域客户投诉激增的原因和应对方案。这个问题很具体，涉及实际工作场景，需要结合搜索到的信息给出专业建议。

我看到的搜索结果中有不少关于投诉的案例和解决方案。首先需要分析投诉激增的可能原因。关于应对方案，和都提到"三个一"服务举措，包括十项服务承诺和直管服务监督平台，这些官方措施可以作为应对方案的核心部分。则提供了基于客户感知识别的管理体系创新思路，强调从"被动应对"向"主动引领"转变。

我考虑围绕这些核心信息构建一个系统的回答，先分析可能导致投诉激增的原因，再提供具体的应对方案，最后给出总结建议。这样既能解决当下问题，也能为长期服务改进提供方向.`
            },
            {
                "type": "text",
                "data": "一、投诉原因分析"
            },
            {
                "type": "text",
                "data": "根据现有信息，投诉激增很可能由以下一个或多个原因导致："
            },
            {
                "type": "text",
                "data": "网络质量波动：**地区用户密集，基站承压较大。在晚高峰等时段，市区重点区域的基站超负荷运转，可能导致信号满格却无法上网、网速骤降等问题。此外，不排除当时存在区域性网络故障，或运营商为平衡网络负荷进行的参数调整，从而引发用户感知到的\"网络卡顿\"。"
            },
            {
                "type": "text",
                "data": "客服体系应对不足：当问题初现时，如果一线客服渠道未能有效化解，会导致问题升级和投诉堆积。"
            },
            {
                "type": "text",
                "data": "二、应对方案"
            },
            {
                "type": "text",
                "data": "您可以立即从以下几个方面着手，稳定局势并提升客户满意度。"
            },
            {
                "type": "text",
                "data": "1、快速定位问题：协同网络部门，迅速查明9月25日是否发生特定区域的网络故障或进行过可能影响用户感知的网络优化调整。"
            },
            {
                "type": "text",
                "data": "2、统一沟通口径：如果存在普遍性问题（如大范围网络波动），请准备简洁、坦诚的说明模板，通过10086短信、官方App推送等渠道告知用户实际情况及预计恢复时间，避免猜测和隐瞒。"
            },
            {
                type: 'text',
                data: '您还可以问：'
            },
            {
                type: 'tip',
                data: '台风“桦加沙”即将来袭，请分析它可能对中国电信客户造成的影响，并提供应对方案。',
                key: 1
            },
            {
                type: 'tip',
                data: '请根据历史数据分析，台风“桦加沙”影响期间，有哪些潜在的营销机会？',
                key: 3
            }
        ]
    },
    '3-false': {
        question: '请根据历史数据分析，台风“桦加沙”影响期间，有哪些潜在的营销机会？',
        answer: [
            {
                type: 'pre',
                data: `
嗯，用户想了解根据历史数据分析台风"桦加沙"影响期间，根据客户行为模式的改变，有哪些潜在的营销机会。

台风"桦加沙"影响期间，人们的生活模式会发生变化，通常居家办公、在线学习、娱乐需求增加，比如看视频、玩游戏。同时，家人之间的沟通变得重要，需要保持联系。另外，企业可能面临远程办公的挑战，对网络稳定性要求更高。运营商可以在台风期间的提供实际应急措施，包括免停机服务、线上渠道引导和预警信息发送，这些都可以转化为营销机会。

最后需要强调的是，在灾害场景下开展营销必须把握分寸，所有活动都应该以提供实际帮助为前提，避免任何可能被视为利用灾难的营销行为。`
            },
            {
                "type": "text",
                "data": "我为您梳理了几个层面的潜在营销机会，并融入一些可行的落地方案参考："
            },
            {
                "type": "text",
                "data": "针对台风期间用户工作生活模式的变化，推出灵活应景的通信产品，能有效有效捕捉特定需求。"
            },
            {
                "type": "text",
                "data": "家庭产品包：由于台风期间很多人居家，对网络依赖度更高。可以快速速推出 \"家庭安心包\"，包含宽带加速、定向视频流量、热门云游戏时长等，满足家庭娱乐和远程办公、在线教育的需求。有观察显示，恶劣天气后，一些代表\"恢复正常生活\"的享受型产品（如奶茶）会迎来订单高峰，这反映了人们寻求慰藉和放松的心理，我们的产品可以契合这一点。"
            },
            {
                "type": "text",
                "data": "企业保障包：针对受灾区域的中小企业，可提供临时性的云服务器扩容、企业宽带保障或云办公套餐，支持他们灾后快速恢复运营。"
            },
            {
                "type": "text",
                "data": "此外，您还可以为受灾区域的用户，特别是高价值客户和政企客户，提供业务办理绿色通道和一对一客户经理服务。这能让他们感受到优先和重视。"
            },
            {
                "type": "text",
                "data": "希望这些思路能为您带来启发。请注意，所有营销活动在特殊时期都应谨慎把握分寸，确保以提供真实帮助和关怀为前提，避免任何可能引发误会的商业宣传。"
            },
            {
                "type": "text",
                "data": "如果您能分享更具体的受影响区域用户画像或本地服务资源，我可以为您提供更具针对性的方案。"
            },
            {
                type: 'text',
                data: '您还可以问：'
            },
            {
                type: 'tip',
                data: '台风“桦加沙”即将来袭，请分析它可能对中国电信客户造成的影响，并提供应对方案。',
                key: 1
            },
            {
                type: 'tip',
                data: '9月25日，某市多个区域客户投诉激增，请分析主要原因，并提供应对方案。',
                key: 2
            }
        ]
    }
}