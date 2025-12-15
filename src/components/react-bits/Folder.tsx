import { useMemo, useState } from 'react';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';

import './folder.css';

type PaperOffset = { x: number; y: number };

export type ReactBitsFolderProps = {
  color?: string;
  size?: number;
  items?: ReactNode[];
  className?: string;
  interaction?: 'click' | 'hover';
};

function darkenColor(hex: string, percent: number): string {
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color
      .split('')
      .map((character) => character + character)
      .join('');
  }

  const num = Number.parseInt(color, 16);
  let red = (num >> 16) & 0xff;
  let green = (num >> 8) & 0xff;
  let blue = num & 0xff;

  red = Math.max(0, Math.min(255, Math.floor(red * (1 - percent))));
  green = Math.max(0, Math.min(255, Math.floor(green * (1 - percent))));
  blue = Math.max(0, Math.min(255, Math.floor(blue * (1 - percent))));

  return `#${((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1).toUpperCase()}`;
}

function createOffsets(count: number): PaperOffset[] {
  return Array.from({ length: count }, () => ({ x: 0, y: 0 }));
}

export function ReactBitsFolder({
  color = '#5227FF',
  size = 1,
  items = [],
  className = '',
  interaction = 'click',
}: ReactBitsFolderProps) {
  const maxItems = 3;

  const papers = useMemo(
    () => Array.from({ length: maxItems }, (_, index) => items[index] ?? null),
    [items],
  );

  const [open, setOpen] = useState(false);
  const [paperOffsets, setPaperOffsets] = useState<PaperOffset[]>(() => createOffsets(maxItems));

  const folderBackColor = darkenColor(color, 0.08);
  const paper1 = darkenColor('#ffffff', 0.1);
  const paper2 = darkenColor('#ffffff', 0.05);
  const paper3 = '#ffffff';

  const folderStyle = {
    '--rb-folder-color': color,
    '--rb-folder-back-color': folderBackColor,
    '--rb-paper-1': paper1,
    '--rb-paper-2': paper2,
    '--rb-paper-3': paper3,
  } as CSSProperties;

  const scaleStyle = { transform: `scale(${size})` } satisfies CSSProperties;

  const folderClassName = `rb-folder${open ? ' rb-folder--open' : ''}`.trim();

  const resetOffsets = () => setPaperOffsets(createOffsets(maxItems));

  const handleClick = () => {
    if (interaction !== 'click') return;

    setOpen((prev) => {
      const next = !prev;
      if (!next) resetOffsets();
      return next;
    });
  };

  const handlePointerEnter = () => {
    if (interaction !== 'hover') return;
    setOpen(true);
  };

  const handlePointerLeave = () => {
    if (interaction !== 'hover') return;
    setOpen(false);
    resetOffsets();
  };

  const handlePaperMouseMove = (event: MouseEvent<HTMLDivElement>, index: number) => {
    if (!open) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (event.clientX - centerX) * 0.15;
    const offsetY = (event.clientY - centerY) * 0.15;

    setPaperOffsets((prev) => {
      const next = [...prev];
      next[index] = { x: offsetX, y: offsetY };
      return next;
    });
  };

  const handlePaperMouseLeave = (_event: MouseEvent<HTMLDivElement>, index: number) => {
    setPaperOffsets((prev) => {
      const next = [...prev];
      next[index] = { x: 0, y: 0 };
      return next;
    });
  };

  return (
    <div style={scaleStyle} className={className}>
      <div
        className={folderClassName}
        style={folderStyle}
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <div className="rb-folder__back">
          {papers.map((item, index) => (
            <div
              key={index}
              className="rb-folder__paper"
              onMouseMove={(event) => handlePaperMouseMove(event, index)}
              onMouseLeave={(event) => handlePaperMouseLeave(event, index)}
              style={
                open
                  ? ({
                      '--rb-magnet-x': `${paperOffsets[index]?.x ?? 0}px`,
                      '--rb-magnet-y': `${paperOffsets[index]?.y ?? 0}px`,
                    } as CSSProperties)
                  : undefined
              }
            >
              {item}
            </div>
          ))}
          <div className="rb-folder__front"></div>
          <div className="rb-folder__front rb-folder__front--right"></div>
        </div>
      </div>
    </div>
  );
}
