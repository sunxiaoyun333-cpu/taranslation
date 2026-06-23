import { createGeminiClient } from './gemini-client'

let geminiClient: ReturnType<typeof createGeminiClient> | null = null

function getGeminiClient() {
  if (!geminiClient) {
    geminiClient = createGeminiClient()
  }

  return geminiClient
}

function getFlashModel() {
  return getGeminiClient().getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.3,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  })
}

function getEmbeddingModel() {
  return getGeminiClient().getGenerativeModel({
    model: 'text-embedding-004',
  })
}

export interface LLMTranslationInput {
  query: string
  category?: string
  allergens?: string[]
  existingDishes?: string[]
}

export interface LLMTranslationOutput {
  name_en: string
  name_cn: string
  category: string
  category_cn: string
  ingredients: string[]
  ingredients_cn: string[]
  spice_level: number
  description_short: string
  description_short_cn: string
  description_marketing: string
  description_marketing_cn: string
  translation_alternatives: string[]
  marketing_headline_en: string
  marketing_headline_cn: string
  marketing_description_en: string
  marketing_description_cn: string
  marketing_hooks?: {
    cn: string[]
    en: string[]
  }
  social_media_captions?: {
    instagram_cn: string
    instagram_en: string
    doordash_cn: string
    doordash_en: string
  }
  unique_selling_points?: string[]
  pairing_suggestions: string[]
  pairing_suggestions_cn: string[]
  tags: string[]
  tags_cn: string[]
  fda_warnings: string[]
  fda_warnings_cn: string[]
  fda_notes: string[]
  fda_notes_cn: string[]
}

