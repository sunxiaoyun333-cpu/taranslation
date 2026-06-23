'use client'

import type { TranslationResult } from '@/lib/types'
import type { Locale } from '@/lib/i18n'
import { ConfidenceIndicator } from './ConfidenceIndicator'

interface Props {
  result: TranslationResult
  locale: Locale
}

interface DetailPair {
  label: string
  zh: string
  en: string
}

interface TextPair {
  zh: string
  en: string
}

export function TranslationResultDual({ result, locale }: Props) {
  const { dish, marketing, allergen_check: allergenCheck, compliance } = result

  if (!dish) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <p className="text-yellow-800">{locale === 'zh' ? '未找到该菜品。' : 'Dish not found.'}</p>
      </div>
    )
  }

  const dishNameZh = toChineseSafeText(dish.name_cn, '待确认中文菜名')
  const dishNameEn = dish.name_en_standard || dish.name_en || 'Unnamed dish'
  const categoryZh = toChineseSafeText(dish.category_cn, getCategoryNameZh(dish.category))
  const categoryEn = dish.category || 'Main Course'
  const cuisineEn = dish.cuisine || 'Other'
  const cuisineZh = getCuisineNameZh(cuisineEn)
  const spiceLevel = Number(dish.spice_level || 0)
  const spiceZh = spiceLevel > 0 ? `${'辣'.repeat(spiceLevel)}，辣度 ${spiceLevel} 级` : '不辣或未标注'
  const spiceEn = spiceLevel > 0 ? `Spice level ${spiceLevel}` : 'Mild or not specified'

  const shortDescPair = firstPairedText(
    [
      [dish.description_short_cn, dish.description_short],
      [marketing?.description_cn, marketing?.description_en],
      [dish.description_marketing_cn, dish.description_marketing],
    ],
    `${dishNameZh}是一道${cuisineZh}${categoryZh}，适合在菜单中突出风味、做法和食材特色。`,
    `${dishNameEn}, a ${cuisineEn} ${categoryEn} recommended for highlighting flavor, cooking style, and ingredient appeal on menus.`,
  )
  const shortDescZh = shortDescPair.zh
  const shortDescEn = shortDescPair.en
  const marketingDescPair = firstPairedText(
    [
      [marketing?.description_cn, marketing?.description_en],
      [dish.description_marketing_cn, dish.description_marketing],
      [dish.description_short_cn, dish.description_short],
    ],
    `${dishNameZh}风味鲜明，适合推荐给喜欢${cuisineZh}口味的顾客。可作为${categoryZh}在菜单和外卖平台中重点展示。`,
    `${dishNameEn} has bold flavor, ideal for guests who enjoy ${cuisineEn} cuisine. Recommended as a featured ${categoryEn} on menus and delivery platforms.`,
  )
  const marketingDescZh = marketingDescPair.zh
  const marketingDescEn = marketingDescPair.en
  const headlinePair = firstPairedText(
    [[marketing?.headline_cn, marketing?.headline_en]],
    `${cuisineZh}经典菜品：${dishNameZh}`,
    `${dishNameEn}, a ${cuisineEn} favorite`,
  )
  const headlineZh = headlinePair.zh
  const headlineEn = headlinePair.en

  const dishInfo: DetailPair[] = [
    { label: '菜品名称', zh: dishNameZh, en: dishNameEn },
    { label: '菜品分类', zh: categoryZh, en: categoryEn },
    { label: '菜系风格', zh: cuisineZh, en: cuisineEn },
    { label: '辣度说明', zh: spiceZh, en: spiceEn },
    { label: '简短描述', zh: shortDescZh, en: shortDescEn },
    { label: '营销描述', zh: marketingDescZh, en: marketingDescEn },
  ]

  const ingredients = buildIngredientPairs(
    dish.ingredients_cn,
    dish.ingredients_standard || dish.ingredients,
  )
  const allergens = buildAllergenPairs(result)
  const safeFor = buildPairs(
    allergenCheck?.safe_for_cn,
    allergenCheck?.safe_for,
    '未检测到更多安全分类',
    'No additional safe category detected',
  )
  const warnings = buildPairs(
    compliance?.warnings_cn,
    compliance?.warnings,
    '暂无额外警告',
    'No additional warning',
  )
  const notes = buildPairs(
    compliance?.notes_cn,
    compliance?.notes,
    '暂无额外说明',
    'No additional note',
  )
  const hooks = buildPairs(
    marketing?.marketing_hooks?.cn,
    marketing?.marketing_hooks?.en,
    '适合突出风味、做法和招牌特色。',
    'Highlight flavor, cooking style, and signature appeal.',
  )
  const pairings = buildPairs(
    marketing?.pairing_suggestions_cn,
    marketing?.pairing_suggestions,
    '可搭配米饭、面食或清爽饮品。',
    'Pairs well with rice, noodles, or a refreshing drink.',
  )
  const tags = buildPairs(marketing?.tags_cn, marketing?.tags, categoryZh, categoryEn)
  const usps = buildSellingPoints({
    dishNameZh,
    dishNameEn,
    cuisineZh,
    cuisineEn,
    categoryZh,
    categoryEn,
    spiceZh,
    spiceEn,
    sourceZh: marketing?.unique_selling_points_cn,
    source: marketing?.unique_selling_points,
  })
  const captions: DetailPair[] = [
    {
      label: '社交媒体文案',
      zh: firstChineseText(marketing?.social_media_captions?.instagram_cn, `${dishNameZh}香气足、风味鲜明，适合喜欢${cuisineZh}的顾客。`),
      en: firstText(marketing?.social_media_captions?.instagram_en, `${dishNameEn} delivers bold flavor and a memorable ${cuisineEn} dining experience.`),
    },
    {
      label: '外卖平台标题',
      zh: firstChineseText(marketing?.social_media_captions?.doordash_cn, `${dishNameZh}｜${categoryZh}｜${cuisineZh}`),
      en: firstText(marketing?.social_media_captions?.doordash_en, `${dishNameEn} | ${categoryEn} | ${cuisineEn}`),
    },
  ]

  if (locale !== 'zh') {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex justify-end">
          <ConfidenceIndicator confidence={result.confidence ?? 0} locale={locale} />
        </div>
        <SingleLanguageResult
          title={dishNameEn}
          subtitle={`${categoryEn} · ${cuisineEn}`}
          description={marketingDescEn}
          details={dishInfo.map((item) => ({ label: item.label, value: item.en }))}
          ingredients={ingredients.map((item) => item.en)}
          allergens={allergens.map((item) => item.en)}
          safeFor={safeFor.map((item) => item.en)}
          warnings={warnings.map((item) => item.en)}
          notes={notes.map((item) => item.en)}
          headline={headlineEn}
          hooks={hooks.map((item) => item.en)}
          pairings={pairings.map((item) => item.en)}
          usps={usps.map((item) => item.en)}
          captions={captions.map((item) => ({ label: item.label, value: item.en }))}
          tags={tags.map((item) => item.en)}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex justify-end">
        <ConfidenceIndicator confidence={result.confidence ?? 0} locale={locale} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <HeaderCard title="中文栏" subtitle="餐厅内部复核、中文菜单和员工沟通使用" name={dishNameZh} meta={`${categoryZh} · ${cuisineZh}`} tone="zh" />
        <HeaderCard title="英文栏" subtitle="顾客菜单、外卖平台和英文营销文案使用" name={dishNameEn} meta={`${categoryEn} · ${cuisineEn}`} tone="en" />
      </div>

      <ComparisonSection title="菜品信息">
        <ComparisonPanel tone="zh">
          <DetailList items={dishInfo.map((item) => ({ label: item.label, value: item.zh }))} />
        </ComparisonPanel>
        <ComparisonPanel tone="en">
          <DetailList items={dishInfo.map((item) => ({ label: item.label, value: item.en }))} />
        </ComparisonPanel>
      </ComparisonSection>

      <ComparisonSection title="食材清单">
        <ComparisonPanel tone="zh">
          <PillList items={ingredients.map((item) => item.zh)} className="bg-blue-50 text-blue-800" />
        </ComparisonPanel>
        <ComparisonPanel tone="en">
          <PillList items={ingredients.map((item) => item.en)} className="bg-green-50 text-green-800" />
        </ComparisonPanel>
      </ComparisonSection>

      <ComparisonSection title="过敏原与合规信息">
        <ComparisonPanel tone="zh">
          <StackedInfo
            groups={[
              ['检测到的主要过敏原', allergens.map((item) => item.zh), '未检测到主要过敏原'],
              ['适合或未检出的类别', safeFor.map((item) => item.zh), '暂无安全类别信息'],
              ['警告语', warnings.map((item) => item.zh), '暂无额外警告'],
              ['补充说明', notes.map((item) => item.zh), '暂无额外说明'],
            ]}
          />
        </ComparisonPanel>
        <ComparisonPanel tone="en">
          <StackedInfo
            groups={[
              ['检测到的主要过敏原', allergens.map((item) => item.en), 'No major allergen detected'],
              ['适合或未检出的类别', safeFor.map((item) => item.en), 'No safe category information'],
              ['警告语', warnings.map((item) => item.en), 'No additional warning'],
              ['补充说明', notes.map((item) => item.en), 'No additional note'],
            ]}
          />
        </ComparisonPanel>
      </ComparisonSection>

      <ComparisonSection title="营销文案">
        <ComparisonPanel tone="zh">
          <MarketingPanel
            headline={headlineZh}
            hooks={hooks.map((item) => item.zh)}
            pairings={pairings.map((item) => item.zh)}
            usps={usps.map((item) => item.zh)}
            captions={captions.map((item) => ({ label: item.label, value: item.zh }))}
            tags={tags.map((item) => item.zh)}
            tone="zh"
          />
        </ComparisonPanel>
        <ComparisonPanel tone="en">
          <MarketingPanel
            headline={headlineEn}
            hooks={hooks.map((item) => item.en)}
            pairings={pairings.map((item) => item.en)}
            usps={usps.map((item) => item.en)}
            captions={captions.map((item) => ({ label: item.label, value: item.en }))}
            tags={tags.map((item) => item.en)}
            tone="en"
          />
        </ComparisonPanel>
      </ComparisonSection>

      <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        置信度：{((result.confidence ?? 0) * 100).toFixed(1)}%
        {dish.source && dish.source.length > 0 ? ` · 来源：${dish.source.map(getSourceNameZh).join('、')}` : ''}
      </div>
    </div>
  )
}

