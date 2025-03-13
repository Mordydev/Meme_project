'use client';

interface HolderBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HolderBadge({
  size = 'sm',
  className = ''
}: HolderBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1'
  };
  
  return (
    <div 
      className={`
        bg-primary-50 
        text-primary-700 
        font-medium 
        rounded-full 
        inline-flex 
        items-center 
        border
        border-primary-200
        ${sizeClasses[size]} 
        ${className}
      `}
    >
      <span className="mr-1 text-primary-500">●</span> Token Holder
    </div>
  );
}
