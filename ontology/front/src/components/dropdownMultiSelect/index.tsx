import React, { useState, useRef, useEffect,useLayoutEffect,useMemo,useCallback } from 'react';
import {Tag, Input, Checkbox, Tooltip} from '@arco-design/web-react';
import './index.less';
import {IconArrowDown,IconArrowUp,IconHelpColor,IconSearchColor}  from "modo-design/icon";

interface OptionType {
  id: string;
  label: string;
  value: string;
  desc?: string;
}

interface DropdownMultiSelectProps {
  className?: string;
  options?: OptionType[];
  selectedValues?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  addNode?: React.ReactNode;
  limit?: number;
}

const DropdownMultiSelect: React.FC<DropdownMultiSelectProps> = ({
  className = '',
  options = [],
  selectedValues = [],
  onChange = () => {},
  placeholder = "请选择",
  searchPlaceholder = "请输入",
  addNode = null,
  limit,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState(selectedValues);
    const [position, setPosition] = useState('bottom');
    const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
    const dropdownRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // 同步外部selectedValues变化
    useEffect(() => {
        setSelectedItems(selectedValues);
    }, [selectedValues]);
    const filteredOptions = useMemo(() =>
        options.filter(option =>
          (option.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.value?.toLowerCase().includes(searchTerm.toLowerCase()))
        ).slice(0, limit ?? options.length),
      [options, searchTerm, limit]
    );
   /* useLayoutEffect(() => {
        setSearchTerm('');
        if(dropdownRef.current){
            const selectBoxRect = dropdownRef.current.getBoundingClientRect();
            const width = selectBoxRect.width;
            const left = selectBoxRect.left;
            if(!isOpen){
                // 关闭时保存宽度，为下次打开做准备
                setPanelStyle({ width, left, display: 'none' });
                return;
            }
            if (isOpen && panelRef.current) {
                const panelHeight = panelRef.current.offsetHeight;
                const spaceBelow = window.innerHeight - selectBoxRect.bottom;
                const spaceAbove = selectBoxRect.top;

                const style: React.CSSProperties = {
                    width,
                    left,
                    display: 'block',
                };

                if (spaceBelow < panelHeight && spaceAbove > spaceBelow) {
                    setPosition('top');
                    style.bottom = window.innerHeight - selectBoxRect.top + 5;
                } else {
                    setPosition('bottom');
                    style.top = selectBoxRect.bottom + 5;
                }

                setPanelStyle(style);
            }
        }


    }, [
      isOpen,
        selectedItems.length,
        filteredOptions.length,   // 过滤选项数量变化
        options.length,
    ]);*/
    // 计算面板位置函数
    const calculatePanelPosition = useCallback(() => {
        if (!isOpen) {
            setPanelStyle({ display: 'none' });
            return;
        }
        if (dropdownRef.current) {
            const selectBoxRect = dropdownRef.current.getBoundingClientRect();
            const width = selectBoxRect.width;
            const left = selectBoxRect.left;

            // 先设置基本样式（宽度和位置）
            setPanelStyle({
                width,
                left,
                display: 'block',
              //  visibility: 'hidden', // 先隐藏避免闪烁
            });

            // 延迟计算高度相关的位置
            const timeoutId = setTimeout(() => {
                if (panelRef.current && dropdownRef.current) {
                    const selectBoxRect = dropdownRef.current.getBoundingClientRect();
                    const panelHeight = panelRef.current.offsetHeight;
                    const spaceBelow = window.innerHeight - selectBoxRect.bottom;
                    const spaceAbove = selectBoxRect.top;

                    const style: React.CSSProperties = {
                        width,
                        left,
                        display: 'block',
                       // visibility: 'visible', // 显示面板
                    };

                    if (spaceBelow < panelHeight && spaceAbove > spaceBelow) {
                        setPosition('top');
                        style.bottom = window.innerHeight - selectBoxRect.top + 5;
                    } else {
                        setPosition('bottom');
                        style.top = selectBoxRect.bottom + 5;
                    }

                    // 只有当位置确实发生变化时才更新样式
                    setPanelStyle(prev => {
                        if (JSON.stringify(prev) === JSON.stringify(style)) {
                            return prev; // 样式没变化，不更新
                        }
                        return style;
                    });
                }
            }, 10); // 短暂延迟确保DOM已更新

            return () => clearTimeout(timeoutId);
        }
    }, [isOpen]);

    // 初始计算和依赖变化计算
    useLayoutEffect(() => {
        calculatePanelPosition();
    }, [
        isOpen,
        filteredOptions.length,
    ]);
    // 单独处理选择值的情况，只有在下拉面板向上展开时才重新计算
    /*useEffect(() => {
        if (isOpen && position === 'top') {
            // 只有当面板向上展开时，选择值才需要重新计算（因为select-box高度变化）
            calculatePanelPosition();
        }
        // 向下展开时，select-box高度变化不影响面板位置，不需要重新计算
    }, [isOpen, position, selectedItems.length]);*/

    useEffect(()=>{
        setSearchTerm('');
    },[isOpen]);

    // 监听滚动事件
    useEffect(() => {
        if (!isOpen) return;

        // 防抖函数
        const debounce = (func: Function, wait: number) => {
            let timeout: NodeJS.Timeout;
            return (...args: any[]) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        };

        const debouncedCalculate = debounce(calculatePanelPosition, 16); // 约60fps

        // 监听所有可能的滚动容器
        const scrollContainers: (Window | HTMLElement)[] = [window];

        // 查找所有父级滚动容器
        let parent = dropdownRef.current?.parentElement;
        while (parent) {
            const style = window.getComputedStyle(parent);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll' ||
              style.overflowX === 'auto' || style.overflowX === 'scroll') {
                scrollContainers.push(parent);
            }
            parent = parent.parentElement;
        }

        // 添加滚动监听
        scrollContainers.forEach(container => {
            container.addEventListener('scroll', debouncedCalculate, { passive: true });
        });

        // 监听窗口大小变化
        window.addEventListener('resize', debouncedCalculate, { passive: true });

        return () => {
            // 清理事件监听
            scrollContainers.forEach(container => {
                container.removeEventListener('scroll', debouncedCalculate);
            });
            window.removeEventListener('resize', debouncedCalculate);
        };
    }, [isOpen, calculatePanelPosition]);

    // 点击外部关闭下拉框
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // 切换选项选中状态
    const toggleOption = (value: string) => {
        let newSelectedItems;
        if (selectedItems.includes(value)) {
            newSelectedItems = selectedItems.filter(item => item !== value);
        } else {
            newSelectedItems = [...selectedItems, value];
        }

        setSelectedItems(newSelectedItems);
        onChange(newSelectedItems);
    };

    // 全选/取消全选
    const toggleSelectAll = () => {
        let newSelectedItems;
        if (selectedItems.length === filteredOptions.length) {
            newSelectedItems = [];
        } else {
            newSelectedItems = filteredOptions.map(option => option.id);
        }

        setSelectedItems(newSelectedItems);
        onChange(newSelectedItems);
    };

    // 清空所有选择
    const clearAll = () => {
        setSelectedItems([]);
        onChange([]);
    };

    // 移除单个已选标签
    const removeTag = (value: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelectedItems = selectedItems.filter(item => item !== value);
        setSelectedItems(newSelectedItems);
        onChange(newSelectedItems);
    };

    // 过滤选项
   /* const filteredOptions = options.filter(option =>
      (option.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       option.value?.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, limit ?? options.length);*/

    // 判断是否全选
    const isAllSelected = filteredOptions.length > 0 &&
      filteredOptions.every(option => selectedItems.includes(option.id));

    return (
      <div className={`dropdown-multiselect ${className}`} ref={dropdownRef}>
          <div
            className={`select-box ${isOpen ? 'focused' : ''}`}
            onClick={() => setIsOpen(!isOpen)}
          >
              {selectedItems.length === 0 ? (
                <span className="placeholder">{placeholder}</span>
              ) : (
                selectedItems.map(value => {
                    const option = options.find(opt => opt.id === value);
                    return option ? (
                      <Tag size='small' className="selected-tag"  key={value}  closable onClose={(e)=>removeTag(value, e)}>
                    {option.label}
                    </Tag>
                    ) : null;
                })
              )}
              <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>
          {isOpen ? <IconArrowUp/> : <IconArrowDown/>}
        </span>
          </div>

          {isOpen && (
            <div
              className={`dropdown-panel ${position === 'top' ? 'dropdown-panel-top' : 'dropdown-panel-bottom'}`}
              ref={panelRef}
              style={panelStyle} // 动态设置样式
            >
                <div className="search-box">
                    <Input
                      prefix={<IconSearchColor />}
                      allowClear
                      placeholder={searchPlaceholder}
                      value={searchTerm}
                      onChange={ setSearchTerm}
                    />
                </div>

                <div className="actions">
                    <label className="select-all">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                        />
                        全选
                    </label>
                    <button className="clear-btn" onClick={clearAll}>
                        清空
                    </button>
                </div>

                <div className="options-list">
                    {filteredOptions.length === 0 ? (
                      <div className="no-options">未找到匹配的选项</div>
                    ) : (
                      filteredOptions.map(option => (
                        <div
                          key={option.id}
                          className={`option-item ${selectedItems.includes(option.id) ? 'selected' : ''}`}
                          onClick={() => toggleOption(option.id)}
                        >
                            {/*<input
                              type="checkbox"
                              checked={selectedItems.includes(option.id)}
                              readOnly
                            />*/}
                            <Checkbox checked={selectedItems.includes(option.id)} readOnly> <label>{option.label} {option.desc?<Tooltip content={option.desc}> <IconHelpColor style={{marginLeft: 3}}/></Tooltip>:''} </label></Checkbox>

                        </div>
                      ))
                    )}
                </div>
                {addNode?<div className='dropdown-footer'>{addNode}</div>:''}
            </div>
          )}
      </div>
    );
};

export default DropdownMultiSelect;
