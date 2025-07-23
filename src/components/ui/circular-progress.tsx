"use client"

interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function CircularProgress({ 
  percentage, 
  size = 20, 
  strokeWidth = 2, 
  className = "" 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // Yüzdeye göre renk belirle
  const getProgressColor = (percent: number) => {
    if (percent === 100) return "#10b981" // green-500
    if (percent >= 70) return "#3b82f6" // blue-500
    if (percent >= 40) return "#f59e0b" // amber-500
    return "#ef4444" // red-500
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getProgressColor(percentage)}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
    </div>
  )
}