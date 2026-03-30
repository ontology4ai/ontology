import React, { useContext, useEffect, useState, useRef } from 'react';
import cs from '@arco-design/web-react/es/_util/classNames';
import Checkbox, { CheckboxProps } from '@arco-design/web-react/es/Checkbox';
import Button from '@arco-design/web-react/es/Button';
import Input from '@arco-design/web-react/es/Input';
import List from '@arco-design/web-react/es/List';
import Spin from '@arco-design/web-react/es/Spin';
import Item from '@arco-design/web-react/es/Transfer/item';
import { TransferItem, TransferListProps } from './interface';
import { IconSearch, IconDelete } from '@arco-design/web-react/icon';
import IconHover from '@arco-design/web-react/es/_class/icon-hover';
import { ConfigContext } from '@arco-design/web-react/es/ConfigProvider';
import { isObject } from '@arco-design/web-react/es/_util/is';

export const TransferList = (props: TransferListProps, ref) => {
  const {
    style,
    prefixCls,
    className,
    listType,
    dataSource,
    selectedKeys = [],
    validKeys,
    selectedDisabledKeys,
    title = '',
    disabled,
    draggable,
    allowClear,
    showSearch,
    showFooter,
    searchPlaceholder,
    render,
    renderList,
    pagination,
    handleSelect,
    handleRemove,
    filterOption,
    onSearch,
    onResetData,
    onDragStart,
    onDragEnd,
    onDragLeave,
    onDragOver,
    onDrop,
  } = props;

  const baseClassName = `${prefixCls}-view`;

  const { locale } = useContext(ConfigContext);
  const [dragItem, setDragItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [itemsToRender, setItemsToRender] = useState(dataSource);
  const [inputAni, setInputAni] = useState(null);
  const inputAniRef = useRef(inputAni);
  const inputValRef = useRef(inputVal);

  useEffect(() => {
    setItemsToRender(
      filterText ? dataSource.filter((item) => filterOption(filterText, item)) : dataSource
    );
  }, [dataSource, filterText, filterOption]);

  // 处理单个条目复选框改变
  const handleItemChecked = (key: string, checked: boolean) =>
    handleSelect(checked ? selectedKeys.concat(key) : selectedKeys.filter((_key) => _key !== key));
  // 处理全选复选框改变，始终避免操作已禁用的选项
  const handleItemAllChecked = (keys: string[], checked: boolean) =>
    handleSelect(
      checked
        ? [...new Set(selectedKeys.concat(keys))]
        : selectedKeys.filter((selectedKey) => keys.indexOf(selectedKey) === -1)
    );
  const clearItems = (keys: string[]) => () => handleRemove(keys);
  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      const v = inputValRef.current;
      setFilterText(v);
      onSearch && onSearch(v);
      isObject(showSearch) && showSearch.onChange && showSearch.onChange(v, event);
      setTimeout(() => {
        setLoading(false);
      })
    })
  }
  const searchInput = (
    <Input
      size="small"
      disabled={disabled}
      placeholder={searchPlaceholder}
      suffix={(
        <IconSearch
          style={{
            cursor: 'pointer'
          }}
          onClick={(event) => {
            handleSearch()
          }}/>
      )}
      {...(isObject(showSearch) ? showSearch : {})}
      onChange={(value, event) => {
        inputValRef.current = value;
        clearTimeout(inputAniRef.current);
        inputAniRef.current = setTimeout(() => {
          setInputVal(value);
        })
      }}
      onPressEnter={(event) => {
        handleSearch()
      }}
    />
  );

  const renderHeader = () => {
    const countSelected = selectedKeys.length;
    const countRendered = itemsToRender.length;
    const keysCanBeChecked = filterText
      ? validKeys.filter((validKey) => itemsToRender.find(({ key }) => key === validKey))
      : validKeys;
    const countCheckedOfRenderedItems = keysCanBeChecked.filter(
      (key) => selectedKeys.indexOf(key) > -1
    ).length;

    const checkboxProps: Partial<CheckboxProps<any>> = {
      disabled,
      checked:
        countCheckedOfRenderedItems > 0 && countCheckedOfRenderedItems === keysCanBeChecked.length,
      indeterminate:
        countCheckedOfRenderedItems > 0 && countCheckedOfRenderedItems < keysCanBeChecked.length,
      onChange: (checked) => handleItemAllChecked(keysCanBeChecked, checked),
    };

    if (typeof title === 'function') {
      return title({
        countTotal: countRendered,
        countSelected,
        clear: clearItems(keysCanBeChecked),
        checkbox: <Checkbox {...checkboxProps} />,
        searchInput,
      });
    }

    return allowClear ? (
      <>
        <span className={`${baseClassName}-header-title`}>{title}</span>
        {!disabled && validKeys.length ? (
          <IconHover
            className={`${baseClassName}-icon-clear`}
            onClick={clearItems(keysCanBeChecked)}
          >
            <IconDelete />
          </IconHover>
        ) : null}
      </>
    ) : (
      <>
        <span className={`${baseClassName}-header-title`}>
          <Checkbox {...checkboxProps}>{title}</Checkbox>
        </span>
        <span
          className={`${baseClassName}-header-unit`}
        >{`${countSelected} / ${countRendered}`}</span>
      </>
    );
  };

  const renderListBody = () => {
    const customList =
      renderList &&
      renderList({
        listType,
        disabled,
        selectedKeys,
        validKeys,
        selectedDisabledKeys,
        filteredItems: itemsToRender,
        onItemRemove: (key) => handleRemove([key]),
        onItemSelect: handleItemChecked,
        onItemSelectPart: handleItemAllChecked,
        onItemSelectAll: (keys, checked) => {
          handleSelect(checked ? keys.concat(selectedDisabledKeys) : [...selectedDisabledKeys]);
        },
      });

    return (<Spin
      loading={loading}>
      {customList ? (
        <div className={`${baseClassName}-custom-list`}>{customList}</div>
      ) : (
        <List
          wrapperClassName={`${baseClassName}-list`}
          dataSource={itemsToRender}
          render={(item: TransferItem) => (
            <Item
              key={item.key}
              prefixCls={prefixCls}
              item={item}
              disabled={disabled}
              draggable={draggable}
              droppable={!!dragItem}
              allowClear={allowClear}
              render={render}
              selectedKeys={selectedKeys}
              onItemSelect={(key, selected) => handleItemChecked(key, selected)}
              onItemRemove={(key) => handleRemove([key])}
              onDragStart={(e, item) => {
                setDragItem(item);
                onDragStart && onDragStart(e, item);
              }}
              onDragEnd={(e, item) => {
                setDragItem(null);
                onDragEnd && onDragEnd(e, item);
              }}
              onDragLeave={(e, item) => onDragLeave && onDragLeave(e, item)}
              onDragOver={(e, item) => onDragOver && onDragOver(e, item)}
              onDrop={(e, dropItem, dropPosition) => {
                if (onDrop && dragItem && dragItem.key !== dropItem.key) {
                  onDrop({
                    e,
                    dropItem,
                    dropPosition,
                    dragItem,
                  });
                }
              }}
            />
          )}
          pagination={
            pagination
              ? {
                  simple: true,
                  size: 'mini',
                  ...(typeof pagination === 'object' ? pagination : {}),
                }
              : undefined
          }
          bordered={false}
          paginationInFooter
          footer={
            showFooter === true ? (
              <Button size="mini" disabled={disabled} onClick={onResetData}>
                {locale.Transfer.resetText}
              </Button>
            ) : (
              showFooter || null
            )
          }
        />)}
      </Spin>
    );
  };

  return (
    <div ref={ref} className={cs(baseClassName, className)} style={style}>
      <div className={`${baseClassName}-header`}>{renderHeader()}</div>

      {showSearch && <div className={`${baseClassName}-search`}>{searchInput}</div>}

      {renderListBody()}
    </div>
  );
};

const TransferListComponent = React.forwardRef(TransferList);

export default TransferListComponent;
