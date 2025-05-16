'use client';

import { FaCheckCircle } from 'react-icons/fa';
import { Tooltip } from 'react-tooltip';
import { useId } from 'react';

interface BlueMarkProps {
  size?: number;
  className?: string;
  showTooltip?: boolean;
}

export default function BlueMark({ size = 18, className = '', showTooltip = true }: BlueMarkProps) {
  const id = useId();
  const tooltipId = `bluemark-tooltip-${id}`;
  
  return (
    <>
      <FaCheckCircle 
        size={size} 
        className={`text-blue-500 inline-block ml-1 ${className}`}
        data-tooltip-id={showTooltip ? tooltipId : undefined}
        data-tooltip-content="Verified Account"
      />
      
      {showTooltip && (
        <Tooltip id={tooltipId} place="top" />
      )}
    </>
  );
} 