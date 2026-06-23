import type { Locale } from '@/lib/i18n'

interface ConfidenceIndicatorProps {
  confidence: number
  locale?: Locale
}

export function ConfidenceIndicator({ confidence, locale }: ConfidenceIndicatorProps) {
  const percentage = Math.round(confidence * 100)
  const isZh = locale === 'zh'

  const getColor = () => {
    if (confidence >= 0.9) return 'bg-green-500'
    if (confidence >= 0.7) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getTextColor = () => {
    if (confidence >= 0.9) return 'text-green-700'
    if (confidence >= 0.7) return 'text-yellow-700'
    return 'text-red-700'
  }

  const getLabel = () => {
    if (isZh) {
      if (confidence >= 0.9) return '高置信度'
      if (confidence >= 0.7) return '中等置信度'
      return '低置信度'
    }
    if (confidence >= 0.9) return 'High Confidence'
    if (confidence >= 0.7) return 'Medium Confidence'
    return 'Low Confidence'
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-end">
        <span className={`text-sm font-semibold ${getTextColor()}`}>
          {getLabel()}
        </span>
        <span className="text-xs text-gray-500">{percentage}%</span>
      </div>
      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
