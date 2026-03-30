export const welcome = {
    text: 'Welcome to [AI Agents]. I will analyze based on your questions.',
    questions: [
        {
            key: '1',
            text: 'Customer complaints in multiple districts of Shenzhen have surged over the past week. Please analyze the root causes and provide response plans.',
        },
        {
            key: '2',
            text: 'We will shut down base stations in Nanshan District, Shenzhen for maintenance this week. Please analyze which customers may be affected and provide response plans.',
        },
        {
            key: '3',
            text: 'If there is abnormal typhoon weather in Shenzhen next week, please analyze potential marketing opportunities.',
        }
    ]
}
export const data = {
    1: {
        question: 'Customer complaints in multiple districts of Shenzhen have surged over the past week. Please analyze the root causes and provide response plans.',
        flow: {
            nodes: [
                { id: 'node-1', data: { label: 'Customer' }, style: { x: 115, y: 80 } },
                { id: 'node-2', data: { label: 'Customer Complaint' }, style: { x: 115, y: 230 } },
                { id: 'node-3', data: { label: 'Power Line' }, style: { x: 115, y: 380 } },
                { id: 'node-4', data: { label: 'Base Station' }, style: { x: 115, y: 530 } },
                { id: 'node-5', data: { label: 'Employee' }, style: { x: 115, y: 680 } }
            ],
            edges: [
                { source: 'node-1', target: 'node-2' },
                { source: 'node-2', target: 'node-3' },
                { source: 'node-3', target: 'node-4' },
                { source: 'node-4', target: 'node-5' },
            ]
        },
        answer: [
            {
                type: 'think-pre',
                data: `Understood. To analyze the surge in customer complaints in Shenzhen and provide response plans, I will access the "Abnormal Weather Analysis" ontology:

Step 1: Retrieve "Customer" object for the list of customers in Shenzhen who complained last week.

Step 2: Retrieve "Customer Complaint" object for districts, categories, and content. Analyze dissatisfaction factors based on history.

Step 3: Retrieve related object data to verify anomalies and formulate response plans.

Step 4: Retrieve "Employee" object for area leads and provide suggested scripts.`
            },
            {
                type: 'text',
                data: 'List of customers with complaints in Shenzhen last week:'
            },
            {
                type: 'table',
                data: {
                    columns: [
                        { dataIndex: '1', title: 'Customer Name', width: 230 },
                        { dataIndex: '2', title: 'Type', width: 180 },
                        { dataIndex: '3', title: 'Phone No.', width: 180 },
                        { dataIndex: '4', title: 'City', width: 160 },
                        { dataIndex: '5', title: 'District', width: 160 },
                        { dataIndex: '6', title: 'Complaint Content', width: 750 },
                        { dataIndex: '7', title: 'Complaint Time', width: 180 },
                        { dataIndex: '8', title: 'Complaint Type', width: 180 }
                    ],
                    data: [
                        { 1: 'Wang*Ming', 2: 'Individual', 3: '138****5678', 4: 'Shenzhen', 5: 'Nanshan', 6: 'Frequent 5G to 4G drops in Tech Park; noise and disconnection during calls.', 7: '2026/3/29 14:22', 8: 'Network & Comm. Quality' },
                        { 1: 'Shenzhen Hua* Tech Co., Ltd.', 2: 'Enterprise', 3: '150****1234', 4: 'Shenzhen', 5: 'Futian', 6: 'Business leased line unstable for 3 days; severe impact on online meetings and file transfer.', 7: '2026/3/28 10:15', 8: 'Network & Comm. Quality' },
                        { 1: 'Zhang*Wei', 2: 'Individual', 3: '159****4321', 4: 'Shenzhen', 5: "Bao'an", 6: 'High latency in home broadband during peaks; games drop often. Issue persists after repair visit.', 7: '2026/3/27 19:30', 8: 'Network & Comm. Quality' },
                        { 1: 'Zhou*Jie', 2: 'Individual', 3: '139****1122', 4: 'Shenzhen', 5: 'Longhua', 6: 'Very weak signal in industrial zone; often cannot connect calls. Requesting base station addition.', 7: '2026/3/25 10:05', 8: 'Network & Comm. Quality' },
                        { 1: 'Shenzhen Guangming* Restaurant', 2: 'Enterprise', 3: '158****3344', 4: 'Shenzhen', 5: 'Nanshan', 6: 'IoT cards for ordering system unstable; intermittent connection affecting dining experience.', 7: '2026/3/24 12:30', 8: 'Network & Comm. Quality' },
                        { 1: 'Hu*Yu', 2: 'Individual', 3: '156****1920', 4: 'Shenzhen', 5: 'Futian', 6: 'Under 5G, download speeds far below advertised peak; multiple tests failed standards.', 7: '2026/3/26 18:05', 8: 'Network & Comm. Quality' },
                        { 1: 'Shenzhen Nan* Education Training Center', 2: 'Enterprise', 3: '137****2122', 4: 'Shenzhen', 5: "Bao'an", 6: 'Broadband for online teaching lags frequently during live streams; students complain unclear audio.', 7: '2026/3/25 16:50', 8: 'Network & Comm. Quality' },
                        { 1: 'Huang* Tech (Shenzhen) Co., Ltd', 2: 'Enterprise', 3: '135****7890', 4: 'Shenzhen', 5: 'Longhua', 6: '5G indoor distribution in industrial park extremely poor; basically no signal in workshops.', 7: '2026/3/28 9:30', 8: 'Network & Comm. Quality' },
                        { 1: 'Liu*', 2: 'Individual', 3: '188****4567', 4: 'Shenzhen', 5: 'Nanshan', 6: 'Total signal loss on parts of subway line; cannot make calls or use mobile data.', 7: '2026/3/27 15:45', 8: 'Network & Comm. Quality' },
                        { 1: 'Chen*Fang', 2: 'Individual', 3: '177****3345', 4: 'Shenzhen', 5: 'Futian', 6: 'Gigabit broadband installed, actual speed only ~300Mbps. Unresolved after multiple reports.', 7: '2026/3/26 11:20', 8: 'Network & Comm. Quality' },
                        { 1: 'Sun*', 2: 'Individual', 3: '199****6677', 4: 'Shenzhen', 5: "Bao'an", 6: 'Extremely poor signal inside mall; no service at all, posing safety risks.', 7: '2026/3/29 16:10', 8: 'Network & Comm. Quality' },
                        { 1: 'Futian District Li* Dept Store', 2: 'Enterprise', 3: '151****8899', 4: 'Shenzhen', 5: 'Longhua', 6: 'Fiber line for cashier system drops frequently during peak hours, affecting transactions.', 7: '2026/3/23 13:15', 8: 'Network & Comm. Quality' },
                        { 1: 'He*Xin', 2: 'Individual', 3: '183****1516', 4: 'Shenzhen', 5: 'Nanshan', 6: 'No mobile signal in residential underground parking; cannot call for help in emergencies.', 7: '2026/3/28 8:45', 8: 'Network & Comm. Quality' },
                        { 1: 'Wu*', 2: 'Individual', 3: '132****2233', 4: 'Shenzhen', 5: 'Futian', 6: 'Office Wi-Fi and mobile network switch frequently, leading to constant video conference drops.', 7: '2026/3/27 14:20', 8: 'Network & Comm. Quality' },
                        { 1: 'Shenzhen Longhua* Manufacturing Factory', 2: 'Enterprise', 3: '134****4455', 4: 'Shenzhen', 5: "Bao'an", 6: 'Workshop IoT devices frequently go offline due to unstable network, affecting production monitoring.', 7: '2026/3/26 10:30', 8: 'Network & Comm. Quality' },
                        { 1: 'Lin*', 2: 'Individual', 3: '187****6677', 4: 'Shenzhen', 5: 'Longhua', 6: 'Full 5G bars in commercial center but cannot access internet; extremely poor experience.', 7: '2026/3/25 12:15', 8: 'Network & Comm. Quality' },
                        { 1: 'Zhao*Qiang', 2: 'Individual', 3: '189****7788', 4: 'Shenzhen', 5: 'Nanshan', 6: 'Incomplete signal coverage in residential complex; need to go to window/balcony to call.', 7: '2026/3/24 9:20', 8: 'Network & Comm. Quality' },
                        { 1: 'Li*Fang', 2: 'Individual', 3: '185****8765', 4: 'Shenzhen', 5: 'Futian', 6: 'New 5G plan advertised 100GB high-speed data, but severely throttled after 20GB.', 7: '2026/3/28 16:50', 8: 'Poor Plan Experience' },
                        { 1: 'Liu*Xia', 2: 'Individual', 3: '135****3456', 4: 'Shenzhen', 5: "Bao'an", 6: 'Changed plan on official app; successful operation but charged twice consecutively.', 7: '2026/3/27 11:08', 8: 'Online Channel Issues' },
                        { 1: 'Shenzhen Qianhai Chuang* Trade Co., Ltd', 2: 'Enterprise', 3: '177****6543', 4: 'Shenzhen', 5: 'Longhua', 6: 'Company landline cannot receive calls; customers report constant busy signal. Persisted for two days.', 7: '2026/3/26 9:45', 8: 'Others' }
                    ],
                    pagination: true
                }
            },
            {
                type: 'text',
                data: 'Distribution of complaint types:'
            },
            {
                type: 'img-pie',
                data: {
                    title:'Types of Complaints',
                    data:[
                        {name:'Network & Comm. Quality',value:'85%',color:'#3B82FF'},
                        {name:'Poor Plan Experience',value:'5%',color:'#FFC253'},
                        {name:'Online Channel Issues',value:'5%',color:'#25DFFB'},
                        {name:'Others',value:'5%',color:'#DF23FE'}
                    ]
                }
            },
            
            {
                type: 'text',
                data: 'Statistics show over 85% of complaints were due to communication and network anomalies, mainly caused by base station or power failures. Abnormal base station data found:'
            },
            {
                type: 'table',
                data: {
                    columns: [
                        {
                            dataIndex: '1',
                            title: 'Base Station ID'
                        },
                        {
                            dataIndex: '2',
                            title: 'Base Station Name'
                        },
                        {
                            dataIndex: '3',
                            title: 'Base Station Type'
                        },
                        {
                            dataIndex: '4',
                            title: 'Base Station Address',
                            width: 300,
                        },
                        {
                            dataIndex: '5',
                            title: 'Abnormality Reason',
                            width: 200,
                        }
                    ],
                    data: [
                        {
                            1: 'SZ-CT-001',
                            2: 'Shenzhen**Base Station',
                            3: '5G',
                            4: 'No.*, *Rd, Nanshan Dist, Shenzhen, Guangdong',
                            5: 'Equipment & Hardware Failure'
                        },
                        {
                            1: 'SZ-CT-018',
                            2: 'Shenzhen**Base Station',
                            3: '5G',
                            4: 'No.*, *Rd, Nanshan Dist, Shenzhen, Guangdong',
                            5: 'Equipment & Hardware Failure'
                        },
                        {
                            1: 'SZ-CT-001',
                            2: 'Shenzhen**Base Station',
                            3: '5G',
                            4: 'No.*, *Rd, Bao\'an Dist, Shenzhen, Guangdong',
                            5: 'Equipment & Hardware Failure'
                        },
                        {
                            1: 'SZ-CT-009',
                            2: 'Shenzhen**Base Station',
                            3: '5G',
                            4: 'No.*, *Rd, Longhua Dist, Shenzhen, Guangdong',
                            5: 'Equipment & Hardware Failure'
                        }
                    ]
                }
            },
            {
                type: 'text-light',
                data: 'Response plans are as follows:'
            },
            {
                type: 'text-700',
                data: '1. Base Station Maintenance'
            },
            {
                type: 'text-16',
                data: 'Retrieve area leads for abnormal stations and dispatch tickets.'
            },
            {
                type: 'table',
                data: {
                    columns: [
                        {
                            dataIndex: '1',
                            title: 'Suggested Maintenance Time',
                            width: 180,
                        },
                        {
                            dataIndex: '2',
                            title: 'Base Station ID',
                            width: 180,
                        },
                        {
                            dataIndex: '3',
                            title: 'Base Station Name',
                            width: 180,
                        },
                        {
                            dataIndex: '4',
                            title: 'Base Station Type',
                            width: 120,
                        },
                        {
                            dataIndex: '5',
                            title: 'Base Station Address',
                            width: 300,
                        },
                        {
                            dataIndex: '6',
                            title: 'Maintenance Staff',
                            width: 180,
                        },
                        {
                            dataIndex: '7',
                            title: 'Contact No.',
                            width: 180,
                        }
                    ],
                    data: [
                        {
                            1: '2026/3/30',
                            2: 'SZ-CT-001',
                            3: 'Shenzhen**Base Station',
                            4: '5G',
                            5: 'No.*, *Rd, Nanshan Dist, Shenzhen, Guangdong',
                            6: 'Xu*Dong',
                            7: '133****2346'
                        },
                        {
                            1: '2026/3/30',
                            2: 'SZ-CT-018',
                            3: 'Shenzhen**Base Station',
                            4: '5G',
                            5: 'No.*, *Rd, Nanshan Dist, Shenzhen, Guangdong',
                            6: 'Li*Liang',
                            7: '133****4312'
                        },
                        {
                            1: '2026/3/30',
                            2: 'SZ-CT-001',
                            3: 'Shenzhen**Base Station',
                            4: '5G',
                            5: 'No.*, *Rd, Bao\'an Dist, Shenzhen, Guangdong',
                            6: 'Zhang*',
                            7: '133****5567'
                        },
                        {
                            1: '2026/3/30',
                            2: 'SZ-CT-009',
                            3: 'Shenzhen**Base Station',
                            4: '5G',
                            5: 'No.*, *Rd, Longhua Dist, Shenzhen, Guangdong',
                            6: 'Zhang*',
                            7: '133****9788'
                        }
                    ]
                }
            },
            {
                type: 'text-700',
                data: '2. Customer Reassurance'
            },
            {
                type: 'text-detail',
                data: [{
                    title: 'For Public Customers',
                    content: 'Conduct return visits via SMS or phone to confirm network restoration and reassure them.',
                    details: [
                        {
                            title: '1) Content',
                            data: 'Dear Customer, the city\'s network is fully restored. We apologize for the inconvenience and thanks for your comprehension. We will continue to ensure network reliability and provide better service.'
                        },
                        {
                            title: '2) Recipients',
                            data: '138****5678, 159****4321, 139****1122, 156****1920, 188****4567, 177****3345, 199****6677, 183****1516, 132****2233, 187****6677...'
                        }
                    ]
                }, {
                    title: 'For High-Value Gov/Enterprise',
                    content: 'Recommend phone or on-site visits by account managers. List:',
                }]
            },
            {
                type: 'table',
                data: {
                    columns: [
                        {
                            dataIndex: '1',
                            title: 'Account Manager',
                            width: 180,
                        },
                        {
                            dataIndex: '2',
                            title: 'Contact No.',
                            width: 200,
                        },
                        {
                            dataIndex: '3',
                            title: 'Managed Enterprise Customers',
                            width: 400,
                        }
                    ],
                    data: [
                        {
                            1: 'Zhang*',
                            2: '138****1001',
                            3: 'Shenzhen Hua* Tech Co., Ltd., Shenzhen Guangming* Restaurant'
                        },
                        {
                            1: 'Wang*',
                            2: '139****2002',
                            3: 'Shenzhen Nan* Education Training Center, Huang* Tech (Shenzhen) Co., Ltd.'
                        },
                        {
                            1: 'Li*',
                            2: '136****3003',
                            3: 'Futian District Li* Dept Store, Shenzhen Longhua* Manufacturing Factory'
                        },
                        {
                            1: 'Zhao*',
                            2: '137****4004',
                            3: 'Shenzhen Qianhai Chuang* Trade Co., Ltd.'
                        }
                    ]
                }
            },


        ]
    },
    2: {
        question: 'We will shut down base stations in Nanshan District, Shenzhen for maintenance this week. Please analyze which customers may be affected and provide response plans.',
        flow: {
            nodes: [
                { id: 'node-1', data: { label: 'Base Station' }, style: { x: 115, y: 80 } },
                { id: 'node-2', data: { label: 'Address' }, style: { x: 115, y: 230 } },
                { id: 'node-3', data: { label: 'Customer' }, style: { x: 115, y: 380 } }
            ],
            edges: [
                { source: 'node-1', target: 'node-2' },
                { source: 'node-2', target: 'node-3' },
            ]
        },
        answer: [
            {
                type: 'think-pre',
                data: `Understood. To analyze the impact of base station maintenance in Nanshan District, Shenzhen this week and provide plans, I will access the "Abnormal Weather Analysis" ontology:

Step 1: Retrieve "Base Station" data for the list in Nanshan District.

Step 2: Retrieve "Address" data for their specific areas and streets.

Step 3: Retrieve "Customer" data for the coverage list.

Step 4: Provide suggested plans.`
            },
            {
                type: 'text',
                data: 'List of base stations and locations in Nanshan District:'
            },
            {
                type: 'table',
                data: {
                    columns: [
                        {
                            dataIndex: '1',
                            title: 'Base Station ID'
                        },
                        {
                            dataIndex: '2',
                            title: 'Base Station Name'
                        },
                        {
                            dataIndex: '3',
                            title: 'Base Station Type'
                        },
                        {
                            dataIndex: '4',
                            title: 'Base Station Address',
                            width: 300
                        }
                    ],
                    data: [
                        {
                            1: 'SZ-CT-101',
                            2: 'Shenzhen Nanshan Sci-Tech Park Base Station',
                            3: '5G Macro Base Station',
                            4: 'No. 18, Keji South Rd, Nanshan Dist, Shenzhen'
                        },
                        {
                            1: 'SZ-CT-205',
                            2: 'Shenzhen Nanshan University Town Base Station',
                            3: '4G/5G Hybrid Base Station',
                            4: 'No. 33, Liuxian Blvd, Nanshan Dist, Shenzhen'
                        },
                        {
                            1: 'SZ-CT-312',
                            2: 'Shenzhen Nanshan Houhai Base Station',
                            3: '5G Micro Base Station',
                            4: 'No. 66, Houhai Blvd, Nanshan Dist, Shenzhen'
                        },
                        {
                            1: 'SZ-CT-427',
                            2: 'Shenzhen Nanshan Shekou Base Station',
                            3: '5G Macro Base Station',
                            4: 'No. 88, Shekou Ind. 8th Rd, Nanshan Dist, Shenzhen'
                        },
                        {
                            1: 'SZ-CT-538',
                            2: 'Shenzhen Nanshan OCT Base Station',
                            3: '5G Indoor Distribution',
                            4: 'No. 9009, Shennan Blvd, Nanshan Dist, Shenzhen'
                        },
                        {
                            1: 'SZ-CT-619',
                            2: 'Shenzhen Nanshan Qianhai Base Station',
                            3: '5G Macro Base Station',
                            4: 'No. 199, Qianhai 1st Rd, Nanshan Dist, Shenzhen'
                        }
                    ]
                }
            },
            {
                type: 'text',
                data: 'List of customers active in these areas:'
            },
            {
                type: 'table',
                data: {
                    columns: [
                        {
                            dataIndex: '1',
                            title: 'Customer Name'
                        },
                        {
                            dataIndex: '2',
                            title: 'Contact No.'
                        },
                        {
                            dataIndex: '3',
                            title: 'Customer Type'
                        }
                    ],
                    data: [
                        { 1: 'Wang*Ming', 2: '138****5678', 3: 'Individual Customer' },
                        { 1: 'Shenzhen Shihua* Tech Co., Ltd.', 2: '150****1234', 3: 'Enterprise Customer' },
                        { 1: 'Li*Fang', 2: '185****8765', 3: 'Individual Customer' },
                        { 1: 'Zhang*Wei', 2: '159****4321', 3: 'Individual Customer' },
                        { 1: 'Shenzhen Qianhai Chuang* Trade Co., Ltd', 2: '177****6543', 3: 'Enterprise Customer' },
                        { 1: 'Liu*Xia', 2: '135****3456', 3: 'Individual Customer' },
                        { 1: 'Zheng* Enterprise Services (Shenzhen) Co., Ltd.', 2: '189****9900', 3: 'Enterprise Customer' },
                        { 1: 'Zhou*Jie', 2: '139****1122', 3: 'Individual Customer' },
                        { 1: 'Huang* Tech (Shenzhen) Co., Ltd', 2: '135****7890', 3: 'Enterprise Customer' }
                    ]
                }
            },
            {
                type: 'text-light',
                data: 'Formulated response plans are as follows:'
            },
            {
                type: 'text-700',
                data: '1. Pre-event Warning SMS'
            },
            {
                type: 'text-16',
                data: 'Send warnings to affected users about potential risks and duration, providing official status channels to relieve service pressure.'
            },
            // {
            //     type: 'text-detail',
            //     data: [{
            //       //  title: '发送短信内容',
            //       //  content: '通过短信或电话方式回访，说明通信和网络已恢复正常，安抚客户情绪。',
            //         details: [
            //             {
            //                 title: '1) Content',
            //                 data: 'Friendly Reminder: Due to maintenance in parts of Nanshan District from 2026-03-23 to 2026-03-29, signal anomalies may occur in: Keji South Rd, Liuxian Blvd, Houhai Blvd... We will restore signal ASAP and notify you. Thank you for your understanding.'
            //             },
            //             {
            //                 title: '2) Recipients',
            //                 data: '138****5678, 150****1234, 185****8765, 159****4321, 177****6543, 135****3456, 189****9900, 139****1122, 135****7890...'
            //              }
            //         ]
            //     }]
            // },
            {
                type: 'text-500-fff',
                data: '1) Content'
            },
            {
                type: 'text-500',
                data: 'Friendly Reminder: Due to maintenance in parts of Nanshan District from 2026-03-23 to 2026-03-29, signal anomalies may occur in: Keji South Rd, Liuxian Blvd, Houhai Blvd... We will restore signal ASAP and notify you. Thank you for your understanding.'
            },
            {
                type: 'text-500-fff',
                data: '2) Recipients'
            },
            {
                type: 'text-500',
                data: '138****5678, 150****1234, 185****8765, 159****4321, 177****6543, 135****3456, 189****9900, 139****1122, 135****7890...'
            },
            {
                type: 'text-700',
                data: '2. Customer Service & Support'
            },
            {
                type: 'text-16',
                data: 'Standardize customer service scripts: "Hello, we understand your anxiety. We are currently performing maintenance in parts of Nanshan District, expecting restoration by month-end. We will notify you immediately upon recovery. Thank you for your support!"'
            },
            {
                type: 'text-700',
                data: 'Customer Service Duty Roster:'
            },
            {
                type: 'table',
                data: {
                    columns: [
                        {
                            dataIndex: '1',
                            title: 'Shift Name'
                        },
                        {
                            dataIndex: '2',
                            title: 'Work Hours'
                        },
                        {
                            dataIndex: '3',
                            title: 'Core Tasks'
                        },
                        {
                            dataIndex: '4',
                            title: 'Customer Service Staff',
                            width: 320
                        }
                    ],
                    data: [
                        {
                            1: 'Reinforced Morning Shift (Shift A)',
                            2: '06:30 - 14:30',
                            3: 'Handle backlog calls from early morning; prepare for the all-day peak.',
                            4: 'Zhang Xuan, Li Rui, Wang Han, Liu Chen, Chen Xi, Yang Ning, Zhao Yang, Huang Yi, Zhou Jie, Wu Lin...'
                        },
                        {
                            1: 'Core Mid-Shift (Shift B)',
                            2: '14:30 - 22:30',
                            3: 'Cover evening peak hours; handle night network inquiries and complaints.',
                            4: 'Xu Hao, Sun Yue, Hu Feng, Zhu Na, Gao Ning, Lin Jing, He Tao, Guo Lin, Ma Chao, Luo Wen...'
                        },
                        {
                            1: 'Emergency Night Shift (Shift C)',
                            2: '22:30 - 06:30',
                            3: 'Handle urgent fault reports; sort the issue list for the next morning shift.',
                            4: 'Liang Xin, Song Hang, Zheng Yao, Xie Ming, Feng Xue, Deng Kai, Cao Juan, Peng Liang, Zeng Min, Lu Xin, Su Qing...'
                        },
                        {
                            1: 'Flexible Support Shift (Shift D)',
                            2: 'On-demand based on volume',
                            3: 'Composed of off-duty staff and logistics support; deployed in real-time to respond to call surges.',
                            4: 'Lu Hao, Jiang Fei, Cai Heng, Jia Wen, Ding Lei, Wei Qi, Cheng Yuan, Shen Wei, Tang Xin...'
                        }
                    ]
                }
            },
            {
                type: 'text-700',
                data: '3. Post-Event Customer Care'
            },
            {
                type: 'text-16',
                data: 'Conduct return visits via SMS or phone to confirm network restoration and reassure customers.'
            },
            {
                type: 'text-500-fff',
                data: '1) Content'
            }, 
            {
                type: 'text-500',
                data: 'Dear Customer, Nanshan District maintenance is complete; the network is fully restored. We apologize for any inconvenience caused by signal interruptions. As a token of apology, we have gifted 10GB of general data (valid 30 days) to your account. Thank you for your support.'
            },
            {
                type: 'text-500-fff',
                data: '2) Recipients'
            }, 
            {
                type: 'text-500',
                data: '138****5678, 150****1234, 185****8765, 159****4321, 177****6543, 135****3456, 189****9900, 139****1122, 135****7890...'
            },
        ]
    },
    3:{
        question: 'If there is abnormal typhoon weather in Shenzhen next week, please analyze potential marketing opportunities.',
        flow: {
            nodes: [
                { id: 'node-1', data: { label: 'Weather' }, style: { x: 115, y: 80 } },
                { id: 'node-2', data: { label: 'Order' }, style: { x: 115, y: 230 } },
                { id: 'node-3', data: { label: 'Product' }, style: { x: 115, y: 380 } },
                { id: 'node-4', data: { label: 'Customer' }, style: { x: 115, y: 530 } }
            ],
            edges: [
                { source: 'node-1', target: 'node-2' },
                { source: 'node-2', target: 'node-3' },
                { source: 'node-3', target: 'node-4' },
            ]
        }, 
        answer: [
            {
                type: 'think-pre',
                data: `Understood. You want to know potential marketing opportunities if a typhoon hits Shenzhen next week. I will access the "Abnormal Weather Analysis" ontology:
I will share the impact of weather on marketing based on experience history.

Step 1: Retrieve "Weather" for abnormal weather in Shenzhen over the past year and their durations.

Step 2: Retrieve "Order" data to compare purchasing behavior during these periods vs. normal weather, identifying products with higher demand.

Step 3: Retrieve "Product" data for currently active products and find similar ones.

Step 4: Retrieve "Customer" data for customers with similar purchasing behavior.

Step 5: Match products with customers and generate marketing scripts.`
            },
            {
                type: 'text',
                data: 'Experience history shows changes in customer lifestyles and resulting communication needs during typhoons as follows:'
            },
            {
                type: 'table',
                data: {
                    columns: [
                        {
                            dataIndex: '1',
                            title: 'Lifestyle Changes',
                           // width: 320
                        },
                        {
                            dataIndex: '2',
                            title: 'Derived Comm. & Network Needs',
                          //  width: 380
                        }
                    ],
                    data: [
                        {
                            1: 'Activity Space Fixed: Shift from outdoor to strict indoor living; home becomes the sole hub.',
                            2: 'Stability Needs: Sharp rise in demand for home broadband and indoor Wi-Fi signal strength/stability.'
                        },
                        {
                            1: 'Info Access Change: Unable to go out; relying entirely on mobile phones and TV.',
                            2: 'Real-time & High Data Needs: Real-time typhoon updates, gov notices, traffic info. Data usage surge for video, live streams, and news apps.'
                        },
                        {
                            1: 'Work/Study Shift: Work/school suspension; switch to remote work and online classes.',
                            2: 'High-Quality Network Needs: Critical demand for low latency and upload bandwidth for video meetings, cloud desktops, and online education.'
                        },
                        {
                            1: 'Entertainment Focus: Leisure relies entirely on online movies, short videos, and mobile games.',
                            2: 'High Bandwidth & Low Latency: High speed required for 4K/8K streaming and large mobile games to prevent lag.'
                        },
                        {
                            1: 'Social Bonding: Increased frequency of safety check-ins and calls with family/friends (esp. elderly/remote).',
                            2: 'Basic Comms Assurance: Need for stable, clear voice and video calling functions.'
                        }
                    ]
                }
            },
            {
                type: 'text',
                data: 'Based on this, we should offer "solutions" rather than simple sales, providing customer care and support. Recommended products and strategies:'
            },
            {
                type:'bar-chart-en'
            },
            {
                type:'text-light',
                data:'Formulated marketing plans are as follows:'               
            },
            {
                type: 'table',
                data: {
                    columns: [
                        {
                            dataIndex: '1',
                            title: 'Customer Type'
                        },
                        {
                            dataIndex: '2',
                            title: 'Recommended Product'
                        },
                        {
                            dataIndex: '3',
                            title: 'Script (Marketing Pitch)',
                          //  width: 360
                        },
                        {
                            dataIndex: '4',
                            title: 'Customer List',
                          //  width: 260
                        }
                    ],
                    data: [
                        {
                            1: 'Individual Customer',
                            2: 'Free Reconnection Service & Emergency Credit Pack',
                            3: 'During the typhoon, We offer free reconnection services to ensure you stay connected. For emergency top-ups, use the App for one-click service—safer and contact-free.',
                            4: '133****5678, 133****1234, 133****8765, 133****4321, 133****6543, 153****7890, 133****2468...'
                        },
                        {
                            1: 'Individual Customer',
                            2: 'Targeted Data Pack / Daily Data Pack',
                            3: 'Running out of data at home? We recommend the "Typhoon Binge Pack" (App-specific data) or "High-Speed Daily Pack" to meet your entertainment and news needs during the storm.',
                            4: '133****1337, 133****9753, 133****8642, 133****5206, 153****4195, 133****3084, 133****2973...'
                        },
                        {
                            1: 'Individual Customer',
                            2: 'Family Network Upgrade / Video Call Pack',
                            3: 'Worried about family? Upgrade your Family Network for free internal calls, or subscribe to the Video Call Pack to "report safety" face-to-face anytime.',
                            4: '133****1862, 133****0751, 133****9640, 153****8529, 133****7418...'
                        },
                        {
                            1: 'Individual Customer',
                            2: 'Gigabit Broadband Experience / Wi-Fi Signal Boost Service',
                            3: 'Family online causing lag? Try Gigabit Broadband speed-up for free, or book our Smart Home Engineers to optimize full-home Wi-Fi coverage.',
                            4: '133****1234, 133****5678, 133****9876, 133****4321, 133****6543...'
                        },
                        {
                            1: 'Individual Customer',
                            2: 'Mobile HD / ** Video VIP Membership',
                            3: 'Activate Mobile HD or ** Video Membership to enjoy massive movies and sports events, keeping you entertained safely through the typhoon.',
                            4: '133****1234, 133****5678, 133****9876, 133****4321, 133****6543...'
                        },
                        {
                            1: 'Enterprise Customer',
                            2: 'Cloud Space / **Xin Conference Pack',
                            3: 'Work doesn\'t stop. We provide temporary Enterprise Cloud expansion for safe file sharing, and the **Xin HD Conference Pack (100+ users) for remote team collaboration.',
                            4: '132****1337, 177****9753, 130****8642, 133****7531, 133****6420...'
                        }
                    ]
                }
            },
        ]
    }
}