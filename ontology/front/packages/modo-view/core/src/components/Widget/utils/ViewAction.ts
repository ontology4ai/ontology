export interface ViewActionInterface {
    condition: string;
    showType: string;
    viewName: string | null;
    before: string;
    width: string;
    top: string;
    fullscreen: Boolean;
    size: string;
    tabViewName: string | null;
    tabParams: string;
    tabKey: string;
    tabLabel: string;
}

export default class ViewAction implements ViewActionInterface {
    condition = 'true';
	showType = 'modal';
    viewName = null;
    before = 'function beforeCallback() {}';
    width = '50%';
    top = '15vh';
    fullscreen = false;
    size = '50%';
    tabViewName = null;
    tabParams = '';
    tabKey = '';
    tabLabel = ''
}
