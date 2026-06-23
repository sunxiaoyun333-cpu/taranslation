interface SourceBadgeProps {
  source: 'standards_db' | 'rag_vector' | 'hybrid' | 'gemini'
  type: 'exact_match' | 'fuzzy_match' | 'generated' | 'not_found'
}

export function SourceBadge({ source, type }: SourceBadgeProps) {
  const getBadgeStyle = () => {
    switch (source) {
      case 'standards_db':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'rag_vector':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'hybrid':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'gemini':
        return 'bg-pink-100 text-pink-800 border-pink-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getIcon = () => {
    switch (source) {
      case 'standards_db': return '📚'
      case 'rag_vector': return '🔍'
      case 'hybrid': return '🔀'
      case 'gemini': return '🤖'
      default: return '❓'
    }
  }

  const getLabel = () => {
    switch (source) {
      case 'standards_db': return 'Standards Database'
      case 'rag_vector': return 'Vector Search'
      case 'hybrid': return 'Hybrid (RAG + AI)'
      case 'gemini': return 'AI Generated'
      default: return 'Unknown'
    }
  }

  const getTypeLabel = () => {
    switch (type) {
      case 'exact_match': return 'Exact Match'
      case 'fuzzy_match': return 'Fuzzy Match'
      case 'generated': return 'Generated'
      case 'not_found': return 'Not Found'
      default: return ''
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getBadgeStyle()}`}>
        {getIcon()} {getLabel()}
      </span>
      <span className="text-xs text-gray-500">
        {getTypeLabel()}
      </span>
    </div>
  )
}
