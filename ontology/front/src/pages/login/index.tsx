import React, { useState, useEffect, useMemo } from 'react';
import './style/index.less';
import modoLogo from './images/modo-logo.png';
import loginLeft from './images/app-login-banner.png';
import appLoginBanner from './images/app-login-banner.png';
import appLoginBg from './images/app-login-bg.png';
import {
  Form,Link,
  Input,
  Button,
  Checkbox,
  Drawer,
  Message,
  Notification,
} from '@arco-design/web-react';
import CryptoJS from 'crypto-js';
import { connect } from 'react-redux';
import { useRootJson } from 'modo-plugin-common/src/utils/useRootJson';
import qs from 'qs';
import useClassLocale from 'modo-plugin-common/src/utils/useClassLocale';
import { GlobalContext } from 'modo-plugin-common/src/utils/context';
import locale from './locale';

import {
  LoginSubmitPost,
  getUserExist,
  checkVerifyCode,
  getResetPwdVerifyCode,
  resetPwd,
  getVerifyCode,
  loginAesKey,
} from './api';
import FilterForm from '@/components/FilterForm';
import moment from 'moment';

const FormItem = Form.Item;
let timer: any;
let logoTitle = '';
let logoUrl = '';
let isverifycode: any;
let hiddenLogo: any;
let loginDefaultRedirectUrl = '';

const rootJson = useRootJson();
const mvc_path = 'http://10.19.28.145:9080';
const mvcPath = `${mvc_path}/_api`;

class appLogin extends React.Component {
  constructor(props:any) {
    super(props);
    this.state = {
      drawVisible: false,
      nextStep: 0,
      sendCode: '',
      errorText: '',
      infoData:{
        userId:'',
        pwd:'',
        remember: false,
        code: ''
      },
      drawerForm: {
        userId: '',
        verifyCode: '',
        pwd: ''
      },
      sendCodeDisabled: false,
      sendCodeFirst: true,
      sendTime: 60,
      sendTimeInterval: null,
      isUserPassword: true,
      isUserPasswordMore: true,
      verifyImgSrc: '_api/getPicture.jpeg/',
      isCodeEqual: false
    };
    const { extConf, label } = props.identity; 
    if (extConf) {
      logoTitle = extConf.loginTitle || '墨斗';
      logoUrl = extConf.logoUrl;
      isverifycode = extConf.isverifycode === true;
      hiddenLogo = extConf.hiddenLogo;
      loginDefaultRedirectUrl = extConf.loginDefaultRedirectUrl;
      document.title = extConf.loginTitle || label || '墨斗';
    }
  };

  getAesIvKey = async () => {
    let obj = {
        aesKey:'',
        aesIvKey:''
    };
    await loginAesKey({ "key": "1gsac" }).then((res) => {
        let { data } = res;
        if (data.nonce) {
            let time = moment(new Date()).format('YYYYMMDD');
            let nonce = res.data.nonce;
            let ki = nonce.split(time)[1];
            let ds = ki.split('1gsac');
            const ai = ds[1].substring(0, 16);
            const ak = ds[0];
            obj = {
                aesKey: ak,
                aesIvKey: ai,
            }
        }
    }).catch(err => {
        console.log(err)
    });
    return obj;

};

  aesEncrypt = async (message: any) => {
    const res = await this.getAesIvKey();
   let { aesIvKey, aesKey } = res;
   const ivs = CryptoJS.enc.Utf8.parse(aesIvKey);
   const encrypted = CryptoJS.AES.encrypt(
     message,
     CryptoJS.enc.Utf8.parse(aesKey),
     {
       iv: ivs,
       padding: CryptoJS.pad.Pkcs7,
       mode: CryptoJS.mode.CBC,
     }).toString();
   return encrypted;
   };

  validatorUseId = async (
    value: string,
    cb: { (error?: React.ReactNode): void; (arg0: Error | undefined): void },
  ) => {
    const params = {
      userId: encodeURI(await this.aesEncrypt(this.state.drawerForm.userId.trim())),
    };
    if (!value || value.trim().length < 0) {
      cb(`${this.userT('请输入账号')}`);
      return
    }
    await getUserExist(params)
      .then(res => {
        if (res.data.data === true) {
          cb();
          return;
        }
        cb(`${this.userT('用户不存在!')}`);
      })
      .catch(e => {
        cb(`${this.userT('用户校验失败!')}`);
      });
  };

  validatorVerifyCode = async (
    value: string,
    cb: { (error?: React.ReactNode): void; (arg0: Error | undefined): void },
  ) => {
    console.log('value', value);
    if (!value || value?.trim().length <= 0) {
      cb(`${this.userT('请输入验证码')}`);
      return;
    }
    const temp = value?.trim();
    if (temp.length !== 4) {
      cb(`${this.userT('长度为4个字符')}`);
        return;
    }
  };