function HeaderCard({ title, subtitle, name, meta, tone }: { title: string; subtitle: string; name: string; meta: string; tone: 'zh' | 'en' }) {
  const color = tone === 'zh' ? 'border-blue-100 text-blue-700' : 'border-green-100 text-green-700'

  return (
    <section className={`rounded-lg border bg-white p-5 shadow-sm ${color}`}>
      <p className="text-xs font-bold uppercase tracking-wide">{title}</p>
      <h2 className="mt-2 text-2xl font-bold text-gray-950">{name}</h2>
      <p className="mt-2 text-sm text-gray-500">{meta}</p>
      <p className="mt-3 text-sm leading-6 text-gray-600">{subtitle}</p>
    </section>
  )
}

function ComparisonSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="border-b border-gray-100 pb-3 text-base font-bold text-gray-950">{title}</h3>
      <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-2">{children}</div>
    </section>
  )
}

function ComparisonPanel({ tone, children }: { tone: 'zh' | 'en'; children: React.ReactNode }) {
  const className = tone === 'zh' ? 'border-blue-100 bg-blue-50/35' : 'border-green-100 bg-green-50/35'

  return <div className={`h-full rounded-lg border p-4 ${className}`}>{children}</div>
}

function DetailList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
          <p className="mt-1 text-sm leading-6 text-gray-850">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function StackedInfo({ groups }: { groups: Array<[string, string[], string]> }) {
  return (
    <div className="space-y-5">
      {groups.map(([label, items, empty]) => (
        <InfoList key={label} label={label} items={items} empty={empty} />
      ))}
    </div>
  )
}

