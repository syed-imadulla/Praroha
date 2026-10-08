import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'standard' | 'wide' | 'narrow';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  maxWidth = 'standard',
}) => {
  const maxClass =
    maxWidth === 'wide'
      ? 'max-w-[1320px]'
      : maxWidth === 'narrow'
      ? 'max-w-[960px]'
      : 'max-w-[1220px]';

  return (
    <div
      className={`w-full ${maxClass} mx-auto px-4 sm:px-8 lg:px-10 xl:px-12 flex flex-col ${className}`}
    >
      {children}
    </div>
  );
};
