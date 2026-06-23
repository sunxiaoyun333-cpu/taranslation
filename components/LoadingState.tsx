'use client'

import { useLanguage } from './LanguageProvider'

const t = {
  zh: {
    label: '正在加载翻译结果',
    text: '加载中...',
  },
  en: {
    label: 'Loading translation results',
    text: 'Loading...',
  },
}

export default function LoadingState() {
  const { lang } = useLanguage()

  return (
    <div className="card animate-pulse" role="status" aria-label={t[lang].label}>
      {/** Title skeleton */}
      <div className="space-y-3">
        <div className="h-7 bg-gray-200 rounded w-2/3" />
        <div className="h-5 bg-gray-200 rounded w-1/3" />
      </div>

      {/** Description skeleton */}
      <div className="mt-6 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>

      {/** Tags skeleton */}
      <div className="mt-6 flex gap-2">
        <div className="h-6 bg-gray-200 rounded-full w-20" />
        <div className="h-6 bg-gray-200 rounded-full w-16" />
        <div className="h-6 bg-gray-200 rounded-full w-24" />
        <div className="h-6 bg-gray-200 rounded-full w-14" />
      </div>

      {/** Allergen skeleton */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 rounded-lg w-28" />
          <div className="h-8 bg-gray-200 rounded-lg w-24" />
        </div>
      </div>

      {/** Marketing skeleton */}
      <div className="mt-6 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-20 bg-gray-200 rounded-lg w-full" />
      </div>

      <span className="sr-only">{t[lang].text}</span>
    </div>
  )
}
