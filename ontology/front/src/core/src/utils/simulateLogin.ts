import axios from 'modo-plugin-common/src/core/src/http';

export default (data) => {
  return axios({
    method: 'post',
    url: '/_api/_/platform/login/?redirect=/designer',
    headers: {
      // 'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: data || {
      userId: 'demo',
      pwd: 'sys'
    }
  }).then((res) => {
  }).catch((e) => {
    console.log(e);
  });
};
