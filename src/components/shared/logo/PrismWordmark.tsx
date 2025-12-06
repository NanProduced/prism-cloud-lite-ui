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
  color = 'white',
  showFullName = false
}: PrismWordmarkProps) {
  return (
    <div className={`font-bold tracking-tight ${sizeClasses[size]} ${className}`}>
      <span style={{ color }}>Prism</span>
      {showFullName && (
        <span
          className="font-normal ml-2"
          style={{ color, opacity: 0.7 }}
        >
          Cloud Lite
        </span>
      )}
    </div>
  );
}
