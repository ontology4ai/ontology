import axios from 'modo-plugin-common/src/core/src/http';

export default (data, name) => {
  return axios({
    method: 'POST',
    url: '/_api/newrecordService',
    responseType: 'blob',
    data
  }).then(res => {
    if (res && res.data) {
      const fileName = name || '报表.xls';
      if (window.navigator.msSaveOrOpenBlob) {
        navigator.msSaveBlob(blob, fileName);
      } else {
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(res.data);
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(link.href);
      }
    }
  });
}