function MarketingPanel({
  headline,
  hooks,
  pairings,
  usps,
  captions,
  tags,
  tone,
}: {
  headline: string
  hooks: string[]
  pairings: string[]
  usps: string[]
  captions: Array<{ label: string; value: string }>
  tags: string[]
  tone: 'zh' | 'en'
}) {
  const pillClass = tone === 'zh' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-purple-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">推荐标题</p>
        <p className="mt-2 text-lg font-bold leading-7 text-gray-950">{headline}</p>
      </div>
      <InfoList label="营销金句" items={hooks} empty={tone === 'zh' ? '暂无营销金句' : 'No marketing hook'} />
      <InfoList label="搭配建议" items={pairings} empty={tone === 'zh' ? '暂无搭配建议' : 'No pairing suggestion'} />
      <InfoList label="独特卖点" items={usps} empty={tone === 'zh' ? '暂无独特卖点' : 'No unique selling point'} />
      <div className="space-y-3">
        {captions.map((caption) => (
          <div key={caption.label} className="rounded-lg border border-gray-100 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{caption.label}</p>
            <p className="mt-1 text-sm leading-6 text-gray-800">{caption.value}</p>
          </div>
        ))}
      </div>
      <PillList items={tags} className={pillClass} />
    </div>
  )
}

