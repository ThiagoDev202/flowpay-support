import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', title, subtitle, padding = 'md' }: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-8',
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className={`border-b border-slate-200 ${paddingStyles[padding]}`}>
          {title && <h3 className="text-xl font-semibold text-slate-800 tracking-tight">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500 mt-1 font-medium">{subtitle}</p>}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
    </div>
  )
}