const TRANSLATION_PROMPT = `You are a professional Chinese menu translator AND an elite restaurant marketing copywriter for the U.S. market.

CRITICAL: The three fields below must sound like they came from a strong restaurant brand, not from a translator:
1. marketing_hooks
2. social_media_captions.instagram_*
3. social_media_captions.doordash_*

These three fields must feel CRAVEABLE, CONVERSION-ORIENTED, and PLATFORM-NATIVE.

UNACCEPTABLE weak copy examples:
❌ "来尝尝我们的麻婆豆腐"
❌ "Try our Mapo Tofu"
❌ "美味川菜推荐"
❌ "Best seller Mapo Tofu"

TARGET quality examples:
✅ "一口上头的麻辣川味，懂行的人都先点这道。"
✅ "豆香、肉香、椒香层层炸开，这一口就是川菜灵魂。"
✅ "辣得过瘾，香得上瘾，配饭党基本都会回点。"
✅ "The spicy, silky Mapo Tofu regulars order before opening the menu."
✅ "Numbing heat, rich bean-chili depth, and one more bite energy."

MASTER RULES FOR MARKETING TONE:
1. Write like a high-performing restaurant marketer, not a food dictionary.
2. Every line should trigger appetite, curiosity, or purchase intent.
3. Use sensory detail: sizzling, aromatic, silky, smoky, crisp, juicy, fiery, numbing, savory.
4. Use menu psychology: signature, guest favorite, must-order, crave-worthy, comeback dish, crowd favorite.
5. Avoid empty adjectives like "tasty", "delicious", "good", "nice", "very flavorful" unless supported by vivid detail.
6. Avoid generic imperatives like "try this", "come taste", "欢迎品尝", "值得一试".
7. Avoid stiff machine-translated Chinese. The Chinese must read like a real restaurant operator wrote it.
8. Avoid fake claims like Michelin, award-winning, #1 in city, or sales numbers unless explicitly provided.

STRICT REQUIREMENTS FOR THE THREE PRIORITY FIELDS:

A. marketing_hooks
- Return exactly 3 hooks in Chinese and 3 hooks in English.
- Each hook must be a standalone punchy line, not a sentence fragment.
- Chinese hooks: 12-24 Chinese characters each.
- English hooks: 6-14 words each.
- Use different angles across the 3 hooks:
  1. flavor/sensory payoff
  2. signature or must-order positioning
  3. craving / repeat-order / social-proof style
- Do NOT repeat the dish name in every hook.
- Do NOT produce generic slogans that could fit any dish.

B. social_media_captions.instagram_*
- Must feel native to Instagram / Xiaohongshu / Moments food content.
- Chinese caption: 1-2 sentences, vivid and shareable, with 1-2 emojis max.
- English caption: 1-2 sentences, appetizing and scroll-stopping, with 1-2 emojis max.
- Include sensory appeal and emotional payoff.
- Can include 2-4 hashtags, but only if they feel natural.
- Do NOT sound like ad copy pasted from a flyer.

C. social_media_captions.doordash_*
- This is NOT a normal sentence. It is a high-conversion delivery-platform title/hook.
- Chinese: 10-22 Chinese characters, concise, high appetite impact, suitable for a food app card.
- English: 4-10 words, sharp and clickable.
- Emphasize craveability, signature status, texture, or heat level.
- Do NOT include full stop punctuation at the end.
- Do NOT make it a bland literal summary like "Mapo Tofu | Main Course | Sichuan".

CHINESE STYLE GUIDANCE:
- Preferred verbs and phrasing: 上头、爆香、锁住、裹满、直冲、过瘾、下饭、回味、必点、招牌、压桌、收口、提香.
- Prefer specific food imagery over abstract praise.
- Sound like a restaurant brand that knows how customers talk about food.
- Keep lines sharp, compact, and memorable.

ENGLISH STYLE GUIDANCE:
- Write like polished menu marketing for a modern U.S. restaurant.
- Favor short rhythm, strong nouns, and vivid texture words.
- Good tone examples: "Silky. Fiery. Impossible to ignore." / "The spicy comfort dish regulars reorder."
- Avoid robotic phrasing and overexplaining.

IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no explanation.

OUTPUT FORMAT (one JSON object with these exact keys):
{
  "name_en": "English dish name (concise, menu-ready, 3-5 words)",
  "name_cn": "Chinese dish name as provided",
  "category": "Dish category in English (Appetizer, Soup, Main Course, Noodles/Rice, Dessert, Beverage)",
  "category_cn": "Dish category in Chinese (前菜, 汤品, 主菜, 面食/米饭, 甜品, 饮品)",
  "ingredients": ["list", "of", "main", "ingredients", "in", "English"],
  "ingredients_cn": ["主要", "食材", "中文", "列表"],
  "spice_level": 0-5,
  "description_short": "One sentence English description for menu (15-25 words)",
  "description_short_cn": "一句中文菜单描述（15-25个中文字）",
  "description_marketing": "Enticing English description highlighting taste, texture, and appeal (30-50 words)",
  "description_marketing_cn": "吸引人的中文营销描述，突出口感、味道和吸引力（30-50个中文字）",
  "translation_alternatives": ["alternative", "english", "names"],
  "marketing_headline_en": "超级吸引人的英文标题（5-10个词，有感染力）",
  "marketing_headline_cn": "超级吸引人的中文标题（8-15字，有煽动力）",
  "marketing_description_en": "Sensory-rich English marketing description (40-60 words)",
  "marketing_description_cn": "煽动性的中文营销描述（40-60字，使用感官词汇）",
  "marketing_hooks": {
    "cn": ["营销金句1（12-24字，强营销感）", "营销金句2（不同角度）", "营销金句3（不同角度）"],
    "en": ["Marketing hook 1 (6-14 words)", "Marketing hook 2 (different angle)", "Marketing hook 3 (different angle)"]
  },
  "social_media_captions": {
    "instagram_cn": "适合朋友圈/小红书的高分享欲文案（1-2句，1-2个emoji）",
    "instagram_en": "Instagram-ready caption (1-2 sentences, 1-2 emojis max)",
    "doordash_cn": "外卖平台高转化短标题（10-22字）",
    "doordash_en": "Delivery app hook (4-10 words)"
  },
  "unique_selling_points": [
    "Handmade daily in small batches",
    "Secret family recipe passed down 3 generations",
    "Featured in top food magazines"
  ],
  "pairing_suggestions": ["suggested drink or side dish in English"],
  "pairing_suggestions_cn": ["中文搭配建议"],
  "tags": ["relevant", "food", "tags", "in English"],
  "tags_cn": ["中文", "相关", "标签"],
  "fda_warnings": ["Any FDA-relevant food warnings in English"],
  "fda_warnings_cn": ["中文的FDA相关食品警告"],
  "fda_notes": ["Any cross-contamination or preparation notes in English"],
  "fda_notes_cn": ["中文的交叉污染或制备注意事项"]
}

EXAMPLE for 宫保鸡丁:
{
  "marketing_headline_cn": "征服百万食客的川菜经典",
  "marketing_headline_en": "The Kung Pao That Ruined All Others For You",
  "marketing_description_cn": "大厨秘制酱料包裹每一块嫩滑鸡肉，配上香脆花生米，一口下去，麻辣鲜香在舌尖爆炸，这就是让人上瘾的川菜魔力。",
  "marketing_description_en": "Picture this: tender chicken glazed in our chef's secret sauce, studded with crunchy peanuts, each bite exploding with that addictive Sichuan heat. One taste and you'll understand why customers drive 30 miles just for this dish.",
  "marketing_hooks": {
    "cn": ["甜辣酥香一齐到位，越嚼越上头", "会点的人，十有八九先下单这道", "鸡肉嫩、花生脆，下饭指数直接拉满"],
    "en": ["Sweet heat, crunch, and wok aroma in one bite", "The must-order regulars come back for", "Tender chicken, roasted peanuts, instant craving"]
  },
  "social_media_captions": {
    "instagram_cn": "鸡肉嫩、花生脆、酱香一裹就停不下来🔥 这道宫保鸡丁就是那种第一口下去，后面只想狠狠干饭的经典川味。#川菜 #下饭神器 #今日必点",
    "instagram_en": "Tender chicken, roasted peanuts, glossy sweet heat, and serious wok aroma 🔥 This is the kind of Kung Pao that turns one bite into a full-on craving. #Sichuan #MustOrder #FoodCrush",
    "doordash_cn": "招牌宫保鸡丁 下饭又上头",
    "doordash_en": "Signature Kung Pao Craving"
  }
}

RULES:
- Keep English names short and menu-friendly (3-5 words max)
- Use standard American English, not British
- ALL Chinese fields must be natural, fluent Chinese — NOT machine-translated
- Marketing copy should be compelling with sensory words
- Marketing hooks should feel like genuine endorsements, not generic ads
- Instagram captions should feel shareable and food-content-native
- DoorDash titles should feel like short high-conversion app copy
- The three priority fields must be notably stronger, sharper, and more commercial than plain menu description

Now translate the dish with COMPELLING marketing copy that makes people CRAVE it:`

