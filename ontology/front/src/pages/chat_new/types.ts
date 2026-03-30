export interface Message {
    id?: string;
    role: 'user' | 'ai';
    content: any;
    answer?: string;
    query?: string;
    timestamp?: string;
    thoughts?:any[];
    thinking?: string;      // 思考过程的文本内容
    status?: 'loading' | 'streaming' | 'completed' | 'error'; // 消息状态
    graphData?:GraphData|null;   //每个对话的graphData
    taskId?:string;
}
//  扩展测试用例字段  
export type TestResultStatus = '部分通过' | '通过' | '部分通过'|'未测试'|'测试中';

export interface TestCase {
    id: string;
     
    question: string;          // 对应“问题”
    
    expectedResult: string;    // 对应“预期结果” (也是 Sider 显示的副标题)
    // 新增字段用于管理表格
    lastResult?: TestResultStatus;
    lastTime?: string;
}

// 左侧列表显示的摘要信息
export interface SessionSummary {
    id: string;
    name: string;
    time?: string;
    user?: string;
    type?:string;
    active?: boolean; // 辅助字段，用于UI渲染
    testCases?:TestCase[]; //测试用例
}

// 完整的会话数据结构
export interface ChatSession {
    id: string;
    summary: SessionSummary;
    type?:0|1,
    messages?: Message[];
    taskGraphData?: any[] | null; // 每个会话独有的图谱记录
    sysPrompt?: string;
    taskId?:string|null;  //每个会话的当前taskID
    isStop?:boolean;  //是否停止状态
}

export interface GraphNode {
    id: string;
    label?: string;
    type?: string;
    size?: number;
    style?: Record<string, any>;
    labelCfg?: Record<string, any>;
    comboId?: string;
    data:any;
}

export interface GraphEdge {
    source: string;
    target: string;
    label?: string;
    style?: Record<string, any>;
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}
