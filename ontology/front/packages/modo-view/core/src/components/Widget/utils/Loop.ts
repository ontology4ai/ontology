export interface LoopInterface {
    isLoading: boolean,
    loading: boolean,
    loadingBindVar: String | null,
    data: String | null,
    dataBindVar: String | null,
    item: string,
    index: string,
    key: string,
    paginationVisible: Boolean,
    disabled: Boolean,
    pagination: any
}

export default class Loop implements LoopInterface {
    isLoading = false;
    loading = false;
    loadingBindVar = null;
    data = null;
    dataBindVar = null;
    item = 'item';
    index = 'index';
    key = 'index';
    paginationVisible =  true;
    disabled = false;
    pagination = {
        style: {
            display: 'block'
        },
        sizeOptions: [10, 20, 30, 40, 50],
        show: true,
        showTotal: true,
        pageSizeChangeResetCurrent: true,
        sizeCanChange: true,
        total: 0,
        pageSize: 20,
        current: 1,
    }
}
