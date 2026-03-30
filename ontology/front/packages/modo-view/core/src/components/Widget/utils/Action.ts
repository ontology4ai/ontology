import BuiltIn, { BuiltInInterface } from './BuiltIn';

export interface ActionInterface {
    builtIn: BuiltInInterface;
    callback: string;
}

export default class Action implements ActionInterface {
	builtIn = new BuiltIn();
    callback = 'function callback() {}'
}