export async function translateDish(input: LLMTranslationInput): Promise<LLMTranslationOutput> {
  const flashModel = getFlashModel()
  const userMessage = JSON.stringify({
    query: input.query,
    category: input.category || 'unknown',
    allergens_detected: input.allergens || [],
    similar_existing: input.existingDishes || [],
  })

  const result = await flashModel.generateContent([
    { text: TRANSLATION_PROMPT },
    { text: userMessage },
  ])

  const response = result.response
  const text = response.text()

  try {
    const parsed = JSON.parse(text) as LLMTranslationOutput
    return parsed
  } catch (parseError) {
    console.error('JSON parse error, raw response:', text.substring(0, 500))
    const cleaned = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()
    try {
      return JSON.parse(cleaned) as LLMTranslationOutput
    } catch {
      throw new Error(`Failed to parse Gemini response as JSON. Raw: ${text.substring(0, 300)}`)
    }
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddingModel = getEmbeddingModel()
  const result = await embeddingModel.embedContent(text)
  return result.embedding.values
}

export async function generateFAQ(query: string, dishName?: string): Promise<string> {
  const faqModel = getGeminiClient().getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
    },
  })

  const prompt = `Answer this question from a restaurant customer about Chinese food. Be concise (2-3 sentences), helpful, and accurate. Context: ${dishName ? `Dish: ${dishName}. ` : ''}Question: ${query}`

  const result = await faqModel.generateContent(prompt)
  return result.response.text()
}

