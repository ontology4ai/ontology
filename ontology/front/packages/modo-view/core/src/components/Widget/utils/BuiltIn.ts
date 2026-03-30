import ServiceAction, { ServiceActionInterface } from './ServiceAction';
import UrlAction, { UrlActionInterface } from './UrlAction';
import ViewAction, { ViewActionInterface } from './ViewAction';

export interface BuiltInInterface {
    type: string;
    isSingleService: Boolean;
    urlAction: UrlActionInterface;
    viewActions: Array<ViewActionInterface>;
    actions: Array<any>;
}

export default class BuiltIn implements BuiltInInterface {
    type = 'url';
    isSingleService = true;
    urlAction = new UrlAction();
    viewActions = [new ViewAction()];
    actions = []
}
