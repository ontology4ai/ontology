import axios from 'modo-plugin-common/src/core/src/http';
const base = '';

//登录
const LoginSubmitPost = Params => axios.post(`${base}/_api/login/?redirect=/console/home`, Params);

//判断用户名是否存在
const getUserExist = params => axios.get(`${base}/_api/_/modoUser/exist`, {params});

//验证码是否存在
const checkVerifyCode = params => axios.post(`${base}/_api/_/modoUser/checkVerifyCode`, params);

//获取验证码
const getResetPwdVerifyCode = params => axios.get(`${base}/_api/_/modoUser/getResetPwdVerifyCode`, {params});

//保存
const resetPwd = Params => axios.post(`${base}/_api/_/modoUser/resetPwd`, Params);

/* 验证码校验 */
const getVerifyCode = (Params) => {
  return axios.post(`${base}/_api/login.checkcode/`, Params);
};
const aesKey = (params) => {
  return axios.post(`${base}/dataos/api/open/nonce`,params)
};

const loginAesKey = (params) => {
  return axios.post(`${base}/api/open/nonce`,params)
};


export { LoginSubmitPost, getUserExist, checkVerifyCode, getResetPwdVerifyCode, resetPwd, getVerifyCode ,aesKey, loginAesKey};
