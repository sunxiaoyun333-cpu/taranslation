'use client'

import { useLanguage } from './LanguageProvider'
import type { MarketingInfo } from '@/lib/types'

const t = {
  zh: {
    title: '营销建议',
    headline: '营销标题',
    description: '营销描述',
    pairingSuggestions: '搭配建议',
    menuTags: '菜单标签',
  },
  en: {
    title: 'Marketing Suggestions',
    headline: 'Marketing Headline',
    description: 'Marketing Description',
    pairingSuggestions: 'Pairing Suggestions',
    menuTags: 'Menu Tags',
  },
}

interface MarketingTipsProps {
  marketing: MarketingInfo
}

export default function MarketingTips({ marketing }: MarketingTipsProps) {
  const { lang } = useLanguage()
  const isChinese = lang === 'zh'

  const headline = isChinese
    ? normalizeChineseText(marketing.headline_cn, '待补充中文标题')
    : marketing.headline_en
  const description = isChinese
    ? normalizeChineseText(marketing.description_cn, '待补充中文描述')
    : marketing.description_en
  const pairings = isChinese
    ? marketing.pairing_suggestions_cn.map((item) => normalizeChineseText(item, '推荐搭配米饭或清爽饮品。'))
    : marketing.pairing_suggestions
  const tagList = isChinese
    ? marketing.tags_cn.map((item) => normalizeChineseText(item, '招牌推荐'))
    : marketing.tags

  return (
    <div className="card bg-gradient-to-br from-accent-50 to-white border-accent-200">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">💡</span>
        <h4 className="font-heading font-bold text-lg text-accent-800">
          {t[lang].title}
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/** Headline */}
        {headline && (
          <div className="p-4 bg-white rounded-lg border border-accent-200">
            <p className="text-xs font-medium text-accent-600 uppercase tracking-wide mb-1">
              {t[lang].headline}
            </p>
            <p className="text-gray-900 font-medium">{headline}</p>
          </div>
        )}

        {/** Description */}
        {description && (
          <div className="p-4 bg-white rounded-lg border border-accent-200 sm:col-span-2">
            <p className="text-xs font-medium text-accent-600 uppercase tracking-wide mb-1">
              {t[lang].description}
            </p>
            <p className="text-gray-700 text-sm leading-relaxed">{description}</p>
          </div>
        )}
      </div>

      {/** Pairing Suggestions */}
      {pairings && pairings.length > 0 && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-accent-200">
          <p className="text-xs font-medium text-accent-600 uppercase tracking-wide mb-2">
            {t[lang].pairingSuggestions}
          </p>
          <div className="flex flex-wrap gap-2">
            {pairings.map((pairing: string) => (
              <span key={pairing} className="tag bg-accent-50 text-accent-800">
                {pairing}
              </span>
            ))}
          </div>
        </div>
      )}

      {/** Tags */}
      {tagList && tagList.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-accent-600 uppercase tracking-wide mb-2">
            {t[lang].menuTags}
          </p>
          <div className="flex flex-wrap gap-2">
            {tagList.map((tag: string) => (
              <span key={tag} className="tag bg-accent-100 text-accent-700">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function normalizeChineseText(value: string | undefined, fallback: string) {
  const text = String(value || '').trim()
  if (!text) return fallback
  return /[\u3400-\u9fff]/.test(text) ? text : fallback
}
