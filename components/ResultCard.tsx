'use client'

import { AllergenBadge } from './AllergenBadge'
import { getSpiceLabel, getSpiceEmoji } from '@/lib/utils'
import { useLanguage } from './LanguageProvider'
import type { Dish } from '@/lib/types'

const t = {
  zh: {
    alsoKnownAs: '别名',
    mainIngredients: '主要食材',
    allergensDetected: '过敏原检测',
  },
  en: {
    alsoKnownAs: 'Also Known As',
    mainIngredients: 'Main Ingredients',
    allergensDetected: 'Allergens Detected',
  },
}

interface ResultCardProps {
  dish: Dish
}

export default function ResultCard({ dish }: ResultCardProps) {
  const { lang } = useLanguage()
  const isChinese = lang === 'zh'
  const primaryName = isChinese
    ? normalizeChineseText(dish.name_cn, '待确认中文菜名')
    : (dish.name_en_standard || dish.name_en || 'Unnamed dish')
  const secondaryName = isChinese
    ? (dish.name_en_standard || dish.name_en || 'Unnamed dish')
    : normalizeChineseText(dish.name_cn, '待确认中文菜名')
  const categoryLabel = isChinese
    ? normalizeChineseText(dish.category_cn, '其他分类')
    : dish.category
  const shortDescription = isChinese
    ? normalizeChineseText(dish.description_short_cn, '待补充中文简短描述')
    : dish.description_short
  const marketingDescription = isChinese
    ? normalizeChineseText(dish.description_marketing_cn, '')
    : dish.description_marketing
  const ingredientLabels = (isChinese ? dish.ingredients_cn : dish.ingredients)
    .map((ingredient) => isChinese ? normalizeChineseText(ingredient, '待确认食材') : ingredient)
    .filter(Boolean)

  return (
    <div className="card">
      {/** Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-heading font-bold text-gray-900">
            {primaryName}
          </h3>
          <p className="text-lg text-gray-500 mt-1">
            {secondaryName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="tag bg-primary-50 text-primary-700">
            {categoryLabel}
          </span>
          {dish.spice_level > 0 && (
            <span className="tag bg-red-50 text-red-700" title={getSpiceLabel(dish.spice_level)}>
              {getSpiceEmoji(dish.spice_level)}
            </span>
          )}
        </div>
      </div>

      {/** Description */}
      <p className="mt-4 text-gray-700 leading-relaxed">
        {shortDescription}
      </p>
      {marketingDescription && (
        <p className="mt-2 text-gray-600 text-sm italic leading-relaxed">
          {marketingDescription}
        </p>
      )}

      {/** Alternate Names */}
      {dish.translation_alternatives && dish.translation_alternatives.length > 0 && (
        <div className="mt-4">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {t[lang].alsoKnownAs}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {dish.translation_alternatives.map((alt) => (
              <span key={alt} className="tag bg-gray-100 text-gray-700">
                {alt}
              </span>
            ))}
          </div>
        </div>
      )}

      {/** Ingredients */}
      {dish.ingredients && dish.ingredients.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {t[lang].mainIngredients}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {ingredientLabels.map((ingredient) => (
              <span key={ingredient} className="tag bg-green-50 text-green-700 border border-green-200">
                {ingredient}
              </span>
            ))}
          </div>
        </div>
      )}

      {/** Allergens */}
      {dish.detected_allergens && dish.detected_allergens.allergens.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {t[lang].allergensDetected}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {dish.detected_allergens.allergens.map((allergen) => (
              <AllergenBadge key={allergen.id} allergen={allergen} showSources />
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
