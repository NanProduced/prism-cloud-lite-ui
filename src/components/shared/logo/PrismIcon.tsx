interface PrismIconProps {
  size?: number | string;
  className?: string;
  variant?: 'solid' | 'gradient' | 'outline';
}

export function PrismIcon({
  size = 40,
  className = '',
  variant = 'solid'
}: PrismIconProps) {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  // Figma 原始颜色
  const purpleColor = '#5600EF';

  const getFill = () => {
    if (variant === 'gradient') return 'url(#prism-gradient)';
    if (variant === 'outline') return 'none';
    return purpleColor;
  };

  const getStroke = () => {
    if (variant === 'outline') return purpleColor;
    return 'none';
  };

  const strokeWidth = variant === 'outline' ? '2' : '0';

  return (
    <svg
      width={sizeValue}
      height={sizeValue}
      viewBox="0 0 195 198"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="prism-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <mask id="mask0_0_10" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="195" height="198">
          <path d="M194.469 0H0V197.267H194.469V0Z" fill="white"/>
        </mask>
      </defs>

      <g mask="url(#mask0_0_10)">
        {/* 右上三角形 */}
        <path
          d="M128.458 89.5438C133.16 93.2974 139.065 95.3614 145.082 95.3614H194.469L102.951 3.84351L119.091 74.6292C120.428 80.4954 123.756 85.7927 128.458 89.5414V89.5438Z"
          fill={getFill()}
          stroke={getStroke()}
          strokeWidth={strokeWidth}
        />

        {/* 右下三角形 */}
        <path
          d="M128.458 107.723C123.756 111.477 120.431 116.772 119.091 122.636L102.951 193.424L194.467 101.908H145.079C139.062 101.908 133.16 103.972 128.456 107.723H128.458Z"
          fill={getFill()}
          stroke={getStroke()}
          strokeWidth={strokeWidth}
        />

        {/* 左上三角形 */}
        <path
          d="M104.524 85.326C109.61 78.9492 111.487 70.7298 109.676 62.7777L95.359 0L0 95.359H83.6874C91.8437 95.359 99.4408 91.7027 104.527 85.326H104.524Z"
          fill={getFill()}
          stroke={getStroke()}
          strokeWidth={strokeWidth}
        />

        {/* 左下三角形 */}
        <path
          d="M104.524 111.941C99.4384 105.565 91.8412 101.908 83.685 101.908H0L95.359 197.267L109.676 134.49C111.489 126.535 109.61 118.318 104.524 111.941Z"
          fill={getFill()}
          stroke={getStroke()}
          strokeWidth={strokeWidth}
        />
      </g>
    </svg>
  );
}
