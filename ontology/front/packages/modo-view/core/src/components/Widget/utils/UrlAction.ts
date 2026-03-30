export interface UrlActionInterface {
    url: string | null;
    blank: Boolean;
}

export default class UrlAction implements UrlActionInterface {
    url = null;
    blank = true
}
