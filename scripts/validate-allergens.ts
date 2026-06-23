// scripts/validate-dish.ts
import { detectAllergens } from '../lib/allergens'

function validateDish(dish: any) {
  // 1. 自动检测
  const detected = detectAllergens(dish.ingredients)
  
  // 2. 对比手动标注
  const manualAllergens = new Set<string>(dish.allergens.map((a: any) => a.type as string))
  const detectedAllergens = new Set<string>(detected.allergens.map((a: any) => a.category as string))
  
  // 3. 找出差异
  const missing = [...detectedAllergens].filter(x => !manualAllergens.has(x))
  const extra = [...manualAllergens].filter(x => !detectedAllergens.has(x))
  
  if (missing.length > 0) {
    console.warn(`⚠️ ${dish.name_cn}: Missing allergens in manual tags:`, missing)
  }
  
  if (extra.length > 0) {
    console.warn(`⚠️ ${dish.name_cn}: Extra allergens in manual tags:`, extra)
  }
  
  if (detected.missing_checks.length > 0) {
    console.warn(`❓ ${dish.name_cn}: Unknown ingredients need review:`, detected.missing_checks)
  }
  
  return {
    valid: missing.length === 0 && extra.length === 0,
    detected,
    missing,
    extra
  }
}