  validatorPassword = (
    value: string,
    cb: { (error?: React.ReactNode): void; (arg0: Error | undefined): void },
  ) => {
    if (value) {
      const reg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (reg.test(value)) {
        cb();
      } else {
        cb(new Error(`${this.userT('长度至少为8,包含大小写字母、数字和特殊字符')}`));
      }
    } else {
      cb(new Error(`${this.userT('长度至少为8,包含大小写字母、数字和特殊字符')}`));
    }
  };

  getPicuture = () => {
    const stime = new Date().getTime();
    this.setState({ verifyImgSrc: `_api/getPicture.jpeg/?${stime}` });
  };

  reloadCheckCode = () => {
    this.getPicuture();
    this.setState({ isCodeEqual: false });
  };

  submitSuccess = (data: any) => {
    const tdata = data;
    if (tdata.success) {
      // Message.success(`${this.userT('登录成功')}`);
      this.rememberClick();
      const { redirectUri } = qs.parse(window.location.search.substring(1));
      const { appName } = this.props.match.params;
      if (redirectUri && 0) {
        window.location.href = redirectUri;
      } else if(loginDefaultRedirectUrl) {
            window.location.href = loginDefaultRedirectUrl
          } else {
            window.location.href = `/${appName}/frame`
          }
      (async vm => {
        Message.success(`${this.userT('登录成功')}`);
      })(this);
    } else {
      this.setState({ isUserPassword: false });
      this.loginForm.setFieldValue('infoData.userId', '');
      this.loginForm.setFieldValue('infoData.pwd', '');
      Message.error(`${this.userT(tdata.message)}`);
      this.reloadCheckCode();
    }
  };

  loginSubmit = (paras: any) => {
    LoginSubmitPost(paras)
        .then(response => {
          const { data } = response;
          this.submitSuccess(data);
        })
        .catch(err => {
          console.log(err);
        });
  };

  // 登录
  loginClick = async () => {
    this.setState({ isUserPasswordMore: true, isUserPassword: true });
    const _self = this;
    if (isverifycode) {
      (async function verifyCode(self) {
        // const formLoginData = _self.loginForm.getFieldsValue();
        // const params = { checkcode: formLoginData.infoData.code };
        // await getVerifyCode(qs.stringify(params))
        //   .then((response: { data: { data: any } }) => {
        //     const tdata = response.data.data;
        //     if (tdata.comparecode) {
        //       _self.setState({isCodeEqual: true})
        //     } else {
        //       _self.setState({isCodeEqual: false})
        //     }
        //   })
        //   .catch((error: any) => {
        //     console.log(error);
        //     _self.setState({isCodeEqual: false})
        //   });
        //   if (!_self.state.isCodeEqual) {
        //     _self.loginForm.setFieldValue('infoData.code', '');
        //   };
        _self.loginForm.validate(async (errors, values) => {
            console.log('cc',errors, values);
          if (!errors) {
            const [encUserId, encPwd] = await Promise.all([
              _self.aesEncrypt(values.infoData.userId),
              _self.aesEncrypt(values.infoData.pwd),
            ]);
            const paras = {
              userId: encUserId,
              pwd: encPwd,
              callback: 'none',
              checkcode: values.infoData.code,
            };
              _self.loginSubmit(paras);
          }
        });
      })(this);
    } else {
      _self.loginForm.validate(async (errors, values) => {
        console.log('values', values);
        if (!errors) {
          const [encUserId, encPwd] = await Promise.all([
            _self.aesEncrypt(values.infoData.userId),
            _self.aesEncrypt(values.infoData.pwd),
          ]);
          const paras = {
            userId: encUserId,
            pwd: encPwd,
            callback: 'none',
          };
          _self.loginSubmit(paras);
        }
      });
    }
  };

  openClick = () => {
    this.setState({ drawVisible: true, sendTime: 60, sendCodeDisabled: false });
    clearInterval(timer);
  };

  closeClick = () => {
    this.setState({ drawVisible: false, nextStep: 0 });
    this.drawerForm.resetFields();
  };

  // 下一步
  nextClick = async () => {
    try {
      await this.drawerForm.validate();
      if (this.state.nextStep == 0) {
        this.setState({ nextStep: this.state.nextStep + 1 });
      } else if (this.state.nextStep == 1) {
        this.setState({ nextStep: this.state.nextStep + 1 });
      } else if (this.state.nextStep == 2) {
        const params = {
          userId: encodeURI(this.aesEncrypt(this.state.drawerForm.userId)),
          verifyCode: this.state.drawerForm.verifyCode,
          pwd: encodeURI(this.aesEncrypt(this.state.drawerForm.pwd)),
          type: '3',
        };
        resetPwd(params)
          .then(res => {
            if (res.data.success) {
              Notification.success({ title: `${this.userT('成功')}`, content: res.data.message });
              this.closeClick();
            } else {
              Notification.error({ title: `${this.userT('失败')}`, content: res.data.message });
            }
          })
          .catch(error => {
            Notification.error({
              title: `${this.userT('失败')}`,
              content: `${this.userT('重置密码失败')}`,
            });
          });
      }
    } catch (e) {
      Notification.error({
        title: `${this.userT('失败')}`,
        content: `${this.userT('重置密码失败')}`,
      });
    }
  };
  onValuesChange = (changeValue: any, values: any) => {
    if (values) {
      this.setState({ infoData: { ...this.state.infoData, ...values.infoData } });
    }
  };

