import { NextRequest, NextResponse } from 'next/server'
import { translationEngine } from '@/lib/translation-engine'
import { translateDish, translateDescriptionToChinese } from '@/lib/gemini'
import { detectAllergens } from '@/lib/allergens'
import { generateId } from '@/lib/utils'
import type { TranslationResult, APIResponse, StandardDish, EngineTranslationResult } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const dishName = (body.dishName || body.query || '').trim()
    const lang: 'zh' | 'en' = body.lang || 'zh'

    if (!dishName) {
      return NextResponse.json(
        { success: false, error: 'dishName is required', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    // Step 1: RAG 检索
    const engineResult = await translationEngine.translate(dishName)
    console.log(`[RAG] type=${engineResult.type} source=${engineResult.source} confidence=${engineResult.confidence}`)

    let translationResult: TranslationResult

    if (engineResult.dish && engineResult.type !== 'generated') {
      // RAG 命中，使用标准数据库数据
      translationResult = await buildResultFromStandardDish(engineResult, dishName, lang)
    } else {
      // RAG 未命中，走 Gemini 生成
      translationResult = await buildResultFromGemini(dishName, lang, engineResult)
    }

    const result: APIResponse<TranslationResult> = {
      success: true,
      data: translationResult,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Translation Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: `Translation failed: ${message}`, timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}

async function buildResultFromStandardDish(
  engineResult: EngineTranslationResult,
  dishName: string,
  lang: string,
): Promise<TranslationResult> {
  const dish = engineResult.dish!

  const ingredients = dish.ingredients_standard
  const allergenResult = detectAllergens(ingredients)
  const headlineEn = `The ${dish.name_en_standard} You've Been Dreaming About`
  const pairingSuggestionsEn = buildStandardPairingsEn(dish)
  const marketingHooksEn = [
    `The dish that made ${dish.cuisine} famous`,
    `Our most ordered ${dish.category.toLowerCase()}`,
    `One bite and you'll understand why`,
  ]
  const instagramCaptionEn = `🔥 ${dish.name_en_standard} — ${dish.description_short} #ChineseFood #${dish.cuisine} #FoodPorn`
  const doordashCaptionEn = `⚡ Best Seller: ${dish.name_en_standard} — ${dish.description_short.substring(0, 40)}...`

  const [
    descriptionShortCn,
    descriptionMarketingCn,
    headlineCn,
    pairingSuggestionsCn,
    marketingHooksCn,
    instagramCaptionCn,
    doordashCaptionCn,
    uniqueSellingPointsCn,
  ] = await Promise.all([
    translateDescriptionToChinese(dish.description_short, dish.name_en_standard, dish.name_cn),
    translateDescriptionToChinese(dish.description_marketing, dish.name_en_standard, dish.name_cn),
    translateDescriptionToChinese(headlineEn, dish.name_en_standard, dish.name_cn),
    translateListToChinese(pairingSuggestionsEn, dish.name_en_standard, dish.name_cn),
    translateListToChinese(marketingHooksEn, dish.name_en_standard, dish.name_cn),
    translateDescriptionToChinese(instagramCaptionEn, dish.name_en_standard, dish.name_cn),
    translateDescriptionToChinese(doordashCaptionEn, dish.name_en_standard, dish.name_cn),
    translateListToChinese([
      `Authentic ${dish.cuisine} recipe`,
      `Made fresh daily`,
      `Chef's signature dish`,
    ], dish.name_en_standard, dish.name_cn),
  ])

  const matchType = engineResult.type === 'exact_match' ? 'exact' as const : 'semantic' as const

  return {
    dish: {
      id: dish.id,
      name_cn: dish.name_cn,
      name_en: dish.name_en_standard,
      name_en_standard: dish.name_en_standard,
      category: dish.category,
      category_cn: getCategoryCn(dish.category),
      cuisine: dish.cuisine,
      ingredients,
      ingredients_cn: ingredients.map(getIngredientCn),
      ingredients_standard: dish.ingredients_standard,
      allergens: allergenResult.allergens.map((a) => ({
        name: a.name,
        type: a.category as 'dairy' | 'eggs' | 'fish' | 'shellfish' | 'tree_nuts' | 'peanuts' | 'wheat' | 'soy' | 'sesame',
        severity: a.severity,
        source: a.sources_found.join(', '),
        confidence: a.confidence,
      })),
      allergens_standard: dish.allergens_standard,
      detected_allergens: allergenResult,
      spice_level: dish.spice_level,
      description_short: dish.description_short,
      description_short_cn: descriptionShortCn,
      description_marketing: dish.description_marketing,
      description_marketing_cn: descriptionMarketingCn,
      translation_alternatives: dish.name_en_alternatives,
      source: dish.source,
      created_at: dish.created_at,
    },
    compliance: {
      fda_allergen_statement: allergenResult.fda_disclaimer,
      requires_warning: allergenResult.allergens.length > 0,
      warnings: [
        allergenResult.allergens.length > 0
          ? `Contains: ${allergenResult.allergens.map((a) => a.name).join(', ')}`
          : '',
        ...allergenResult.missing_checks.map((i) => `⚠️ "${i}" requires manual verification`),
      ].filter(Boolean),
      warnings_cn: [
        allergenResult.allergens.length > 0
          ? `包含：${allergenResult.allergens.map((a) => a.name_cn).join('、')}`
          : '',
        ...allergenResult.missing_checks.map((i) => `⚠️“${getIngredientCn(i)}”需要人工确认`),
      ].filter(Boolean),
      notes: dish.allergens_standard.map(a => `Contains: ${a}`),
      notes_cn: dish.allergens_standard.map(a => `包含：${getAllergenCn(a)}`),
    },
    marketing: {
      headline_en: headlineEn,
      headline_cn: headlineCn,
      description_en: dish.description_marketing,
      description_cn: descriptionMarketingCn,
      pairing_suggestions: pairingSuggestionsEn,
      pairing_suggestions_cn: pairingSuggestionsCn,
      tags: [dish.category, dish.cuisine, ...(dish.spice_level > 0 ? [`Spice Level ${dish.spice_level}`] : [])],
      tags_cn: [getCategoryCn(dish.category), getCuisineCn(dish.cuisine), ...(dish.spice_level > 0 ? [`辣度${dish.spice_level}`] : [])],
      marketing_hooks: {
        cn: marketingHooksCn,
        en: marketingHooksEn,
      },
      social_media_captions: {
        instagram_cn: instagramCaptionCn,
        instagram_en: instagramCaptionEn,
        doordash_cn: doordashCaptionCn,
        doordash_en: doordashCaptionEn,
      },
      unique_selling_points: [
        `Authentic ${dish.cuisine} recipe`,
        `Made fresh daily`,
        `Chef's signature dish`,
      ],
      unique_selling_points_cn: uniqueSellingPointsCn,
    },
    allergen_check: allergenResult,
    search_info: {
      query_used: dishName,
      match_type: matchType,
      match_score: engineResult.confidence,
      similar_dishes: (engineResult.similar_dishes || []).map(s => s.dish.name_en_standard),
    },
    confidence: engineResult.confidence,
    source: engineResult.source,
  }
}

async function buildResultFromGemini(
  dishName: string,
  lang: string,
  engineResult?: EngineTranslationResult,
): Promise<TranslationResult> {
  const llmResult = await translateDish({ query: dishName })

  const allergenResult = detectAllergens(llmResult.ingredients)

  const similarDishes = engineResult?.similar_dishes?.map(s => s.dish.name_en_standard) || []
  const resolvedDishNameCn = llmResult.name_cn || dishName

  const [
    descriptionShortCn,
    descriptionMarketingCn,
    marketingHeadlineCn,
    marketingDescriptionCn,
    marketingHooksCn,
    instagramCaptionCn,
    doordashCaptionCn,
    uniqueSellingPointsCn,
  ] = await Promise.all([
    translateDescriptionToChinese(llmResult.description_short, llmResult.name_en, resolvedDishNameCn),
    translateDescriptionToChinese(llmResult.description_marketing, llmResult.name_en, resolvedDishNameCn),
    translateDescriptionToChinese(llmResult.marketing_headline_en, llmResult.name_en, resolvedDishNameCn),
    translateDescriptionToChinese(llmResult.marketing_description_en, llmResult.name_en, resolvedDishNameCn),
    translateListToChinese(llmResult.marketing_hooks?.en || [], llmResult.name_en, resolvedDishNameCn),
    translateDescriptionToChinese(llmResult.social_media_captions?.instagram_en || '', llmResult.name_en, resolvedDishNameCn),
    translateDescriptionToChinese(llmResult.social_media_captions?.doordash_en || '', llmResult.name_en, resolvedDishNameCn),
    translateListToChinese(llmResult.unique_selling_points || [], llmResult.name_en, resolvedDishNameCn),
  ])

  return {
    dish: {
      id: generateId(),
      name_cn: resolvedDishNameCn,
      name_en: llmResult.name_en,
      category: llmResult.category,
      category_cn: llmResult.category_cn || getCategoryCn(llmResult.category),
      ingredients: llmResult.ingredients,
      ingredients_cn: buildChineseIngredients(llmResult.ingredients_cn, llmResult.ingredients),
      allergens: allergenResult.allergens.map((a) => ({
        name: a.name,
        type: a.category as 'dairy' | 'eggs' | 'fish' | 'shellfish' | 'tree_nuts' | 'peanuts' | 'wheat' | 'soy' | 'sesame',
        severity: a.severity,
        source: a.sources_found.join(', '),
        confidence: a.confidence,
      })),
      detected_allergens: allergenResult,
      spice_level: llmResult.spice_level,
      description_short: llmResult.description_short,
      description_short_cn: descriptionShortCn,
      description_marketing: llmResult.description_marketing,
      description_marketing_cn: descriptionMarketingCn,
      translation_alternatives: llmResult.translation_alternatives,
      created_at: new Date().toISOString(),
    },
    compliance: {
      fda_allergen_statement: allergenResult.fda_disclaimer,
      requires_warning: allergenResult.allergens.length > 0,
      warnings: [
        allergenResult.allergens.length > 0
          ? `Contains: ${allergenResult.allergens.map((a) => a.name).join(', ')}`
          : '',
        ...allergenResult.missing_checks.map((i) => `⚠️ "${i}" requires manual verification`),
      ].filter(Boolean),
      warnings_cn: [
        allergenResult.allergens.length > 0
          ? `包含：${allergenResult.allergens.map((a) => a.name_cn).join('、')}`
          : '',
        ...allergenResult.missing_checks.map((i) => {
          const index = llmResult.ingredients.findIndex((ing) => ing.toLowerCase() === i.toLowerCase())
          const cnName = index !== -1 && llmResult.ingredients_cn ? llmResult.ingredients_cn[index] : getIngredientCn(i)
          return `⚠️“${normalizeChineseLabel(cnName, getIngredientCn(i))}”需要人工确认`
        }),
      ].filter(Boolean),
      notes: llmResult.fda_notes || [],
      notes_cn: buildChineseNotes(llmResult.fda_notes_cn, llmResult.fda_notes || []),
    },
    marketing: {
      headline_en: llmResult.marketing_headline_en,
      headline_cn: marketingHeadlineCn,
      description_en: llmResult.marketing_description_en,
      description_cn: marketingDescriptionCn,
      pairing_suggestions: llmResult.pairing_suggestions || [],
      pairing_suggestions_cn: buildChineseTextList(llmResult.pairing_suggestions_cn, llmResult.pairing_suggestions || [], '推荐搭配米饭或清爽饮品。'),
      tags: llmResult.tags || [],
      tags_cn: buildChineseTextList(llmResult.tags_cn, llmResult.tags || [], '招牌推荐'),
      marketing_hooks: {
        en: llmResult.marketing_hooks?.en || [],
        cn: marketingHooksCn,
      },
      social_media_captions: {
        instagram_en: llmResult.social_media_captions?.instagram_en || '',
        instagram_cn: instagramCaptionCn,
        doordash_en: llmResult.social_media_captions?.doordash_en || '',
        doordash_cn: doordashCaptionCn,
      },
      unique_selling_points: llmResult.unique_selling_points || [],
      unique_selling_points_cn: uniqueSellingPointsCn,
    },
    allergen_check: allergenResult,
    search_info: {
      query_used: dishName,
      match_type: similarDishes.length > 0 ? 'partial' : 'none',
      match_score: engineResult?.confidence || 0,
      similar_dishes: similarDishes,
    },
  }
}

function getCategoryCn(category: string): string {
  const map: Record<string, string> = {
    Appetizer: '开胃菜',
    Soup: '汤品',
    'Main Course': '主菜',
    'Noodles/Rice': '面食/米饭',
    Dessert: '甜品',
    Beverage: '饮品',
  }
  return map[category] || category
}

function getCuisineCn(cuisine: string): string {
  const map: Record<string, string> = {
    Sichuan: '川菜',
    Cantonese: '粤菜',
    Shanghai: '沪菜',
    Beijing: '京菜',
    Hunan: '湘菜',
    Fujian: '闽菜',
    Fusion: '融合菜',
    Other: '其他',
  }
  return map[cuisine] || cuisine
}

function buildStandardHeadlineCn(dish: StandardDish): string {
  return `${dish.name_cn}——经典${getCuisineCn(dish.cuisine)}${getCategoryCn(dish.category)}`
}

function buildStandardShortDescriptionCn(dish: StandardDish): string {
  const ingredients = formatIngredientListZh(dish.ingredients_standard, 3)
  return `${dish.name_cn}以${ingredients}为主要特色，呈现地道${getCuisineCn(dish.cuisine)}风味。`
}

function buildStandardMarketingDescriptionCn(dish: StandardDish): string {
  const ingredients = formatIngredientListZh(dish.ingredients_standard, 4)
  const finishText = dish.spice_level > 0 ? '风味鲜明且层次丰富，适合作为菜单重点推荐。' : '整体口味协调，适合作为菜单重点推荐。'
  return `${dish.name_cn}选用${ingredients}精心烹制，突出${getCuisineCn(dish.cuisine)}菜的层次与香气，${finishText}`
}

function buildStandardHooksCn(dish: StandardDish): string[] {
  const firstIngredient = getIngredientCn(dish.ingredients_standard[0] || '')
  const secondIngredient = getIngredientCn(dish.ingredients_standard[1] || '')
  return [
    `${dish.name_cn}是经典${getCuisineCn(dish.cuisine)}代表菜品。`,
    `${firstIngredient}与${secondIngredient}搭配得当，风味层次鲜明。`,
    dish.spice_level > 0 ? `辣度${dish.spice_level}级，适合偏爱重口味的顾客。` : '口味平衡，适合大多数顾客。',
  ]
}

function buildStandardPairingsEn(dish: StandardDish): string[] {
  if (dish.category === 'Noodles/Rice') return ['Pairs well with a light soup or refreshing drink.']
  return ['Pairs well with rice.', 'Pairs well with a refreshing drink.']
}

function buildStandardPairingsCn(dish: StandardDish): string[] {
  if (dish.category === 'Noodles/Rice') return ['适合搭配清爽汤品或饮品。']
  return ['适合搭配米饭。', '适合搭配清爽饮品。']
}

function buildStandardInstagramCaptionCn(dish: StandardDish, shortDescription: string): string {
  return `🔥 ${dish.name_cn}｜${shortDescription} #${getCuisineCn(dish.cuisine)} #中餐 #美食推荐`
}

function buildStandardDoordashCaptionCn(dish: StandardDish, shortDescription: string): string {
  const summary = shortDescription.length > 22 ? `${shortDescription.slice(0, 22)}...` : shortDescription
  return `⚡热卖推荐｜${dish.name_cn}｜${summary}`
}

function formatIngredientListZh(ingredients: string[], limit: number): string {
  const translated = ingredients
    .slice(0, limit)
    .map(getIngredientCn)
    .filter(Boolean)

  if (translated.length === 0) return '精选食材'
  if (translated.length === 1) return translated[0]
  return translated.join('、')
}

function normalizeChineseLabel(value: string | undefined, fallback: string): string {
  const text = String(value || '').trim()
  if (!text) return fallback
  return /[\u3400-\u9fff]/.test(text) ? text : fallback
}

function getIngredientCn(ingredient: string): string {
  const map: Record<string, string> = {
    chicken: '鸡肉',
    'chicken breast': '鸡胸肉',
    beef: '牛肉',
    pork: '猪肉',
    'ground pork': '猪肉末',
    shrimp: '虾',
    fish: '鱼类',
    tofu: '豆腐',
    rice: '米饭',
    noodles: '面条',
    noodle: '面条',
    doubanjiang: '豆瓣酱',
    'sichuan peppercorn': '花椒',
    scallion: '葱',
    'chili oil': '辣椒油',
    'dried chili': '干辣椒',
    vinegar: '醋',
    sugar: '糖',
    garlic: '大蒜',
    ginger: '姜',
    soy: '大豆',
    soybeans: '大豆',
    'soy sauce': '酱油',
    wheat: '小麦',
    milk: '牛奶',
    dairy: '乳制品',
    eggs: '鸡蛋',
    egg: '鸡蛋',
    peanuts: '花生',
    peanut: '花生',
    sesame: '芝麻',
  }

  const raw = String(ingredient || '').trim()
  if (!raw) return '待确认食材'
  if (/[\u3400-\u9fff]/.test(raw)) return raw

  const lower = raw.toLowerCase()
  if (map[lower]) return map[lower]

  if (lower.endsWith('s') && map[lower.slice(0, -1)]) return map[lower.slice(0, -1)]

  return '待确认食材'
}

function getAllergenCn(allergen: string): string {
  const map: Record<string, string> = {
    milk: '牛奶',
    dairy: '牛奶',
    eggs: '鸡蛋',
    egg: '鸡蛋',
    fish: '鱼类',
    shellfish: '甲壳类海鲜',
    tree_nuts: '坚果',
    'tree nuts': '坚果',
    peanuts: '花生',
    peanut: '花生',
    wheat: '小麦',
    soy: '大豆',
    soybeans: '大豆',
    sesame: '芝麻',
  }

  const key = String(allergen || '').toLowerCase()
  return map[key] || '待确认过敏原'
}

function buildChineseIngredients(
  chineseValues: string[] | undefined,
  englishValues: string[],
): string[] {
  return englishValues.map((ingredient, index) =>
    normalizeChineseLabel(chineseValues?.[index], getIngredientCn(ingredient)),
  )
}

function buildChineseTextList(
  chineseValues: string[] | undefined,
  englishValues: string[],
  fallback: string,
): string[] {
  if (chineseValues && chineseValues.length > 0) {
    const normalized = chineseValues
      .map((item, index) => normalizeChineseLabel(item, translateCommonEnglishToChinese(englishValues[index]) || fallback))
      .filter(Boolean)
    if (normalized.length > 0) return normalized
  }

  return englishValues.length > 0
    ? englishValues.map((item) => translateCommonEnglishToChinese(item) || fallback)
    : []
}

function buildChineseNotes(chineseNotes: string[] | undefined, englishNotes: string[]): string[] {
  if (chineseNotes && chineseNotes.length > 0) {
    return chineseNotes.map((note, index) => normalizeChineseLabel(note, translateCommonEnglishToChinese(englishNotes[index]) || '请咨询门店确认详细说明。'))
  }

  return englishNotes.map((note) => translateCommonEnglishToChinese(note) || '请咨询门店确认详细说明。')
}

function normalizeChineseCaptions(captions?: {
  instagram_cn: string
  instagram_en: string
  doordash_cn: string
  doordash_en: string
}) {
  if (!captions) {
    return { instagram_cn: '', instagram_en: '', doordash_cn: '', doordash_en: '' }
  }

  return {
    instagram_cn: normalizeChineseLabel(captions.instagram_cn, ''),
    instagram_en: captions.instagram_en,
    doordash_cn: normalizeChineseLabel(captions.doordash_cn, ''),
    doordash_en: captions.doordash_en,
  }
}

async function translateListToChinese(
  values: string[],
  dishNameEn: string,
  dishNameCn: string,
): Promise<string[]> {
  return Promise.all(
    values.map(async (value) => {
      if (!value.trim()) return ''
      return translateDescriptionToChinese(value, dishNameEn, dishNameCn)
    }),
  )
}

function translateCommonEnglishToChinese(text: string | undefined): string | null {
  const raw = String(text || '').trim()
  if (!raw) return null
  if (/[\u3400-\u9fff]/.test(raw)) return raw

  const lower = raw.toLowerCase()
  if (lower.startsWith('contains:')) {
    const allergens = raw
      .replace(/contains:/i, '')
      .split(',')
      .map((item) => getAllergenCn(item.trim()))
      .filter(Boolean)
    return allergens.length > 0 ? `包含：${allergens.join('、')}` : '包含：待确认过敏原'
  }
  if (lower.includes('manual verification')) return '需要人工确认'
  if (lower.includes('spice level')) {
    const levelMatch = raw.match(/(\d+)/)
    return levelMatch ? `辣度${levelMatch[1]}` : '辣度待确认'
  }
  if (lower.includes('pairs well with rice')) return '适合搭配米饭。'
  if (lower.includes('pairs well with a refreshing drink')) return '适合搭配清爽饮品。'
  if (lower.includes('rice')) return '推荐搭配米饭'
  if (lower.includes('drink') || lower.includes('beverage')) return '推荐搭配清爽饮品'
  if (lower.includes('signature')) return '招牌推荐'
  if (lower.includes('popular') || lower.includes('best seller')) return '人气推荐'
  if (lower.includes('sichuan')) return '川菜'
  if (lower.includes('cantonese')) return '粤菜'
  if (lower.includes('shanghai')) return '沪菜'
  if (lower.includes('beijing')) return '京菜'
  if (lower.includes('hunan')) return '湘菜'
  if (lower.includes('fujian')) return '闽菜'
  if (lower.includes('fusion')) return '融合菜'
  if (lower.includes('appetizer')) return '开胃菜'
  if (lower.includes('main course')) return '主菜'
  if (lower.includes('dessert')) return '甜品'
  if (lower.includes('beverage')) return '饮品'

  return null
}