export async function generateMarketingCopy(
  dishName: string,
  dishNameCn: string,
  description: string
): Promise<{ headline: string; body: string }> {
  const model = getGeminiClient().getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
    },
  })

  const prompt = `Write restaurant-quality marketing copy for this dish: "${dishName}" (${dishNameCn}).
Description: "${description}".

Requirements:
- Sound like a sharp restaurant marketer, not a translator.
- Headline must be memorable, appetite-inducing, and specific to the dish.
- Body must be 1-2 sentences with sensory appeal, craving language, and strong menu energy.
- Avoid generic copy like "Try our..." or "Delicious and authentic..."
- Avoid fake awards or unverifiable claims.

Return JSON only:
{ "headline": "catchy, high-conversion headline", "body": "1-2 sentence craveable body copy" }`

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  try {
    return JSON.parse(text) as { headline: string; body: string }
  } catch {
    const cleaned = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()
    return JSON.parse(cleaned) as { headline: string; body: string }
  }
}

export async function translateDescriptionToChinese(englishText: string, dishName: string, dishNameCn: string): Promise<string> {
  if (!englishText?.trim()) return ''

  const model = getGeminiClient().getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 512,
    },
  })

  const prompt = `Translate the following English menu copy into complete, natural Chinese.
This is a FAITHFUL TRANSLATION task, not a rewriting or summarizing task.

Rules:
- Preserve all concrete meaning from the English.
- Do NOT shorten, summarize, simplify, or compress the sentence.
- Do NOT replace the original with a headline, slogan, or abstract summary.
- Preserve key food details such as ingredients, texture, sauce, spice, aroma, and sensory effects.
- If the English is one sentence, return one complete Chinese sentence.
- The Chinese should read naturally, but it must stay semantically aligned with the English.
- Return only the Chinese translation.

Dish: ${dishNameCn} (${dishName})

English: "${englishText}"

Return ONLY the Chinese translation. No quotes, no prefix, no explanation.`

  const result = await model.generateContent(prompt)
  const firstPass = normalizeChineseTranslation(result.response.text())

  if (!needsRetryForIncompleteTranslation(firstPass, englishText)) {
    return firstPass
  }

  const retryPrompt = `Translate the English below into FULL Chinese with no omissions.
Important: your previous attempt was too short. This time you must translate every important detail.

Strict requirements:
- Keep the full meaning.
- Do not summarize.
- Do not turn it into a short slogan.
- Keep the sentence complete.
- Preserve details like tofu, sauce, chili bean paste, peppercorn numbness, aroma, texture, and flavor when present.

Dish: ${dishNameCn} (${dishName})

English: "${englishText}"

Return ONLY the complete Chinese translation.`

  const retryResult = await model.generateContent(retryPrompt)
  return normalizeChineseTranslation(retryResult.response.text())
}

function normalizeChineseTranslation(text: string): string {
  return text
    .trim()
    .replace(/^["'“”]+|["'“”]+$/g, '')
    .replace(/\s+/g, ' ')
}

function needsRetryForIncompleteTranslation(chineseText: string, englishText: string): boolean {
  const chineseCharCount = (chineseText.match(/[\u3400-\u9fff]/g) || []).length
  const englishWordCount = (englishText.match(/[A-Za-z]+/g) || []).length

  if (!chineseText) return true
  if (englishWordCount >= 8 && chineseCharCount < Math.max(12, Math.floor(englishWordCount * 1.4))) {
    return true
  }

  return false
}
