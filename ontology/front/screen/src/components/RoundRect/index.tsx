import React, { useState, useEffect, useMemo } from 'react'

class RoundRect extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }
    render() {
        const {
            width,
            height,
            radius,
            x1,
            y1,
            x2,
            y2,
            color1,
            color2,
            strokeWidth
        } = this.props;
        return (
            <>
            <svg
                className="round-rect"
                width={width}
                height={height}
                xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="borderGradient" x1={x1 || "0%"} y1={y1 || "100%"} x2={x2 || "100%"} y2={y2 || "0%"}>
                  <stop offset="0%" stop-color={color1 || "rgba(83, 93, 152, 1)"} />
                  <stop offset="100%" stop-color={color2 || "rgba(44, 50, 87, 0.3)"} />
                </linearGradient>
                
              </defs>
              
              <rect 
                x="0"
                y="0" 
                width={width}
                height={height}
                rx={radius}
                ry={radius} 
                fill="none" 
                stroke="url(#borderGradient)"
                stroke-width={strokeWidth || 1}
              />
            </svg>
            </>
        )
    }
}

export default RoundRect;
