import { ReactNode } from 'react';

interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}

export default function PrimaryButton({ 
  children, 
  onClick, 
  type = 'button', 
  disabled = false,
  className = ''
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-6 py-3 rounded-2xl
        bg-gradient-to-r from-neon-purple to-neon-pink
        text-white font-semibold
        backdrop-blur-xl
        border border-white/30
        shadow-lg shadow-purple-500/50
        hover:shadow-xl hover:shadow-pink-500/50
        hover:scale-105
        active:scale-95
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  );
}