  onFormValuesChange = (changeValue: any, values: any) => {
    if (values.data) {
      this.setState({ drawerForm: { ...this.state.drawerForm, ...values.data } });
    }
  };
  linkClick = (url) =>{
    window.open(url, '_blank', )
  }
  rememberClick = () => {
    const formLoginData = this.loginForm.getFieldsValue();
    if (formLoginData.infoData.remember) {
      localStorage.setItem('loginUserId', formLoginData.infoData.userId);
      localStorage.setItem('loginPassword', formLoginData.infoData.pwd);
    } else {
      localStorage.removeItem('loginUserId');
      localStorage.removeItem('loginPassword');
      }
  };

  handleSendCode = () => {
    const { sendCodeDisabled } = this.state;
    if (sendCodeDisabled) {
      return;
    }
    this.setState({ sendCodeDisabled: true, sendTime: 60 }, () => {
      timer = setInterval(() => {
          this.setState({ sendTime: this.state.sendTime - 1 });
          if (this.state.sendTime === 0) {
            clearInterval(timer);
            this.setState({ sendCodeDisabled: false, sendCodeFirst: false });
          }
        }, 1000);
        const params = {
          userId: this.aesEncrypt(this.state.drawerForm.userId),
        };
        getResetPwdVerifyCode(params)
        .then(res => {
          if (res.data.success) {
            Message.success(`${this.userT('发送验证码成功!')}`);
          }else {
            Message.error(`${this.userT('发送验证码失败!')}`);
          }
        }).catch(e => {
          Message.error(`${this.userT('发送验证码失败!')}`);
        });
    });
  };

  getUserPassword = () => {
    const userId = localStorage.getItem('loginUserId');
    if (userId && userId.length > 0) {
      this.setState({ infoData: { userId: userId } });
    }
    const password = localStorage.getItem('loginPassword');
    if (password && password.length > 0) {
      this.setState({ infoData: { pwd: password } });
    }
    if (userId && userId.length > 0 && password && password.length > 0) {
      this.setState({ infoData: { remember: true } });
    }
  };

  getImgUrl = () => {
    if (logoUrl) {
      return rootJson.rootPath + logoUrl;
    }
    return modoLogo;
  };

