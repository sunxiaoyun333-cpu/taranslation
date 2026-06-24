import { NextRequest, NextResponse } from 'next/server'
import { translationEngine } from '@/lib/translation-engine'
import {
  translateDish,
  translateDescriptionToChinese,
  generateStandardDishMarketing,
  ensureChineseMatchesEnglish,
  ensureChineseListMatchesEnglish,
} from '@/lib/gemini'
import { detectAllergens } from '@/lib/allergens'
import { generateId } from '@/lib/utils'
import type {
  APIResponse,
  EngineTranslationResult,
  StandardDish,
  TranslationResult,
} from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const dishName = (body.dishName || body.query || '').trim()

    if (!dishName) {
      return NextResponse.json(
        { success: false, error: 'dishName is required', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    const engineResult = await translationEngine.translate(dishName)
    console.log(
      `[RAG] type=${engineResult.type} source=${engineResult.source} confidence=${engineResult.confidence}`
    )

    const translationResult =
      engineResult.dish && engineResult.type !== 'generated'
        ? await buildResultFromStandardDish(engineResult, dishName)
        : await buildResultFromGemini(dishName, engineResult)

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
  dishName: string
): Promise<TranslationResult> {
  const dish = engineResult.dish!
  const ingredients = dish.ingredients_standard
  const allergenResult = detectAllergens(ingredients)
  const englishMarketing = await buildDynamicMarketingForStandardDish(dish)

  const [
    descriptionShortCn,
    descriptionMarketingCn,
    headlineCn,
    marketingDescriptionCn,
    pairingSuggestionsCn,
    marketingHooksCn,
    instagramCaptionCn,
    doordashCaptionCn,
    uniqueSellingPointsCn,
  ] = await Promise.all([
    translateDescriptionToChinese(dish.description_short, dish.name_en_standard, dish.name_cn),
    translateDescriptionToChinese(dish.description_marketing, dish.name_en_standard, dish.name_cn),
    translateDescriptionToChinese(englishMarketing.headline_en, dish.name_en_standard, dish.name_cn),
    translateDescriptionToChinese(englishMarketing.description_en, dish.name_en_standard, dish.name_cn),
    translateListToChinese(englishMarketing.pairing_suggestions, dish.name_en_standard, dish.name_cn),
    translateListToChinese(englishMarketing.marketing_hooks, dish.name_en_standard, dish.name_cn),
    translateDescriptionToChinese(englishMarketing.instagram_caption, dish.name_en_standard, dish.name_cn),
    translateDescriptionToChinese(englishMarketing.doordash_caption, dish.name_en_standard, dish.name_cn),
    translateListToChinese(englishMarketing.unique_selling_points, dish.name_en_standard, dish.name_cn),
  ])

  const [
    alignedDescriptionShortCn,
    alignedDescriptionMarketingCn,
    alignedHeadlineCn,
    alignedMarketingDescriptionCn,
    alignedPairingSuggestionsCn,
    alignedMarketingHooksCn,
    alignedInstagramCaptionCn,
    alignedDoordashCaptionCn,
    alignedUniqueSellingPointsCn,
  ] = await Promise.all([
    ensureChineseMatchesEnglish(dish.description_short, descriptionShortCn, dish.name_en_standard, dish.name_cn),
    ensureChineseMatchesEnglish(dish.description_marketing, descriptionMarketingCn, dish.name_en_standard, dish.name_cn),
    ensureChineseMatchesEnglish(englishMarketing.headline_en, headlineCn, dish.name_en_standard, dish.name_cn),
    ensureChineseMatchesEnglish(englishMarketing.description_en, marketingDescriptionCn, dish.name_en_standard, dish.name_cn),
    ensureChineseListMatchesEnglish(englishMarketing.pairing_suggestions, pairingSuggestionsCn, dish.name_en_standard, dish.name_cn),
    ensureChineseListMatchesEnglish(englishMarketing.marketing_hooks, marketingHooksCn, dish.name_en_standard, dish.name_cn),
    ensureChineseMatchesEnglish(englishMarketing.instagram_caption, instagramCaptionCn, dish.name_en_standard, dish.name_cn),
    ensureChineseMatchesEnglish(englishMarketing.doordash_caption, doordashCaptionCn, dish.name_en_standard, dish.name_cn),
    ensureChineseListMatchesEnglish(englishMarketing.unique_selling_points, uniqueSellingPointsCn, dish.name_en_standard, dish.name_cn),
  ])

  const matchType = engineResult.type === 'exact_match' ? 'exact' : 'semantic'

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
        type: a.category as
          | 'dairy'
          | 'eggs'
          | 'fish'
          | 'shellfish'
          | 'tree_nuts'
          | 'peanuts'
          | 'wheat'
          | 'soy'
          | 'sesame',
        severity: a.severity,
        source: a.sources_found.join(', '),
        confidence: a.confidence,
      })),
      allergens_standard: dish.allergens_standard,
      detected_allergens: allergenResult,
      spice_level: dish.spice_level,
      description_short: dish.description_short,
      description_short_cn: alignedDescriptionShortCn,
      description_marketing: dish.description_marketing,
      description_marketing_cn: alignedDescriptionMarketingCn,
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
        ...allergenResult.missing_checks.map((item) => `⚠️ "${item}" requires manual verification`),
      ].filter(Boolean),
      warnings_cn: [
        allergenResult.allergens.length > 0
          ? `包含：${allergenResult.allergens.map((a) => a.name_cn).join('、')}`
          : '',
        ...allergenResult.missing_checks.map(
          (item) => `⚠️ “${getIngredientCn(item)}” 需要人工确认`
        ),
      ].filter(Boolean),
      notes: dish.allergens_standard.map((item) => `Contains: ${item}`),
      notes_cn: dish.allergens_standard.map((item) => `包含：${getAllergenCn(item)}`),
    },
    marketing: {
      headline_en: englishMarketing.headline_en,
      headline_cn: alignedHeadlineCn,
      description_en: englishMarketing.description_en,
      description_cn: alignedMarketingDescriptionCn,
      pairing_suggestions: englishMarketing.pairing_suggestions,
      pairing_suggestions_cn: alignedPairingSuggestionsCn,
      tags: englishMarketing.tags,
      tags_cn: buildChineseTextList(undefined, englishMarketing.tags, '招牌推荐'),
      marketing_hooks: {
        cn: alignedMarketingHooksCn,
        en: englishMarketing.marketing_hooks,
      },
      social_media_captions: {
        instagram_cn: alignedInstagramCaptionCn,
        instagram_en: englishMarketing.instagram_caption,
        doordash_cn: alignedDoordashCaptionCn,
        doordash_en: englishMarketing.doordash_caption,
      },
      unique_selling_points: englishMarketing.unique_selling_points,
      unique_selling_points_cn: alignedUniqueSellingPointsCn,
    },
    allergen_check: allergenResult,
    search_info: {
      query_used: dishName,
      match_type: matchType,
      match_score: engineResult.confidence,
      similar_dishes: (engineResult.similar_dishes || []).map((s) => s.dish.name_en_standard),
    },
    confidence: engineResult.confidence,
    source: engineResult.source,
  }
}

