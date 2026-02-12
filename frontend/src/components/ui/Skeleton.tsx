interface SkeletonProps {
  className?: string
  width?: string
  height?: string
  variant?: 'text' | 'circular' | 'rectangular'
}

export function Skeleton({
  className = '',
  width = 'w-full',
  height = 'h-4',
  variant = 'rectangular'
}: SkeletonProps) {
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  }

  return (
    <div
      className={`animate-pulse bg-gray-200 ${width} ${height} ${variantStyles[variant]} ${className}`}
      aria-label="Loading"
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <Skeleton height="h-6" width="w-1/3" className="mb-2" />
      <Skeleton height="h-8" width="w-1/2" className="mb-4" />
      <Skeleton height="h-4" width="w-full" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton width="w-1/4" />
          <Skeleton width="w-1/4" />
          <Skeleton width="w-1/4" />
          <Skeleton width="w-1/4" />
        </div>
      ))}
    </div>
  )
}