  componentDidMount() {
    sessionStorage.setItem('MENUACTIVE', '33149f9c1318487d');
    this.getUserPassword();
  }
    render() {
    const t = useClassLocale(this.context); // 使用全局语言
    const userT = useClassLocale(this.context, locale); // 使用组件个性化语言
    this.userT = userT;
    let formItemContent = null;
    const {
      nextStep,
      sendCodeDisabled,
      errorText,
      drawVisible,
      sendCodeFirst,
      sendTime,
      infoData,
      verifyImgSrc,
    } = this.state;
    switch (nextStep) {
      case 0:
        formItemContent = (
          <div>
            <Form.Item
              label={userT('请输入账号')}
              field="data.drawerForm.userId"
              required
              rules={[{ validator: (value, cb) => this.validatorUseId(value, cb) }]}
            >
              <Input placeholder={userT('请输入账号')} />
            </Form.Item>
          </div>
        );
        break;
      case 1:
        formItemContent = (
          <div style={{ position: 'relative' }}>
            <Form.Item
              label={userT('验证码')}
              field="data.drawerForm.verifyCode"
              rules={[
                {
                  required: true,
                  validator: (value, cb) => this.validatorVerifyCode(value, cb),
                },
              ]}
            >
              <Input placeholder={userT('请输入验证码')} />
            </Form.Item>
            <Button
              type="text"
              className="send-btn"
              onClick={this.handleSendCode}
              disabled={sendCodeDisabled}
            >
              {!sendCodeDisabled && sendCodeFirst && <span>{userT('发送验证码')}</span>}
              {sendCodeDisabled && (
                <span>
                  {userT('重新发送')}
                  {sendTime}
                </span>
              )}
              {!sendCodeDisabled && !sendCodeFirst && <span>{userT('重新发送')}</span>}
            </Button>
          </div>
        );
        break;
      case 2:
        formItemContent = (
          <div>
            <Form.Item
              label={userT('新密码')}
              field="data.drawerForm.pwd"
              rules={[
                {
                  required: true,
                  validator: (value, cb) => this.validatorPassword(value, cb),
                },
              ]}
            >
              <Input placeholder={userT('请输入密码')} />
            </Form.Item>
          </div>
        );
        break;
    }
    return (
      <div className="modo-app-login">
        {!hiddenLogo && <img className="logo" src={this.getImgUrl()} alt="logo" />}
        <img className="bg" src={appLoginBg} />
        <div className={'login-all' + (isverifycode ? ' hasverfiy' : '')}>
          <div className="login-img">
            <img src={loginLeft} alt="" />
          </div>
          <div className="login-dialog">
            <div className="login-info">
              <div className="login-hello">Hello!</div>
              <div className="login-title">
                <span className="login-welcome">{userT('欢迎登录')}</span>
                <span className="login-title-label">{logoTitle}</span>
              </div>
              <Form
                className="login-form"
                onValuesChange={this.onValuesChange}
                ref={ref => (this.loginForm = ref)}
              >
                <FormItem
                  label={userT('账号名称')}
                  required
                  field="infoData.userId"
                  rules={[
                    {
                      required: true,
                      message: `${userT('请输入账号')}`,
                      min: 3,
                      max: 192,
                    },
                  ]}
                >
                  <Input placeholder={userT('请输入账号')} />
                </FormItem>
                <FormItem
                  label={userT('登录密码')}
                  required
                  field="infoData.pwd"
                  rules={[
                    {
                      required: true,
                      message: `${userT('请输入密码')}`,
                      min: 3,
                      max: 192,
                    },
                  ]}
                >
                  <Input placeholder={userT('请输入密码')} type="password" />
                </FormItem>
                {isverifycode && (
                  <>
                    <FormItem
                      label={userT('验证码')}
                      className="form-itm form-itm-pass"
                      field="infoData.code"
                      required
                      rules={[
                        {
                          required: true,
                          validator: (value, cb) => this.validatorVerifyCode(value, cb),
                        },
                      ]}
                    >
                      <Input
                        id="checkcode"
                        className="code-input"
                        placeholder={userT('请输入验证码')}
                      />
                    </FormItem>
                    <div className="verifycode-img">
                      {verifyImgSrc !== undefined && verifyImgSrc !== '' ? (
                        <img id="checkcodeImg" src={verifyImgSrc} onClick={this.reloadCheckCode}></img>
                      ) : (
                        <div className="codeblank" onClick={this.reloadCheckCode}></div>
                      )}
                    </div>
                  </>
                )}
                <FormItem wrapperCol={{ offset: 5 }} field="infoData.remember">
                  <div className='item-remember'>
                      <Checkbox checked={infoData.remember} onChange={this.rememberClick}>
                        {userT('记住密码')}
                      </Checkbox>
                      {this.props.identity?.extConf?.authenticationLogin && <Link hoverable={false} 
                         onClick={()=>this.linkClick(this.props.identity?.extConf?.authenticationLogin)}> 统一认证登陆 </Link>
                      }
                  </div>
                  
                </FormItem>
                <FormItem
                  style={{
                    marginBottom: '0px',
                  }}
                  wrapperCol={{
                    offset: 5,
                  }}
                >
                  <Button htmlType="submit" type="primary" onClick={this.loginClick}>
                    {userT('登录')}
                  </Button>
                  {this.props.identity?.extConf?.loginTrialBtnVisible === '1' ? (
                    <Button className="long-round-btn" style={{ marginTop: '10px' }} onClick={() => {
                      window.open(`http://createuser.trial.asiainfo.com.cn/?appId=10087`)
                    }}>
                      {userT('申请试用')}
                    </Button>
                  ) : ''}
                </FormItem>
                {errorText && (
                  <FormItem>
                    <span style={{ color: '#f53f3f' }}>{errorText}</span>
                  </FormItem>
                )}
              </Form>
              {/* <Button type='text' className="find-password" onClick={this.openClick}> 找回密码 </Button> */}
              <Drawer
                width="60%"
                title={<span>{userT('找回密码')}</span>}
                okText={nextStep < 2 ? `${userT('下一步')}` : `${t('保存')}`}
                visible={drawVisible}
                onOk={this.nextClick}
                onCancel={this.closeClick}
              >
                <Form
                  layout="vertical"
                    ref={(ref) => (this.drawerForm = ref)}
                  onValuesChange={this.onFormValuesChange}
                    className="drawer-form">
                >
                  {formItemContent}
                </Form>
              </Drawer>
            </div>
          </div>
        </div>
      </div>
    );
    }
}
appLogin.contextType = GlobalContext;
export default connect((state, ownProps) => ({
    identity: state.identity,
  }))(appLogin);
