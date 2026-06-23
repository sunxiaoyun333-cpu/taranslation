'use client'

import { useState, useCallback } from 'react'
import LoadingState from './LoadingState'
import ResultCard from './ResultCard'
import ComplianceAlert from './ComplianceAlert'
import MarketingTips from './MarketingTips'
import { TranslationResultDual } from './TranslationResultDual'
import { useLanguage } from './LanguageProvider'
import type { TranslationResult } from '@/lib/types'

const t = {
  zh: {
    placeholder: '试试「麻婆豆腐」或「宫保鸡丁」',
    translate: '开始翻译',
    translating: '正在翻译...',
    translationFailed: '翻译失败',
    networkError: '网络错误，请重试。',
  },
  en: {
    placeholder: 'Try "Mapo tofu" or "Kung Pao Chicken"',
    translate: 'Translate',
    translating: 'Translating...',
    translationFailed: 'Translation failed',
    networkError: 'Network error. Please try again.',
  },
}

export default function SearchBar() {
  const { lang } = useLanguage()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TranslationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishName: query.trim(), lang }),
      })

      const data = await res.json()
      if (!data.success) {
        setError(data.error || t[lang].translationFailed)
      } else {
        setResult(data.data)
      }
    } catch {
      setError(t[lang].networkError)
    } finally {
      setLoading(false)
    }
  }, [query, lang])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t[lang].placeholder}
          className="input-field min-h-[56px] flex-1 text-base sm:text-lg"
          disabled={loading}
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="btn-primary min-h-[56px] px-8 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
        >
          {loading ? t[lang].translating : t[lang].translate}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-8">
          <LoadingState />
        </div>
      )}

      {result && (
        <div className="mx-auto mt-8 max-w-3xl space-y-6">
          {lang === 'zh' ? (
            <TranslationResultDual result={result} locale="zh" />
          ) : (
            <>
              <ResultCard dish={result.dish} />
              {result.compliance && (
                <ComplianceAlert compliance={result.compliance} allergenCheck={result.allergen_check} />
              )}
              {result.marketing && (
                <MarketingTips marketing={result.marketing} />
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}