function SingleLanguageResult({
  title,
  subtitle,
  description,
  details,
  ingredients,
  allergens,
  safeFor,
  warnings,
  notes,
  headline,
  hooks,
  pairings,
  usps,
  captions,
  tags,
}: {
  title: string
  subtitle: string
  description: string
  details: Array<{ label: string; value: string }>
  ingredients: string[]
  allergens: string[]
  safeFor: string[]
  warnings: string[]
  notes: string[]
  headline: string
  hooks: string[]
  pairings: string[]
  usps: string[]
  captions: Array<{ label: string; value: string }>
  tags: string[]
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-600">{subtitle}</p>
      <h2 className="mt-2 text-3xl font-bold text-gray-950">{title}</h2>
      <p className="mt-4 text-base leading-7 text-gray-700">{description}</p>

      <Block title="Dish information">
        <DetailList items={details} />
      </Block>
      <Block title="Ingredients">
        <PillList items={ingredients} className="bg-gray-100 text-gray-800" />
      </Block>
      <Block title="Allergen and compliance information">
        <StackedInfo
          groups={[
            ['Detected major allergens', allergens, 'No major allergen detected'],
            ['Safe or not detected categories', safeFor, 'No safe category information'],
            ['Warnings', warnings, 'No additional warning'],
            ['Notes', notes, 'No additional note'],
          ]}
        />
      </Block>
      <Block title="Marketing copy">
        <MarketingPanel headline={headline} hooks={hooks} pairings={pairings} usps={usps} captions={captions} tags={tags} tone="en" />
      </Block>
    </section>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-950">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function InfoList({ label, items, empty }: { label: string; items: string[]; empty: string }) {
  const visibleItems = items.filter(Boolean)

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      {visibleItems.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {visibleItems.map((item, index) => (
            <li key={`${item}-${index}`} className="text-sm leading-6 text-gray-800">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-gray-500">{empty}</p>
      )}
    </div>
  )
}

function PillList({ items, className }: { items: string[]; className: string }) {
  const visibleItems = items.filter(Boolean)

  if (visibleItems.length === 0) {
    return <p className="text-sm text-gray-500">-</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visibleItems.map((item, index) => (
        <span key={`${item}-${index}`} className={`rounded-full px-3 py-1 text-sm font-medium ${className}`}>
          {item}
        </span>
      ))}
    </div>
  )
}

function buildAllergenPairs(result: TranslationResult): TextPair[] {
  const detected = result.allergen_check?.allergens || []

  if (detected.length > 0) {
    return detected.map((allergen) => ({
      zh: normalizeChineseDisplayText(allergen.name_cn, getAllergenNameZh(allergen.id || allergen.name)),
      en: allergen.name || normalizeAllergenName(allergen.id),
    }))
  }

  return (result.dish.allergens_standard || []).map((allergen) => ({
    zh: getAllergenNameZh(allergen),
    en: normalizeAllergenName(allergen),
  }))
}

function buildIngredientPairs(
  zhValues: string[] | undefined,
  enValues: string[] | undefined,
): TextPair[] {
  const zh = normalizeList(zhValues)
  const en = normalizeList(enValues)
  const length = Math.max(zh.length, en.length)

  if (length === 0) {
    return []
  }

  return Array.from({ length }, (_, index) => {
    const enText = en[index] || 'Pending ingredient'
    const normalizedZh = normalizeChineseDisplayText(zh[index], '')

    if (normalizedZh) {
      return { zh: normalizedZh, en: enText }
    }

    const translated = ingredientNameToChinese(enText)
    return { zh: translated || '待确认食材', en: enText }
  })
}

function buildPairs(
  zhValues: string[] | undefined,
  enValues: string[] | undefined,
  zhFallback: string,
  enFallback: string,
): TextPair[] {
  const zh = normalizeList(zhValues)
  const en = normalizeList(enValues)
  const length = Math.max(zh.length, en.length)

  if (length === 0) {
    return []
  }

  return Array.from({ length }, (_, index) => {
    const enText = en[index] || enFallback
    const normalizedZh = normalizeChineseDisplayText(zh[index], '')
    if (normalizedZh) {
      return { zh: normalizedZh, en: enText }
    }

    const translated = translateEnglishTerms(enText)
    return { zh: (translated && hasChinese(translated)) ? translated : zhFallback, en: enText }
  })
}

function buildSellingPoints({
  dishNameZh,
  dishNameEn,
  cuisineZh,
  cuisineEn,
  categoryZh,
  categoryEn,
  spiceZh,
  spiceEn,
  sourceZh,
  source,
}: {
  dishNameZh: string
  dishNameEn: string
  cuisineZh: string
  cuisineEn: string
  categoryZh: string
  categoryEn: string
  spiceZh: string
  spiceEn: string
  sourceZh?: string[]
  source?: string[]
}): TextPair[] {
  const en = normalizeList(source)
  const zh = normalizeList(sourceZh)

  if (en.length > 0) {
    return en.map((item, index) => ({
      zh: normalizeChineseDisplayText(zh[index], '') || buildSellingPointZh(item, dishNameZh, cuisineZh, categoryZh, spiceZh),
      en: item,
    }))
  }

  return [
    {
      zh: `${dishNameZh}突出${cuisineZh}风味，适合作为${categoryZh}推荐。`,
      en: `${dishNameEn} highlights ${cuisineEn} flavor and works well as a recommended ${categoryEn}.`,
    },
    {
      zh: `${spiceZh}，方便顾客提前判断口味强度。`,
      en: `${spiceEn}, making flavor intensity easier for guests to understand.`,
    },
  ]
}

function buildSellingPointZh(enText: string, dishNameZh: string, cuisineZh: string, categoryZh: string, spiceZh: string) {
  const lower = enText.toLowerCase()
  if (lower.includes('authentic') || lower.includes('traditional')) return `${dishNameZh}突出地道${cuisineZh}风味，适合作为经典${categoryZh}推荐。`
  if (lower.includes('fresh') || lower.includes('made fresh')) return `${dishNameZh}强调现做现卖，口感新鲜，适合门店重点展示。`
  if (lower.includes('chef') || lower.includes('signature')) return `${dishNameZh}属于店内招牌${categoryZh}，辨识度高，便于顾客快速选择。`
  if (lower.includes('spice') || lower.includes('fiery') || lower.includes('hot')) return `${dishNameZh}${spiceZh}，方便顾客提前判断口味强度。`
  return `${dishNameZh}风味鲜明，能体现${cuisineZh}${categoryZh}的代表特色。`
}

function normalizeList(values?: string[]) {
  return (values || []).map((item) => String(item || '').trim()).filter(Boolean)
}

function firstText(...values: Array<string | undefined>) {
  return values.find((value) => value && value.trim().length > 0)?.trim() || ''
}

function firstChineseText(...values: Array<string | undefined>) {
  const fallback = values[values.length - 1] || ''
  for (const value of values) {
    const normalized = normalizeChineseDisplayText(value, '')
    if (normalized) return normalized
  }
  return fallback
}

function firstPairedText(
  pairs: Array<[string | undefined, string | undefined]>,
  zhFallback: string,
  enFallback: string,
): { zh: string; en: string } {
  for (const [zhVal, enVal] of pairs) {
    const en = (enVal || '').trim()
    if (!en) continue
    const normalizedZh = normalizeChineseDisplayText(zhVal, '')

    if (normalizedZh) {
      return { zh: normalizedZh, en: en || enFallback }
    }

    const translated = translateEnglishTerms(en)
    if (translated && hasChinese(translated) && !containsEnglishWords(translated)) {
      return { zh: translated, en: en || enFallback }
    }

    return { zh: zhFallback, en: en || enFallback }
  }
  return { zh: zhFallback, en: enFallback }
}

function toChineseSafeText(value: string | undefined, fallback: string) {
  return normalizeChineseDisplayText(value, fallback)
}

function hasChinese(value: string) {
  return /[\u3400-\u9fff]/.test(value)
}

function containsEnglishWords(value: string) {
  return /[A-Za-z]{2,}/.test(value)
}

function sanitizeChineseText(value: string | undefined, fallback: string) {
  if (!value || !hasChinese(value)) return fallback

  let text = value
  text = text.replace(/FDA/g, '美国食品药品监督管理局')
  text = text.replace(/Contains\s*:\s*/gi, '包含：')
  text = text.replace(/No major allergens detected/gi, '未检测到主要过敏原')
  text = text.replace(/requires manual verification/gi, '需要人工确认')
  text = text.replace(/manual verification/gi, '人工确认')

  for (const [english, chinese] of Object.entries(CHINESE_TERM_MAP)) {
    const escaped = english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    text = text.replace(new RegExp(escaped, 'gi'), chinese)
  }

  text = text.replace(/\s+/g, ' ').trim()

  return hasChinese(text) ? text : fallback
}

function normalizeChineseDisplayText(value: string | undefined, fallback: string) {
  if (!value) return fallback
  const raw = value.trim()
  if (!raw) return fallback

  if (hasChinese(raw)) {
    const cleaned = sanitizeChineseText(raw, '')
    if (cleaned && !containsEnglishWords(cleaned)) return cleaned
  }

  const translated = translateEnglishTerms(raw)
  if (translated && hasChinese(translated) && !containsEnglishWords(translated)) {
    return translated
  }

  return fallback
}

const CHINESE_TERM_MAP: Record<string, string> = {
  soybeans: '大豆',
  soybean: '大豆',
  soy: '大豆',
  wheat: '小麦',
  peanuts: '花生',
  peanut: '花生',
  'tree nuts': '坚果',
  shellfish: '甲壳类海鲜',
  fish: '鱼类',
  milk: '牛奶',
  dairy: '牛奶',
  eggs: '鸡蛋',
  egg: '鸡蛋',
  sesame: '芝麻',
  chicken: '鸡肉',
  beef: '牛肉',
  pork: '猪肉',
  shrimp: '虾',
  tofu: '豆腐',
  rice: '米饭',
  noodle: '面',
  noodles: '面',
}

const INGREDIENT_ZH_MAP: Record<string, string> = {
  ...CHINESE_TERM_MAP,
  // meat & poultry
  'chicken breast': '鸡胸肉',
  'chicken thigh': '鸡腿肉',
  'chicken wing': '鸡翅',
  'ground chicken': '鸡肉碎',
  'roast duck': '烧鸭',
  duck: '鸭肉',
  lamb: '羊肉',
  mutton: '羊肉',
  'ground pork': '猪肉碎',
  'pork belly': '五花肉',
  'pork ribs': '排骨',
  'pork shoulder': '猪肩肉',
  'pork loin': '猪里脊',
  'beef brisket': '牛腩',
  'beef shank': '牛腱',
  'beef tenderloin': '牛里脊',
  'beef tripe': '牛肚',
  // seafood
  salmon: '三文鱼',
  cod: '鳕鱼',
  tilapia: '罗非鱼',
  crab: '蟹肉',
  lobster: '龙虾',
  scallop: '扇贝',
  squid: '鱿鱼',
  octopus: '章鱼',
  clam: '蛤蜊',
  mussel: '青口',
  oyster: '蚝',
  'fish fillet': '鱼片',
  'fish ball': '鱼丸',
  'shrimp paste': '虾酱',
  // vegetables
  broccoli: '西兰花',
  'chinese broccoli': '芥蓝',
  'bok choy': '白菜',
  'baby bok choy': '小白菜',
  cabbage: '卷心菜',
  'napa cabbage': '大白菜',
  spinach: '菠菜',
  'water spinach': '空心菜',
  lettuce: '生菜',
  celery: '芹菜',
  carrot: '胡萝卜',
  potato: '土豆',
  'sweet potato': '红薯',
  corn: '玉米',
  'baby corn': '玉米笋',
  mushroom: '蘑菇',
  'shiitake mushroom': '香菇',
  'enoki mushroom': '金针菇',
  'wood ear mushroom': '木耳',
  'king oyster mushroom': '杏鲍菇',
  'bamboo shoot': '竹笋',
  cucumber: '黄瓜',
  'bitter melon': '苦瓜',
  eggplant: '茄子',
  'bell pepper': '灯笼椒',
  'green pepper': '青椒',
  'red pepper': '红椒',
  'snow pea': '荷兰豆',
  'snap pea': '甜豆',
  'bean sprout': '豆芽',
  onion: '洋葱',
  'green onion': '葱',
  'spring onion': '小葱',
  scallion: '葱',
  garlic: '大蒜',
  ginger: '生姜',
  'lotus root': '莲藕',
  'water chestnut': '马蹄',
  // tofu & soy
  'silken tofu': '嫩豆腐',
  'firm tofu': '老豆腐',
  'fried tofu': '炸豆腐',
  'tofu skin': '豆腐皮',
  'tofu puff': '豆腐泡',
  'fermented tofu': '腐乳',
  'soy sauce': '酱油',
  'dark soy sauce': '老抽',
  'light soy sauce': '生抽',
  'soybean paste': '豆瓣酱',
  'hoisin sauce': '海鲜酱',
  // seasoning & sauces
  'oyster sauce': '蚝油',
  'sesame oil': '芝麻油',
  'chili oil': '辣椒油',
  'chili sauce': '辣椒酱',
  'sriracha': '是拉差辣酱',
  'black bean sauce': '豆豉酱',
  vinegar: '醋',
  'rice vinegar': '米醋',
  'black vinegar': '陈醋',
  'white pepper': '白胡椒',
  'black pepper': '黑胡椒',
  'five spice': '五香粉',
  'star anise': '八角',
  'cinnamon': '桂皮',
  'sichuan peppercorn': '花椒',
  'doubanjiang': '豆瓣酱',
  'fermented black bean': '豆豉',
  salt: '盐',
  sugar: '糖',
  'brown sugar': '红糖',
  'rock sugar': '冰糖',
  // noodles & dough
  'rice noodle': '米粉',
  'flat rice noodle': '河粉',
  'egg noodle': '鸡蛋面',
  'wonton wrapper': '馄饨皮',
  'dumpling wrapper': '饺子皮',
  'spring roll wrapper': '春卷皮',
  'steamed bun': '馒头',
  'bao bun': '包子',
  // other
  'corn starch': '玉米淀粉',
  'potato starch': '土豆淀粉',
  'cooking wine': '料酒',
  'shaoxing wine': '绍兴酒',
  'chicken broth': '鸡汤',
  'chicken stock': '鸡高汤',
  'pork broth': '猪骨汤',
  'vegetable oil': '植物油',
  'peanut oil': '花生油',
  'canola oil': '菜籽油',
  egg: '鸡蛋',
  peanut: '花生',
  cashew: '腰果',
  almond: '杏仁',
  walnut: '核桃',
  cilantro: '香菜',
  basil: '九层塔',
  'thai basil': '九层塔',
  'mint': '薄荷',
}

function ingredientNameToChinese(name: string): string | null {
  if (!name) return null
  const lower = name.toLowerCase().trim()
  if (INGREDIENT_ZH_MAP[lower]) return INGREDIENT_ZH_MAP[lower]
  // try singular/plural variants
  if (lower.endsWith('s')) {
    const singular = lower.slice(0, -1)
    if (INGREDIENT_ZH_MAP[singular]) return INGREDIENT_ZH_MAP[singular]
  }
  // try removing "fresh ", "dried ", etc. prefixes
  const withoutShort = lower.replace(/^(fresh|dried|ground|sliced|chopped|minced|roasted|fried|steamed|boiled|pickled|crispy|spicy|hot and sour|sweet and sour)\s+/, '')
  if (withoutShort !== lower && INGREDIENT_ZH_MAP[withoutShort]) return INGREDIENT_ZH_MAP[withoutShort]
  // try removing "sliced " prefix
  const withoutPrefix = lower.replace(/^(sliced|diced|shredded|minced|chopped|stir-fried|deep-fried|pan-fried|wok-fried)\s+/, '')
  if (withoutPrefix !== lower && INGREDIENT_ZH_MAP[withoutPrefix]) return INGREDIENT_ZH_MAP[withoutPrefix]
  return null
}

const EN_TO_ZH_PHRASES: Record<string, string> = {
  'Contains:': '包含：',
  'contains:': '包含：',
  'Contains': '包含',
  'contains': '包含',
  'May contain': '可能含有',
  'may contain': '可能含有',
  'May contain traces of': '可能含有微量',
  'may contain traces of': '可能含有微量',
  'Processed in a facility that also processes': '生产设备同时处理',
  'processed in a facility that also processes': '生产设备同时处理',
  'Manufactured on shared equipment with': '与以下原料共用生产线：',
  'manufactured on shared equipment with': '与以下原料共用生产线：',
  'Allergen Warning:': '过敏原警告：',
  'allergen warning:': '过敏原警告：',
  'Allergen warning:': '过敏原警告：',
  'Warning:': '警告：',
  'warning:': '警告：',
}

function translateEnglishTerms(text: string): string | null {
  if (!text) return null
  let result = text

  for (const [en, zh] of Object.entries(EN_TO_ZH_PHRASES)) {
    result = result.replace(new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), zh)
  }

  // Replace ingredient/allergen names.  Sort by length descending to match longer phrases first.
  const entries = Object.entries(INGREDIENT_ZH_MAP).sort((a, b) => b[0].length - a[0].length)
  for (const [en, zh] of entries) {
    if (en.length <= 3 && en.match(/^[a-z]+$/)) {
      // short words like "egg", "soy", "milk" – match whole word only
      result = result.replace(new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), zh)
    } else {
      // longer phrases – case-insensitive replace
      result = result.replace(new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), zh)
    }
  }

  if (result === text) return null
  return result.trim()
}

