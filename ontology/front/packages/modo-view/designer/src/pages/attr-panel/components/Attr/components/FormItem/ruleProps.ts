export interface RulesProps {
    // 触发校验的时机
    validateTrigger?: string | string[];
    // 校验失败时候以 `error` 或 `warning` 形式展示错误信息。当设置为 `warning` 时不会阻塞表单提交
    validateLevel?: 'error' | 'warning';
    required?: boolean;
    type?: string;
    length?: number;
    // Array
    maxLength?: number;
    minLength?: number;
    includes?: boolean;
    deepEqual?: any;
    empty?: boolean;
    // Number
    min?: number;
    max?: number;
    equal?: number;
    positive?: boolean;
    negative?: boolean;
    // Object
    hasKeys?: string[];
    // String
    match?: RegExp;
    uppercase?: boolean;
    lowercase?: boolean;
    // Boolean
    true?: boolean;
    false?: boolean;
    // custom
    validator?: (value, callback: (error?: ReactNode) => void) => void;
    message?: string;
}