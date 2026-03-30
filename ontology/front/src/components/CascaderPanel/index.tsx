import React, {
  CSSProperties,
  forwardRef,
  useEffect,
  useState,
  useImperativeHandle,
  useRef,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import { isArray, isFunction, isObject, isString } from '@arco-design/web-react/es/_util/is';
import Trigger from '@arco-design/web-react/es/Trigger';
import CascaderPanel from './list';
import SearchPanel from '@arco-design/web-react/es/Cascader/panel/search-panel';
import { ConfigContext } from '@arco-design/web-react/es/ConfigProvider';
import Store from '@arco-design/web-react/es/Cascader/base/store';
import SelectView, { SelectViewHandle } from '@arco-design/web-react/es/_class/select-view';
import { CascaderProps, OptionProps, InputValueChangeReason } from '@arco-design/web-react/es/Cascader/interface';
import cs from '@arco-design/web-react/es/_util/classNames';
import useMergeValue from '@arco-design/web-react/es/_util/hooks/useMergeValue';
import useUpdate from '@arco-design/web-react/es/_util/hooks/useUpdate';
import { Enter, Tab } from '@arco-design/web-react/es/_util/keycode';
import useCurrentRef from '@arco-design/web-react/es/Cascader/hook/useRefCurrent';
import useMergeProps from '@arco-design/web-react/es/_util/hooks/useMergeProps';
import {
  valueInSet,
  transformValuesToSet,
  isEmptyValue,
  getConfig,
  getStore,
  formatValue,
  removeValueFromSet,
  SHOW_CHILD,
} from '@arco-design/web-react/es/Cascader/util';
import useForceUpdate from '@arco-design/web-react/es/_util/hooks/useForceUpdate';
import './style/index.less';

// Generate DOM id for instance
let globalCascaderIndex = 0;

export const DefaultFieldNames = {
  label: 'label',
  value: 'value',
  isLeaf: 'isLeaf',
  children: 'children',
  disabled: 'disabled',
};

const defaultProps: CascaderProps = {
  options: [],
  bordered: true,
  fieldNames: DefaultFieldNames,
  trigger: 'click',
  expandTrigger: 'click',
  checkedStrategy: SHOW_CHILD,
};

function Cascader<T extends OptionProps>(baseProps: CascaderProps<T>, ref) {
  const { getPrefixCls, renderEmpty, componentConfig } = useContext(ConfigContext);
  const props = useMergeProps<CascaderProps>(baseProps, defaultProps, componentConfig?.Cascader);
  const { disabled, renderFormat, getPopupContainer, children, triggerProps, expandTrigger } =
    props;

  const prefixCls = getPrefixCls('cascader');
  const isMultiple = props.mode === 'multiple';
  const timerRef = useRef(null);
  const forceUpdate = useForceUpdate();

  const store = useCurrentRef<Store<T>>(() => {
    return getStore(
      props,
      formatValue('value' in props ? props.value : props.defaultValue, isMultiple)
    );
  }, [JSON.stringify(getConfig(props)), props.options]);

  const [stateValue, setValue] = useState(() => {
    return 'value' in props
      ? formatValue(props.value, isMultiple, store)
      : 'defaultValue' in props
      ? formatValue(props.defaultValue, isMultiple, store)
      : [];
  });

  const mergeValue = 'value' in props ? formatValue(props.value, isMultiple, store) : stateValue;

  const [popupVisible, setPopupVisible] = useMergeValue(false, {
    value: props.popupVisible,
    defaultValue: props.defaultPopupVisible,
  });
  const [inputValue, setInputValue, stateInputValue] = useMergeValue('', {
    value: 'inputValue' in props ? props.inputValue || '' : undefined,
  });

  // 触发 onInputValueChange 回调的值
  const refOnInputChangeCallbackValue = useRef(inputValue);
  // 触发 onInputValueChange 回调的原因
  const refOnInputChangeCallbackReason = useRef<InputValueChangeReason>(null);

  const selectRef = useRef(null);
  // 暂存被选中的值对应的节点。仅在onSearch的时候用到
  // 避免出现下拉列表改变，之前选中的option找不到对应的节点，展示上会出问题。
  const stashNodes = useRef<Store<T>['nodes']>(store?.getCheckedNodes() || []);

  // Unique ID of this select instance
  const instancePopupID = useMemo<string>(() => {
    const id = `${prefixCls}-popup-${globalCascaderIndex}`;
    globalCascaderIndex++;
    return id;
  }, []);

  // 尝试更新 inputValue，触发 onInputValueChange
  const tryUpdateInputValue = (value: string, reason: InputValueChangeReason) => {
    if (value !== refOnInputChangeCallbackValue.current) {
      setInputValue(value);
      refOnInputChangeCallbackValue.current = value;
      refOnInputChangeCallbackReason.current = reason;
      props.onInputValueChange && props.onInputValueChange(value, reason);
    }
  };

  // 在 inputValue 变化时，适时触发 onSearch
  useEffect(() => {
    const { current: reason } = refOnInputChangeCallbackReason;
    if (stateInputValue === inputValue && (reason === 'manual' || reason === 'optionListHide')) {
      props.onSearch && props.onSearch(inputValue, reason);
    }
  }, [inputValue]);

  useEffect(() => {
    const clearTimer = () => {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    if (!popupVisible && inputValue) {
      if (timerRef.current) {
        clearTimer();
      }
      timerRef.current = setTimeout(() => {
        tryUpdateInputValue('', 'optionListHide');
        timerRef.current = null;
      }, 200);
    }
    return () => {
      clearTimer();
    };
  }, [popupVisible]);

  useUpdate(() => {
    if ('value' in props && props.value !== stateValue) {
      // don't to use formatValue(x, y, store)
      // we just need to get the value in a valid format, and update it to store nodes
      const newValue = formatValue(props.value, isMultiple);
      store.setNodeCheckedByValue(newValue);
      setValue(newValue);
    }
  }, [props.value, isMultiple]);

  useImperativeHandle(ref, () => selectRef.current, []);

  const updateStashNodes = (nodes) => {
    stashNodes.current = Array.from(new Set([].concat(nodes, stashNodes.current)));
  };

  const getSelectedOptionsByValue = (values: string[][]): OptionProps[][] => {
    const result = [];
    const valuesSet = transformValuesToSet(values);

    const findValue = (nodes) => {
      nodes.some((node) => {
        if (valueInSet(valuesSet, node.pathValue)) {
          result.push(node.getPathNodes().map((x) => x._data));
          removeValueFromSet(valuesSet, node.pathValue);
        }

        if (!valuesSet.size) {
          return true;
        }
      });
    };

    findValue(store.getCheckedNodes());

    if (valuesSet.size) {
      findValue(stashNodes.current);
    }

    return result;
  };

  const handleVisibleChange = useCallback(
    (newVisible) => {
      if (newVisible !== popupVisible) {
        props.onVisibleChange && props.onVisibleChange(newVisible);
        if (!('popupVisible' in props)) {
          setPopupVisible(newVisible);
        }
      }
    },
    [props.onVisibleChange, popupVisible]
  );

  const renderText = useCallback(
    (value) => {
      // store 中不存在时，从stashNodes.current中找一下对应节点
      const options = getSelectedOptionsByValue([value])[0] || [];

      let text;
      let valueShow = isArray(value) ? value.map((x) => String(x)) : [];

      if (options.length) {
        valueShow = options.map((x) => x.label);
      }
      if (isFunction(renderFormat)) {
        text = renderFormat(valueShow);
      } else if (valueShow.every((v) => isString(v))) {
        text = valueShow.join(' / ');
      } else {
        text = valueShow.reduce((total, item, index) => {
          return total.concat(index === 0 ? [item] : [' / ', item]);
        }, []);
      }
      return {
        text: text || '',
        disabled: options[options.length - 1]?.disabled,
      };
    },
    [store, renderFormat]
  );

  const handleChange = (newValue: string[][], trigger?: 'panel') => {
    if (
      trigger === 'panel' &&
      isObject(props.showSearch) &&
      !props.showSearch.retainInputValueWhileSelect &&
      isMultiple
    ) {
      tryUpdateInputValue('', 'optionChecked');
    }
    const { onChange, changeOnSelect, expandTrigger } = props;
    const isSame = mergeValue === newValue;
    if (isSame) {
      return;
    }

    if (!isMultiple) {
      store.setNodeCheckedByValue(newValue);
    }

    updateStashNodes(store.getCheckedNodes());
    const selectedOptions = getSelectedOptionsByValue(newValue);
    const _value = isMultiple ? newValue : newValue[0];
    const _selectedOptions = isMultiple ? selectedOptions : selectedOptions[0];

    if (!isMultiple) {
      if (inputValue) {
        // 单选时选择搜索项，直接关闭面板
        handleVisibleChange(false);
      } else if (
        (selectedOptions[0] && selectedOptions[0][selectedOptions[0].length - 1]?.isLeaf) ||
        (changeOnSelect && expandTrigger === 'hover')
      ) {
        handleVisibleChange(false);
      }
    }

    if ('value' in props) {
      store.setNodeCheckedByValue(mergeValue);
      // 受控触发更新，回到选中前的状态。
      forceUpdate();
    } else {
      setValue(newValue);
    }
    onChange &&
      onChange(_value, _selectedOptions, {
        dropdownVisible: popupVisible,
      });
  };

  const onRemoveCheckedItem = (item, index, e) => {
    e.stopPropagation();
    if (item.disabled) {
      return;
    }

    const newValue = mergeValue.filter((_, i) => i !== index);
    store.setNodeCheckedByValue(newValue);
    handleChange(newValue);
  };

  const renderEmptyEle = (width?: CSSProperties['width']): React.ReactNode => {
    const wd = width || (selectRef.current && selectRef.current.getWidth());
    return (
      <div className={`${prefixCls}-list-empty`} style={{ width: wd as number }}>
        {props.notFoundContent || renderEmpty('Cascader')}
      </div>
    );
  };

  const showSearchPanel = !isFunction(props.onSearch) && !!inputValue;
  const width = selectRef.current && selectRef.current.getWidth();
  const dropdownRender = isFunction(props.dropdownRender) ? props.dropdownRender : (menu) => menu;

  return (
    <div
      id={instancePopupID}
      className={cs(`${prefixCls}-popup modo-cascader-panel`, props.dropdownMenuClassName, {
        [`${prefixCls}-popup-trigger-hover`]: props.expandTrigger === 'hover',
      })}
    >
      {dropdownRender(
        <div className={`${prefixCls}-popup-inner`} onMouseDown={(e) => e.preventDefault()}>
          {showSearchPanel ? (
            <SearchPanel
              style={{ minWidth: width } as CSSProperties}
              store={store}
              inputValue={inputValue}
              renderEmpty={() => renderEmptyEle(width)}
              multiple={isMultiple}
              onChange={(value) => {
                handleChange(value, 'panel');
              }}
              prefixCls={prefixCls}
              onEsc={() => {
                handleVisibleChange(false);
              }}
              value={mergeValue}
              virtualListProps={props.virtualListProps}
            />
          ) : (
            <CascaderPanel
              dropdownMenuColumnStyle={props.dropdownMenuColumnStyle}
              virtualListProps={props.virtualListProps}
              expandTrigger={expandTrigger}
              store={store}
              dropdownColumnRender={(menu, level) => {
                return (
                  <div className={'level-' + level}>
                    {menu}
                  </div>
                )
              }}
              renderOption={props.renderOption}
              changeOnSelect={props.changeOnSelect}
              showEmptyChildren={props.showEmptyChildren || !!props.loadMore}
              multiple={isMultiple}
              onChange={(value) => {
                handleChange(value, 'panel');
              }}
              loadMore={props.loadMore}
              prefixCls={prefixCls}
              renderEmpty={renderEmptyEle}
              popupVisible={popupVisible}
              value={mergeValue}
              renderFooter={props.renderFooter}
              onEsc={() => {
                handleVisibleChange(false);
              }}
              onDoubleClickOption={() => {
                if (props.changeOnSelect && !isMultiple) {
                  handleVisibleChange(false);
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface ForwardRefCascaderType
  extends React.ForwardRefExoticComponent<
    React.PropsWithoutRef<CascaderProps> & React.RefAttributes<SelectViewHandle>
  > {
  <T = any>(
    props: React.PropsWithChildren<CascaderProps<T>> & {
      ref?: React.Ref<SelectViewHandle>;
    }
  ): React.ReactElement;
}

const CascaderComponent = forwardRef<SelectViewHandle, CascaderProps<any>>(
  Cascader
) as ForwardRefCascaderType;

CascaderComponent.displayName = 'Cascader';

export default CascaderComponent;
