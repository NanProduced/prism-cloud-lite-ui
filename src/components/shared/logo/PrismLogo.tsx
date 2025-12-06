import { PrismIcon } from './PrismIcon';
import { PrismWordmark } from './PrismWordmark';

interface PrismLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'horizontal' | 'vertical';
  iconVariant?: 'solid' | 'gradient' | 'outline';
  iconOnly?: boolean;
  showFullName?: boolean;
  className?: string;
  color?: string;
}

const sizeConfig = {
  xs: { icon: 20, text: 'sm' as const, gap: 'gap-2' },
  sm: { icon: 28, text: 'md' as const, gap: 'gap-2' },
  md: { icon: 40, text: 'lg' as const, gap: 'gap-3' },
  lg: { icon: 56, text: 'xl' as const, gap: 'gap-4' },
  xl: { icon: 72, text: '2xl' as const, gap: 'gap-4' },
  '2xl': { icon: 96, text: '2xl' as const, gap: 'gap-5' }
};

export function PrismLogo({
  size = 'md',
  variant = 'horizontal',
  iconVariant = 'solid',
  iconOnly = false,
  showFullName = false,
  className = '',
  color = 'white'
}: PrismLogoProps) {
  const config = sizeConfig[size];
  const flexDirection = variant === 'vertical' ? 'flex-col' : 'flex-row';
  const alignItems = variant === 'vertical' ? 'items-center' : 'items-center';

  return (
    <div className={`flex ${flexDirection} ${alignItems} ${config.gap} ${className}`}>
      <PrismIcon
        size={config.icon}
        variant={iconVariant}
      />
      {!iconOnly && (
        <PrismWordmark
          size={config.text}
          color={color}
          showFullName={showFullName}
        />
      )}
    </div>
  );
}
