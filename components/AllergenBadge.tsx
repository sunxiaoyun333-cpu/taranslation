// components/AllergenBadge.tsx
'use client'

import { useContext } from 'react'
import { getAllergenEmoji } from '@/lib/allergens'
import { LanguageContext } from './LanguageProvider'
import type { AllergenInfo } from '@/lib/allergens'

const t = {
  zh: { from: '来源: ' },
  en: { from: 'from: ' },
}

interface AllergenBadgeProps {
  allergen: AllergenInfo
  showSources?: boolean
}

export function AllergenBadge({ allergen, showSources = false }: AllergenBadgeProps) {
  const ctx = useContext(LanguageContext)
  const lang = ctx?.lang ?? 'zh'
  const emoji = getAllergenEmoji(allergen.id)
  const chineseSources = (allergen.sources_found_cn || [])
    .map((item) => normalizeChineseText(item, '待确认来源食材'))
    .filter(Boolean)

  const severityColors = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-orange-100 text-orange-800 border-orange-300',
    low: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 ${severityColors[allergen.severity]}`}>
      <span className="text-lg">{emoji}</span>
      <div>
        <span className="font-semibold">
          {lang === 'zh' ? normalizeChineseText(allergen.name_cn, '待确认过敏原') : allergen.name}
        </span>
        {showSources && allergen.sources_found.length > 0 && (
          <span className="text-xs ml-2">
            ({t[lang].from}
            {lang === 'zh'
              ? (chineseSources.length > 0 ? chineseSources.join('、') : '待确认来源食材')
              : allergen.sources_found.join(', ')})
          </span>
        )}
      </div>
    </div>
  )
}

function normalizeChineseText(value: string | undefined, fallback: string) {
  const text = String(value || '').trim()
  if (!text) return fallback
  return /[\u3400-\u9fff]/.test(text) ? text : fallback
}