function getCategoryNameZh(category?: string): string {
  const map: Record<string, string> = {
    Appetizer: '开胃菜',
    Soup: '汤品',
    'Main Course': '主菜',
    'Noodles/Rice': '面食或米饭',
    Dessert: '甜点',
    Beverage: '饮品',
  }
  return map[category || ''] || '其他分类'
}

function getCuisineNameZh(cuisine?: string): string {
  const map: Record<string, string> = {
    Sichuan: '川菜',
    Cantonese: '粤菜',
    Shanghai: '沪菜',
    Beijing: '京菜',
    Hunan: '湘菜',
    Fujian: '闽菜',
    Fusion: '融合菜',
    Other: '其他菜系',
  }
  return map[cuisine || ''] || '其他菜系'
}

function getAllergenNameZh(allergen?: string): string {
  const key = String(allergen || '').toLowerCase()
  const map: Record<string, string> = {
    milk: '牛奶',
    dairy: '牛奶',
    eggs: '鸡蛋',
    egg: '鸡蛋',
    fish: '鱼类',
    shellfish: '甲壳类海鲜',
    'tree nuts': '坚果',
    tree_nuts: '坚果',
    peanuts: '花生',
    peanut: '花生',
    wheat: '小麦',
    soy: '大豆',
    soybeans: '大豆',
    sesame: '芝麻',
  }
  return map[key] || '需人工确认的过敏原'
}

function normalizeAllergenName(allergen?: string): string {
  const value = String(allergen || '').replace(/_/g, ' ').trim()
  if (!value) return 'Allergen pending review'
  return value
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function getSourceNameZh(source: string): string {
  const map: Record<string, string> = {
    standards_db: '标准数据库',
    rag_vector: '向量检索',
    hybrid: '混合模式',
    gemini: '人工智能生成',
  }
  return map[source] || source
}
