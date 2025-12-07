import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function GlassCard({ children, className = '', onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        backdrop-blur-2xl 
        bg-white/40 dark:bg-white/5 
        border border-black/5 dark:border-white/10
        text-slate-900 dark:text-white
        rounded-3xl p-8
        shadow-xl shadow-black/5 dark:shadow-black/20
        hover:shadow-neon-purple/20 hover:border-black/10 dark:hover:border-white/20 hover:bg-white/50 dark:hover:bg-white/10 hover:scale-[1.01]
        transition-all duration-300 ease-out
        ${onClick ? 'cursor-pointer active:scale-95' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
