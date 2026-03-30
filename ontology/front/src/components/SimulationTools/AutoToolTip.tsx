import React, { useState, useEffect, useRef } from 'react';
import { Tooltip } from '@arco-design/web-react';

interface AutoToolTipProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const AutoToolTip: React.FC<AutoToolTipProps> = ({ children, className = '', style = {} }) => {
  const [isOverflow, setIsOverflow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const { scrollWidth, clientWidth } = ref.current;
      setIsOverflow(scrollWidth > clientWidth);
    }
  }, [children]);

  return (
    <Tooltip content={isOverflow ? children : ''}>
      <div
        ref={ref}
        className={className}
        style={{
          ...style,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </div>
    </Tooltip>
  );
};

export default AutoToolTip;
