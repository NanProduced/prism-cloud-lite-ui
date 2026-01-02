interface PrismWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  color?: string;
  showFullName?: boolean;
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-5xl',
  '2xl': 'text-7xl'
};

export function PrismWordmark({
  size = 'md',
  className = '',
  color = 'currentColor',
  showFullName = false
}: PrismWordmarkProps) {
  return (
    <div className={`font-bold tracking-tight ${sizeClasses[size]} ${className}`}>
      <span style={{ color }}>Prism</span>
      {showFullName && (
        <span
          className="font-normal ml-2 opacity-70"
          style={{ color }}
        >
          Cloud Lite
        </span>
      )}
    </div>
  );
}
