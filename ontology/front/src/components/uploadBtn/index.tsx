import React, { useEffect, ReactElement, useState } from 'react';
import { Space, Modal, Form, Button, Upload, Message, Tooltip } from '@arco-design/web-react';
import {
  IconUpload,
  IconDelete,
  IconQuestionCircle,
  IconInfoCircle,
  IconDriveFile,
} from '@arco-design/web-react/icon';
import './style/index.less';
import { checkGoldBank } from './api/index';
// import getContextPath from '@/core/src/utils/getContextPath';
import getContextPath from 'modo-plugin-common/src/core/src/utils/getContextPath';

export interface RulesProps {
  // 触发校验的时机
  validateTrigger?: string | string[];
  // 校验失败时候以 `error` 或 `warning` 形式展示错误信息。当设置为 `warning` 时不会阻塞表单提交
  validateLevel?: 'error' | 'warning';
  required?: boolean;
  type?: string;
  length?: number;
  // Array
  maxLength?: number;
  minLength?: number;
  includes?: boolean;
  deepEqual?: any;
  empty?: boolean;
  // Number
  min?: number;
  max?: number;
  equal?: number;
  positive?: boolean;
  negative?: boolean;
  // Object
  hasKeys?: string[];
  // String
  match?: RegExp;
  uppercase?: boolean;
  lowercase?: boolean;
  // Boolean
  true?: boolean;
  false?: boolean;
  // custom
  validator?: (value: any, callback: () => void) => void;
  message?: string;
}
interface IFileInfo {
  typeCode?: number;
  name?: string;
  value?: string;
  desc?: string;
  loading?: boolean;
  versionName?: string;
  hadoopVersion?: string;
  uploadProps: {
    name: string;
    accept: string;
    type?: number;
  };
  isTooltip?: boolean; // 显示提示信息
  tooltip?: string; // 显示提示信息内容
}
interface IProps {
  label?: string | ReactElement;
  icons?: ReactElement;
  fileInfo: IFileInfo;
  deleteIcon?: boolean; // 显示删除按钮
  view?: boolean;
  rules?: RulesProps[];
  notDesc?: boolean; // 是否显示文件列表，设置为true时不显示，可以自定义文件列表
  formField?: any; // 表单field
  deleteFile?: () => void; // 删除文件
  uploadFile: (file: File, callBack: () => void) => void;
  formRef?: any; // 传入父组件Form表单
  needGoldR?: boolean; // 是否需要金库认证
  isDrag?: boolean; // 是否拖拽上传
  multiple?: boolean; // 是否多文件上传
  disabled?: boolean; // 是否禁止
  showUploadList?: boolean; // 是否显示文件列表 默认为true
  afterGoldR?:()=>void; //金库认证后续行为
}
export const isAcceptFile = (file, accept) => {
  if (accept && file) {
    const accepts = Array.isArray(accept)
      ? accept
      : accept
        .split(',')
        .map(x => x.trim())
        .filter(x => x);
    const fileExtension = file.name.indexOf('.') > -1 ? file.name.split('.').pop() : '';
    return accepts.some(type => {
      const text = type && type.toLowerCase();
      const fileType = (file.type || '').toLowerCase();
      console.log(type, fileType);
      if (text === fileType) {
        // 类似excel文件这种
        // 比如application/vnd.ms-excel和application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
        // 本身就带有.字符的，不能走下面的.jpg等文件扩展名判断处理
        // 所以优先对比input的accept类型和文件对象的type值
        return true;
      }
      if (/\/\*/.test(text)) {
        // image/* 这种通配的形式处理
        return fileType.replace(/\/.*$/, '') === text.replace(/\/.*$/, '');
      }
      if (/..*/.test(text)) {
        // .jpg 等后缀名
        return text === `.${fileExtension && fileExtension.toLowerCase()}`;
      }
      return false;
    });
  }
  return !!file;
};
export function uuidStr(len, radix) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  const uuid = [];
  radix = radix || chars.length;

  if (len) {
    // Compact form
    for (let i = 0; i < len; i++) uuid[i] = chars[0 | (Math.random() * radix)];
  } else {
    // rfc4122, version 4 form
    let r;

    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';

    // Fill in random data. At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (let i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | (Math.random() * 16);
        uuid[i] = chars[i == 19 ? (r & 0x3) | 0x8 : r];
      }
    }
  }

  return uuid.join('');
}
export function randomString(len: any) {
  len = len || 32;
  const $chars = 'ABCDEFGHJKMNPQRSTWXYZLabcdefhijkmnprstwxyzl1234567890';
  const maxPos = $chars.length;
  let pwd = '';
  for (let i = 0; i < len; i++) {
    pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return pwd;
}
export const IsInArray = (arr, val) => {
  const str = `,${arr.join(',')},`;
  return str.indexOf(`,${val},`) != -1;
};
let targetWin: any;
export default function UploadBtn({
  fileInfo,
  uploadFile,
  needGoldR,
  isDrag,
  multiple,
  disabled,
  showUploadList,
  afterGoldR
}: IProps) {
  const uploadRef = React.useRef();
  const [fileList, setFileList] = React.useState([]);
  const [successVisible, setSuccessVisible] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [continueVisible, setContinueVisible] = useState(false);
  const [called, setCalled] = useState(false);
  const [content, setContent] = useState('');
  const operCode = '8|32|44|102|0|-73|-12|14|71'; // 1-AIUAP-20048  操作编码加密
  const operContent = '123'; // 操作内容
  let returnValue: any;
  const uploadFileProps = {
    name: fileInfo.uploadProps.name,
    accept: fileInfo.uploadProps.accept,
    beforeUpload: async (file: File) => {
      await uploadFile(file, () => {
        debugger
        if (needGoldR && isDrag) {
          setContinueVisible(true);
        }
      });
      return false;
    },
    // fileList: [],
  };


  // 点击上传
  const onSubmit = () => {
    setContinueVisible(true);
  };

  const onChange = (_, files: any) => {
    if (_.length > 0) {
      setFileList([files]);
    } else {
      setFileList(_);
    }
  };
  const toJk = () => {
    setTooltipVisible(false);
    setContinueVisible(true);
  };
  const checkJKno = () => {
    setContinueVisible(false);
    setTooltipVisible(true);
  };
  const openWindowWithPostRequest = (iWidth, iHeight, iTop, iLeft, winOption, obj) => {
    const contextPath = getContextPath();
    const winName = randomString(12);
    const env = process.env.NODE_ENV;
    const rootPath = env === 'production' ? '' : '/__modo';
    const winURL = `${rootPath}${contextPath}/4a-gateway/goldbank/openGoldBank?operContent=${operContent}&flaguuid=${obj.flaguuid}`; // 应用对应action地址
    const form = document.createElement('form');
    form.setAttribute('method', 'post');
    form.setAttribute('action', winURL);
    form.setAttribute('target', winName);
    for (const i in obj) {
      if (obj.hasOwnProperty(i)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = i;
        input.value = obj[i];
        form.appendChild(input);
      }
    }
    document.body.appendChild(form);
    // 打开地址，刚开始时，打开一个不存在的地址，这样才有返回值
    targetWin = window.open('about.blank', winName, winOption, '_self');
    form.target = winName;
    form.submit();
    document.body.removeChild(form);
    if (window.focus) {
      targetWin?.focus();
    }
  };
  const checkJKeys = async () => {
    setContinueVisible(false);
    const obj: any = new Object();
    obj.code = operCode;
    obj.name = operContent;
    obj.flaguuid = uuidStr(16, 16);
    console.log('obj', obj);
    const iWidth = 700; // 模态窗口宽度
    const iHeight = 500; // 模态窗口高度
    const iTop = (window.screen.height - iHeight - 100) / 2;
    const iLeft = (window.screen.width - iWidth) / 2;
    const winOption = `height=${iHeight},innerHeight=${iHeight},width=${iWidth},innerWidth=${iWidth},top=${iTop},left=${iLeft},toolbar=no,menubar=no,scrollbars=no,resizeable=no,location=no,status=no`;
    await openWindowWithPostRequest(iWidth, iHeight, iTop, iLeft, winOption, obj);
    await setCalled(true);
  };

  const receiveMsg = async e => {
    returnValue = e.data;
    if (returnValue == 'undefined' && returnValue == '') {
      targetWin?.close();
    } else {
      try {
        const code = returnValue?.split('#');
        const arr = new Array([-3, -2, 1, 2, 5]);
        if (IsInArray(arr, code[0])) {
          let checkNo = '';
          if (code.length > 2) {
            checkNo = code[2];
          }
          const checkParam = {
            operCode: operCode,
            svnCode: code[1],
            bankResult: code[0],
            checkNo: checkNo,
            operContent: operContent,
          };
          await checkGoldBank(checkParam)
            .then(res => {
              if (res.data.success) {
                setContent(res.data.message);
                // targetWin?.close();
                // setCalled(false);
                // setSuccessVisible(true);
              } else {
                //   Message.error(`调用验证金库票据失败${res.data.message}`);
                targetWin?.close();
              }
            })
            .catch(err => {
              // Message.error('调用验证金库票据失败');
              console.log('调用验证金库票据失败');
              targetWin?.close();
            });
        } else {
          targetWin?.close();
        }
      } catch (e) {
        console.log(e);
      }
    }
    targetWin?.close();
    setCalled(false);
    if (!isDrag) {
      setSuccessVisible(true);
    }
    if(isDrag && afterGoldR){
      afterGoldR();
    }
  };
  const onUpload = () => {
    setSuccessVisible(false);
  };

  const destroyEventMsg = () => {
    if (window.removeEventListener) {
      window.removeEventListener('message', receiveMsg, false);
    } else if (window.detachEvent) {
      window.detachEvent('message', receiveMsg);
    }
  };

  useEffect(() => {
    if (called) {
      if (window.addEventListener) {
        window.addEventListener('message', receiveMsg, false);
      } else {
        window.attachEvent('message', receiveMsg);
      }
    }
    return () => {
      destroyEventMsg();
    };
  }, [called]);
  return (
    <Space className="upload-file-container">
      <div className="c-fileConfig__config">
        <div className='flex-item-upload'>
          <div className="upload-content">
            {isDrag ? (
              <Upload
                drag
                multiple={multiple}
                disabled={disabled}
                showUploadList={showUploadList}
                onDrop={e => {
                  const uploadFile = e.dataTransfer.files[0];
                  if (isAcceptFile(uploadFile, `${uploadFileProps.accept}`)) {
                  } else {
                    Message.info('不接受的文件类型，请重新上传指定文件类型~');
                  }
                }}
                tip={fileInfo.tooltip}
                {...uploadFileProps}
              />
            ) : null}
            {needGoldR && !isDrag ? (
              <Button icon={<IconUpload />} loading={fileInfo.loading} onClick={onSubmit}>
                点击上传
              </Button>
            ) : null}
            {!needGoldR && !isDrag && (
              <Upload {...uploadFileProps}>
                <Button icon={<IconUpload />} loading={fileInfo.loading} onClick={onUpload}>
                  点击上传
                </Button>
              </Upload>
            )}
          </div>
          {fileInfo.isTooltip ? (
            <Tooltip content={fileInfo.tooltip}>
              <IconQuestionCircle />
            </Tooltip>
          ) : (
            ''
          )}
        </div>
        <span className="config-desc">{fileInfo.desc}</span>
      </div>
      <Modal
        title="提示信息"
        visible={tooltipVisible}
        onCancel={() => setTooltipVisible(false)}
        className="gold-modal"
        footer={
          <Button type="primary" onClick={toJk}>
            金库认证
          </Button>
        }
      >
        <p>
          <IconInfoCircle />
          该功能一定要尽快认证通过才能访问
        </p>
      </Modal>
      <Modal
        title="是否继续金库验证"
        visible={continueVisible}
        onCancel={checkJKno}
        className="gold-modal"
        footer={
          <Space>
            <Button onClick={checkJKno}>退出</Button>
            <Button type="primary" onClick={checkJKeys}>
              继续
            </Button>
          </Space>
        }
      >
        <p>
          <IconInfoCircle />
          操作将进行金库验证，确定请点继续，不认证请点退出
        </p>
      </Modal>
      <Modal
        title="金库认证成功"
        visible={successVisible}
        closable={false}
        className="gold-modal upload-modal"
        footer={
          <Upload
            ref={uploadRef}
            onChange={(_, currentFile) => onChange(_, currentFile)}
            showUploadList={false}
            {...uploadFileProps}
          >
            <Space size="large">
              <Button type="primary" onClick={onUpload}>
                确定
              </Button>
            </Space>
          </Upload>
        }
      >
        <p>
          <IconInfoCircle />
          {content ? `${content}!` : ''} 请点击确定按钮，开始上传文件
        </p>
      </Modal>
    </Space>
  );
}
