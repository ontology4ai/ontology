import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

// 金库校验
const checkGoldBank = (params: any) =>
  axios.post(`${base}/4a-gateway/goldbank/checkGoldBankToken`, params);

export { checkGoldBank };
