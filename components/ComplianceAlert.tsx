'use client'

import { useContext } from 'react'
import { AllergenBadge } from './AllergenBadge'
import { LanguageContext } from './LanguageProvider'
import type { ComplianceInfo, AllergenCheckResult } from '@/lib/types'

const t = {
  zh: {
    title: '美国食品药品监督管理局过敏原合规',
    freeFrom: '不含：',
    fdaNotes: '监管备注：',
  },
  en: {
    title: 'FDA Allergen Compliance',
    freeFrom: 'Free from:',
    fdaNotes: 'FDA Notes:',
  },
}

interface ComplianceAlertProps {
  compliance: ComplianceInfo
  allergenCheck: AllergenCheckResult
}

export default function ComplianceAlert({ compliance, allergenCheck }: ComplianceAlertProps) {
  const ctx = useContext(LanguageContext)
  const lang: 'zh' | 'en' = ctx?.lang ?? 'zh'
  const isChinese = lang === 'zh'

  const warnings = isChinese
    ? compliance.warnings_cn.map((item) => normalizeChineseText(item, '请参考门店过敏原警告信息。'))
    : compliance.warnings
  const notes = isChinese
    ? compliance.notes_cn.map((item) => normalizeChineseText(item, '请咨询门店确认详细说明。'))
    : compliance.notes

  return (
    <div className="card border-l-4 border-l-amber-500">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⚠️</span>
        <h4 className="font-heading font-bold text-lg text-amber-800">
          {t[lang].title}
        </h4>
      </div>

      {/** Allergen Badges */}
      {allergenCheck.allergens.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {allergenCheck.allergens.map((allergen) => (
            <AllergenBadge key={allergen.id} allergen={allergen} showSources />
          ))}
        </div>
      )}

      {/** Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2 mb-4">
          {warnings.map((warning, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg text-sm ${
                warning.startsWith('⚠')
                  ? 'bg-amber-50 text-amber-800'
                  : 'bg-red-50 text-red-800 font-medium'
              }`}
            >
              {warning}
            </div>
          ))}
        </div>
      )}

      {/** Safe For */}
      {allergenCheck.safe_for.length > 0 && (
        <div className="p-3 bg-green-50 rounded-lg text-sm text-green-800">
          <strong>{t[lang].freeFrom}</strong>{' '}
          {isChinese
            ? allergenCheck.safe_for_cn?.map((item) => normalizeChineseText(item, '待确认')).join('、') || '待确认'
            : allergenCheck.safe_for.join(', ')}
        </div>
      )}

      {/** FDA Disclaimer */}
      <p className="mt-4 text-xs text-gray-400 leading-relaxed">
        {isChinese
          ? normalizeChineseText(allergenCheck.fda_disclaimer_cn, '该合规声明请参考英文原文。')
          : compliance.fda_allergen_statement}
      </p>

      {/** Notes */}
      {notes && notes.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <strong>{t[lang].fdaNotes}</strong> {notes.join('; ')}
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
