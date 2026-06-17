import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullPage?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text, fullPage = false }) => {
  const ringSize: Record<string, string> = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-[3px]',
    lg: 'h-16 w-16 border-4',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Spinner ring */}
      <div className="relative">
        <div
          className={`animate-spin rounded-full border-slate-200 ${ringSize[size]}`}
          style={{ borderTopColor: '#2563eb' }}
        />
        {/* Glow */}
        <div className="absolute inset-0 rounded-full bg-blue-400/10 blur-md" />
      </div>
      {text && (
        <p className="text-sm font-semibold text-slate-400">{text}</p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex min-h-[240px] items-center justify-center py-12">
      {content}
    </div>
  );
};

export default LoadingSpinner;