async function buildResultFromGemini(
  dishName: string,
  engineResult?: EngineTranslationResult
): Promise<TranslationResult> {
  const llmResult = await translateDish({ query: dishName })
  const allergenResult = detectAllergens(llmResult.ingredients)
  const similarDishes = engineResult?.similar_dishes?.map((s) => s.dish.name_en_standard) || []
  const resolvedDishNameCn = llmResult.name_cn || dishName

  const [
    descriptionShortCn,
    descriptionMarketingCn,
    marketingHeadlineCn,
    marketingDescriptionCn,
    pairingSuggestionsCn,
    tagsCn,
    marketingHooksCn,
    instagramCaptionCn,
    doordashCaptionCn,
    uniqueSellingPointsCn,
    fdaNotesCn,
  ] = await Promise.all([
    translateDescriptionToChinese(llmResult.description_short, llmResult.name_en, resolvedDishNameCn),
    translateDescriptionToChinese(
      llmResult.description_marketing,
      llmResult.name_en,
      resolvedDishNameCn
    ),
    translateDescriptionToChinese(
      llmResult.marketing_headline_en,
      llmResult.name_en,
      resolvedDishNameCn
    ),
    translateDescriptionToChinese(
      llmResult.marketing_description_en,
      llmResult.name_en,
      resolvedDishNameCn
    ),
    translateListToChinese(llmResult.pairing_suggestions || [], llmResult.name_en, resolvedDishNameCn),
    translateListToChinese(llmResult.tags || [], llmResult.name_en, resolvedDishNameCn),
    translateListToChinese(llmResult.marketing_hooks?.en || [], llmResult.name_en, resolvedDishNameCn),
    translateDescriptionToChinese(
      llmResult.social_media_captions?.instagram_en || '',
      llmResult.name_en,
      resolvedDishNameCn
    ),
    translateDescriptionToChinese(
      llmResult.social_media_captions?.doordash_en || '',
      llmResult.name_en,
      resolvedDishNameCn
    ),
    translateListToChinese(llmResult.unique_selling_points || [], llmResult.name_en, resolvedDishNameCn),
    translateListToChinese(llmResult.fda_notes || [], llmResult.name_en, resolvedDishNameCn),
  ])

  const [
    alignedDescriptionShortCn,
    alignedDescriptionMarketingCn,
    alignedMarketingHeadlineCn,
    alignedMarketingDescriptionCn,
    alignedPairingSuggestionsCn,
    alignedTagsCn,
    alignedMarketingHooksCn,
    alignedInstagramCaptionCn,
    alignedDoordashCaptionCn,
    alignedUniqueSellingPointsCn,
    alignedFdaNotesCn,
  ] = await Promise.all([
    ensureChineseMatchesEnglish(llmResult.description_short, descriptionShortCn, llmResult.name_en, resolvedDishNameCn),
    ensureChineseMatchesEnglish(llmResult.description_marketing, descriptionMarketingCn, llmResult.name_en, resolvedDishNameCn),
    ensureChineseMatchesEnglish(llmResult.marketing_headline_en, marketingHeadlineCn, llmResult.name_en, resolvedDishNameCn),
    ensureChineseMatchesEnglish(llmResult.marketing_description_en, marketingDescriptionCn, llmResult.name_en, resolvedDishNameCn),
    ensureChineseListMatchesEnglish(llmResult.pairing_suggestions || [], pairingSuggestionsCn, llmResult.name_en, resolvedDishNameCn),
    ensureChineseListMatchesEnglish(llmResult.tags || [], tagsCn, llmResult.name_en, resolvedDishNameCn),
    ensureChineseListMatchesEnglish(llmResult.marketing_hooks?.en || [], marketingHooksCn, llmResult.name_en, resolvedDishNameCn),
    ensureChineseMatchesEnglish(llmResult.social_media_captions?.instagram_en || '', instagramCaptionCn, llmResult.name_en, resolvedDishNameCn),
    ensureChineseMatchesEnglish(llmResult.social_media_captions?.doordash_en || '', doordashCaptionCn, llmResult.name_en, resolvedDishNameCn),
    ensureChineseListMatchesEnglish(llmResult.unique_selling_points || [], uniqueSellingPointsCn, llmResult.name_en, resolvedDishNameCn),
    ensureChineseListMatchesEnglish(llmResult.fda_notes || [], fdaNotesCn, llmResult.name_en, resolvedDishNameCn),
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
        type: a.category as
          | 'dairy'
          | 'eggs'
          | 'fish'
          | 'shellfish'
          | 'tree_nuts'
          | 'peanuts'
          | 'wheat'
          | 'soy'
          | 'sesame',
        severity: a.severity,
        source: a.sources_found.join(', '),
        confidence: a.confidence,
      })),
      detected_allergens: allergenResult,
      spice_level: llmResult.spice_level,
      description_short: llmResult.description_short,
      description_short_cn: alignedDescriptionShortCn,
      description_marketing: llmResult.description_marketing,
      description_marketing_cn: alignedDescriptionMarketingCn,
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
        ...allergenResult.missing_checks.map((item) => `⚠️ "${item}" requires manual verification`),
      ].filter(Boolean),
      warnings_cn: [
        allergenResult.allergens.length > 0
          ? `包含：${allergenResult.allergens.map((a) => a.name_cn).join('、')}`
          : '',
        ...allergenResult.missing_checks.map((item) => {
          const index = llmResult.ingredients.findIndex(
            (ingredient) => ingredient.toLowerCase() === item.toLowerCase()
          )
          const cnName =
            index !== -1 && llmResult.ingredients_cn
              ? llmResult.ingredients_cn[index]
              : getIngredientCn(item)
          return `⚠️ “${normalizeChineseLabel(cnName, getIngredientCn(item))}” 需要人工确认`
        }),
      ].filter(Boolean),
      notes: llmResult.fda_notes || [],
      notes_cn:
        alignedFdaNotesCn.length > 0
          ? alignedFdaNotesCn
          : buildChineseNotes(undefined, llmResult.fda_notes || []),
    },
    marketing: {
      headline_en: llmResult.marketing_headline_en,
      headline_cn: alignedMarketingHeadlineCn,
      description_en: llmResult.marketing_description_en,
      description_cn: alignedMarketingDescriptionCn,
      pairing_suggestions: llmResult.pairing_suggestions || [],
      pairing_suggestions_cn:
        alignedPairingSuggestionsCn.length > 0
          ? alignedPairingSuggestionsCn
          : buildChineseTextList(undefined, llmResult.pairing_suggestions || [], '推荐搭配米饭或清爽饮品'),
      tags: llmResult.tags || [],
      tags_cn:
        alignedTagsCn.length > 0
          ? alignedTagsCn
          : buildChineseTextList(undefined, llmResult.tags || [], '招牌推荐'),
      marketing_hooks: {
        en: llmResult.marketing_hooks?.en || [],
        cn: alignedMarketingHooksCn,
      },
      social_media_captions: {
        instagram_en: llmResult.social_media_captions?.instagram_en || '',
        instagram_cn: alignedInstagramCaptionCn,
        doordash_en: llmResult.social_media_captions?.doordash_en || '',
        doordash_cn: alignedDoordashCaptionCn,
      },
      unique_selling_points: llmResult.unique_selling_points || [],
      unique_selling_points_cn: alignedUniqueSellingPointsCn,
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

async function buildDynamicMarketingForStandardDish(dish: StandardDish) {
  const fallback = buildStandardMarketingFallback(dish)

  try {
    const generated = await generateStandardDishMarketing({
      name_en: dish.name_en_standard,
      name_cn: dish.name_cn,
      category: dish.category,
      cuisine: dish.cuisine,
      spice_level: dish.spice_level,
      ingredients: dish.ingredients_standard,
      description_short: dish.description_short,
      description_marketing: dish.description_marketing,
    })

    return {
      headline_en: generated.headline_en || fallback.headline_en,
      description_en: generated.description_en || fallback.description_en,
      pairing_suggestions:
        generated.pairing_suggestions && generated.pairing_suggestions.length > 0
          ? generated.pairing_suggestions
          : fallback.pairing_suggestions,
      tags: generated.tags && generated.tags.length > 0 ? generated.tags : fallback.tags,
      marketing_hooks:
        generated.marketing_hooks && generated.marketing_hooks.length > 0
          ? generated.marketing_hooks
          : fallback.marketing_hooks,
      instagram_caption: generated.instagram_caption || fallback.instagram_caption,
      doordash_caption: generated.doordash_caption || fallback.doordash_caption,
      unique_selling_points:
        generated.unique_selling_points && generated.unique_selling_points.length > 0
          ? generated.unique_selling_points
          : fallback.unique_selling_points,
    }
  } catch (error) {
    console.warn('Dynamic marketing generation failed, using fallback:', error)
    return fallback
  }
}

function buildStandardMarketingFallback(dish: StandardDish) {
  return {
    headline_en: `Why Guests Crave ${dish.name_en_standard}`,
    description_en: dish.description_marketing,
    pairing_suggestions: buildStandardPairingsEn(dish),
    tags: [dish.category, dish.cuisine, ...(dish.spice_level > 0 ? [`Spice Level ${dish.spice_level}`] : [])],
    marketing_hooks: [
      `${getCuisineEnLabel(dish.cuisine)} flavor with real depth and character`,
      `A signature ${dish.category.toLowerCase()} guests come back for`,
      `Built for the kind of craving that starts after one bite`,
    ],
    instagram_caption: `🔥 ${dish.name_en_standard} brings bold flavor, texture, and serious comfort in every bite. #ChineseFood #${dish.cuisine} #MustOrder`,
    doordash_caption: `${dish.name_en_standard} Worth Reordering`,
    unique_selling_points: [
      `${getCuisineEnLabel(dish.cuisine)} flavor profile`,
      `Built around ${formatIngredientListEn(dish.ingredients_standard, 3)}`,
      dish.spice_level > 0 ? `Spice level ${dish.spice_level} with real character` : 'Balanced and crowd-friendly flavor',
    ],
  }
}

function getCategoryCn(category: string): string {
  const map: Record<string, string> = {
    Appetizer: '前菜',
    Soup: '汤品',
    'Main Course': '主菜',
    'Noodles/Rice': '面食/米饭',
    Dessert: '甜品',
    Beverage: '饮品',
  }
  return map[category] || category
}

function getIngredientCn(ingredient: string): string {
  const map: Record<string, string> = {
    chicken: '鸡肉',
    'chicken breast': '鸡胸肉',
    beef: '牛肉',
    pork: '猪肉',
    'ground pork': '猪肉末',
    shrimp: '虾',
    fish: '鱼',
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
    garlic: '蒜',
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
    eggplant: '茄子',
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
  englishValues: string[]
): string[] {
  return englishValues.map((ingredient, index) =>
    normalizeChineseLabel(chineseValues?.[index], getIngredientCn(ingredient))
  )
}

function buildChineseTextList(
  chineseValues: string[] | undefined,
  englishValues: string[],
  fallback: string
): string[] {
  if (chineseValues && chineseValues.length > 0) {
    const normalized = chineseValues
      .map((item, index) =>
        normalizeChineseLabel(item, translateCommonEnglishToChinese(englishValues[index]) || fallback)
      )
      .filter(Boolean)

    if (normalized.length > 0) return normalized
  }

  return englishValues.length > 0
    ? englishValues.map((item) => translateCommonEnglishToChinese(item) || fallback)
    : []
}

function buildChineseNotes(chineseNotes: string[] | undefined, englishNotes: string[]): string[] {
  if (chineseNotes && chineseNotes.length > 0) {
    return chineseNotes.map((note, index) =>
      normalizeChineseLabel(
        note,
        translateCommonEnglishToChinese(englishNotes[index]) || '请咨询门店确认详细说明'
      )
    )
  }

  return englishNotes.map(
    (note) => translateCommonEnglishToChinese(note) || '请咨询门店确认详细说明'
  )
}

async function translateListToChinese(
  values: string[],
  dishNameEn: string,
  dishNameCn: string
): Promise<string[]> {
  return Promise.all(
    values.map(async (value) => {
      if (!value.trim()) return ''
      return translateDescriptionToChinese(value, dishNameEn, dishNameCn)
    })
  )
}

function buildStandardPairingsEn(dish: StandardDish): string[] {
  if (dish.category === 'Noodles/Rice') {
    return ['Pairs well with a light soup or refreshing drink.']
  }

  if (dish.spice_level >= 3) {
    return ['Pairs well with rice.', 'Balances nicely with a cold drink.']
  }

  return ['Pairs well with rice.', 'Works well with a light side dish.']
}

function formatIngredientListEn(ingredients: string[], limit: number): string {
  const selected = ingredients.slice(0, limit).filter(Boolean)
  if (selected.length === 0) return 'carefully selected ingredients'
  if (selected.length === 1) return selected[0]
  if (selected.length === 2) return `${selected[0]} and ${selected[1]}`
  return `${selected.slice(0, -1).join(', ')}, and ${selected[selected.length - 1]}`
}

function normalizeChineseLabel(value: string | undefined, fallback: string): string {
  const text = String(value || '').trim()
  if (!text) return fallback
  return /[\u3400-\u9fff]/.test(text) ? text : fallback
}

function getCuisineEnLabel(cuisine: string): string {
  return cuisine || 'Chinese'
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
  if (lower.includes('refreshing drink') || lower.includes('cold drink')) return '适合搭配清爽饮品。'
  if (lower.includes('light side dish')) return '适合搭配清淡配菜。'
  if (lower.includes('signature')) return '招牌推荐'
  if (lower.includes('best seller') || lower.includes('must-order')) return '人气推荐'
  if (lower.includes('sichuan')) return '川菜'
  if (lower.includes('cantonese')) return '粤菜'
  if (lower.includes('shanghai')) return '沪菜'
  if (lower.includes('beijing')) return '京菜'
  if (lower.includes('hunan')) return '湘菜'
  if (lower.includes('fujian')) return '闽菜'
  if (lower.includes('fusion')) return '融合菜'
  if (lower.includes('main course')) return '主菜'
  if (lower.includes('appetizer')) return '前菜'
  if (lower.includes('dessert')) return '甜品'
  if (lower.includes('beverage')) return '饮品'

  return null
}
