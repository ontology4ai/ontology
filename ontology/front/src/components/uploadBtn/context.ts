import { createContext, useContext } from 'react';
import type { FormInstance } from '@arco-design/web-react';

export const FormContext = createContext<FormInstance | null>(null);

export const useContextForm = () => {
    const form = useContext(FormContext)!;
    return form;
};
