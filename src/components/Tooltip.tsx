import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children?: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'bottom' }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, close]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, close]);

  const handleToggle = () => setOpen(prev => !prev);

  return (
    <span className="tooltip-container">
      <button
        ref={triggerRef}
        type="button"
        className="tooltip-trigger"
        onClick={handleToggle}
        aria-label="More information"
        aria-expanded={open}
      >
        {children || 'ⓘ'}
      </button>

      {open && (
        <div
          ref={tooltipRef}
          className={`tooltip-popover tooltip-${position}`}
          role="tooltip"
        >
          <div className="tooltip-content">
            {content.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </span>
  );
}
