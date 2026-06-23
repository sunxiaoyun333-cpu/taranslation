// lib/allergens.ts

import allergensData from '@/data/allergens-fda.json'
import ingredientsMap from '@/data/ingredients-allergens-map.json'
import type { AllergenInfo, AllergenCheckResult } from '@/lib/types'

export type { AllergenInfo, AllergenCheckResult }

/**
 * 检测食材列表中的所有过敏原
 */
export function detectAllergens(ingredients: string[]): AllergenCheckResult {
  const allergenMap = new Map<string, AllergenInfo>()
  const missingChecks: string[] = []
  
  // 规范化食材名称（转小写，去空格）
  const normalizedIngredients = ingredients.map(i => 
    i.toLowerCase().trim()
  )
  
  // 遍历每个食材
  for (const ingredient of normalizedIngredients) {
    const mapping = ingredientsMap.ingredients.find(item => 
      item.name_en.toLowerCase() === ingredient ||
      item.name_cn === ingredient
    )
    
    if (mapping) {
      for (const allergenId of mapping.allergens) {
        if (!allergenMap.has(allergenId)) {
          const allergenData = allergensData.major_allergens.find(
            a => a.id === allergenId
          )
          
          if (allergenData) {
            allergenMap.set(allergenId, {
              id: allergenData.id,
              name: allergenData.name,
              name_cn: allergenData.name_cn,
              category: allergenData.category,
              fda_code: allergenData.fda_code,
              warning_text: allergenData.warning_text,
              severity: allergenData.severity as AllergenInfo['severity'],
              sources_found: [ingredient],
              sources_found_cn: [mapping.name_cn],
              confidence: mapping.confidence as AllergenInfo['confidence']
            })
          }
        } else {
          const existing = allergenMap.get(allergenId)!
          existing.sources_found.push(ingredient)
          existing.sources_found_cn.push(mapping.name_cn)
        }
      }
    } else {
      // 未找到映射，标记为需要手动检查
      missingChecks.push(ingredient)
    }
  }
  
  // 计算safe_for（不含的主要过敏原）
  const detectedIds = new Set(allergenMap.keys())
  const safeFor = allergensData.major_allergens
    .filter(a => !detectedIds.has(a.id))
    .map(a => a.name)
  const safeForCn = allergensData.major_allergens
    .filter(a => !detectedIds.has(a.id))
    .map(a => a.name_cn)
  
  return {
    allergens: Array.from(allergenMap.values()),
    missing_checks: missingChecks,
    fda_disclaimer: allergensData.fda_disclaimer,
    fda_disclaimer_cn: (allergensData as unknown as Record<string, string>).fda_disclaimer_cn || allergensData.fda_disclaimer,
    safe_for: safeFor,
    safe_for_cn: safeForCn,
  }
}

/**
 * 生成FDA合规的过敏原声明
 */
export function generateAllergenStatement(result: AllergenCheckResult): string {
  if (result.allergens.length === 0) {
    return 'This dish does not contain any of the major FDA-recognized allergens.'
  }
  
  const allergenNames = result.allergens
    .map(a => a.name)
    .join(', ')
    .replace(/, ([^,]*)$/, ' and $1') // 最后一个用 "and"
  
  let statement = `Contains: ${allergenNames}.`
  
  if (result.missing_checks.length > 0) {
    statement += ` Note: Some ingredients (${result.missing_checks.join(', ')}) require verification.`
  }
  
  return statement
}

/**
 * 检查特定过敏原
 */
export function checkForAllergen(
  ingredients: string[], 
  allergenId: string
): boolean {
  const result = detectAllergens(ingredients)
  return result.allergens.some(a => a.id === allergenId)
}

/**
 * 获取所有FDA认定的过敏原
 */
export function getAllFDAAllergens() {
  return allergensData.major_allergens
}

/**
 * 生成过敏原图标Emoji
 */
export function getAllergenEmoji(allergenId: string): string {
  const emojiMap: Record<string, string> = {
    milk: '🥛',
    eggs: '🥚',
    fish: '🐟',
    shellfish: '🦐',
    tree_nuts: '🌰',
    peanuts: '🥜',
    wheat: '🌾',
    soybeans: '🫘',
    sesame: '🌱'
  }
  
  return emojiMap[allergenId] || '⚠️'
}
