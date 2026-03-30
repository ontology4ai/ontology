export default () => {
  const stateOptions = [
    {
      value: '',
      label: '全部'
    },
    {
      value: '-1',
      label: '已失效',
    },
    {
      value: '0',
      label: '新建中',
    },
    {
      value: '1',
      label: '已生效',
    },
  ];
  const stateMap = [
    {
      label: '无状态',
      value: null,
      color: 'gray',
    },
    {
      label: '新建中',
      value: '0',
      color: 'arcoblue',
    },
    {
      label: '已失效',
      value: '-1',
      color: 'red',
    },
    {
      label: '已生效',
      value: '1',
      color: 'green',
    },
    {
      label: '已锁定',
      value: '2',
      color: 'gray',
    }
  ];
  const state = {
    stateOptions: stateOptions,
    stateMap: stateMap,
  };
  return state;
};
