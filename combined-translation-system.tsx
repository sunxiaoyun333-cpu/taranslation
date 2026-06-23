'use client'

// =============================================================================
// TranslationResultDual — Micro Row-based Alignment Layout
// 每个数据点独立成行，中英文上下叠放，取代原来的左右大分栏
// =============================================================================

import type { TranslationResult } from '@/lib/types'
import type { Locale } from '@/lib/i18n'
import { ConfidenceIndicator } from './ConfidenceIndicator'

interface Props {
  result: TranslationResult
  locale: Locale
}

// ---- Internal pair type ----
interface TextPair { zh: string; en: string }
interface DetailPair { label: string; zh: string; en: string }

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TranslationResultDual({ result, locale }: Props) {
  const { dish, marketing, allergen_check: allergenCheck, compliance } = result

  if (!dish) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <p className="text-yellow-800">
          {locale === 'zh' ? '未找到该菜品。' : 'Dish not found.'}
        </p>
      </div>
    )
  }

  // ---- Derived values ----
  const dishNameZh   = toChineseSafeText(dish.name_cn, '待确认中文菜名')
  const dishNameEn   = dish.name_en_standard || dish.name_en || 'Unnamed dish'
  const categoryZh   = toChineseSafeText(dish.category_cn, getCategoryNameZh(dish.category))
  const categoryEn   = dish.category || 'Main Course'
  const cuisineEn    = dish.cuisine || 'Other'
  const cuisineZh    = getCuisineNameZh(cuisineEn)
  const spiceLevel   = Number(dish.spice_level || 0)
  const hasSpice     = spiceLevel > 0
  const spiceZh      = hasSpice ? `${'辣'.repeat(spiceLevel)}，辣度 ${spiceLevel} 级` : '不辣或未标注'
  const spiceEn      = hasSpice ? `Spice level ${spiceLevel} of 5` : 'Mild or not specified'
  const alternatives = dish.translation_alternatives || []
  const confidence   = result.confidence ?? 0

  const marketingDescPair = firstPairedText(
    [
      [marketing?.description_cn, marketing?.description_en],
      [dish.description_marketing_cn, dish.description_marketing],
      [dish.description_short_cn, dish.description_short],
    ],
    buildZhDescFallback(dishNameZh, cuisineZh, categoryZh, spiceZh),
    `${dishNameEn} has bold flavor, ideal for guests who enjoy ${cuisineEn} cuisine.`,
  )

  const shortDescPair = firstPairedText(
    [
      [dish.description_short_cn, dish.description_short],
      [marketing?.description_cn, marketing?.description_en],
    ],
    `${dishNameZh}，${cuisineZh}${categoryZh}，${spiceLevel > 0 ? `辣度${spiceLevel}级，` : ''}风味独特，推荐点选。`,
    `${dishNameEn}, a ${cuisineEn} ${categoryEn}.`,
  )

  const headlinePair = firstPairedText(
    [[marketing?.headline_cn, marketing?.headline_en]],
    `${cuisineZh}经典之选 — ${dishNameZh}`,
    `${dishNameEn}, a ${cuisineEn} favorite`,
  )

  const hooks     = buildPairs(marketing?.marketing_hooks?.cn, marketing?.marketing_hooks?.en, `${dishNameZh}风味独特，值得重点推荐，顾客回头率高。`, 'Unique flavor, recommended for featuring.')
  const warnings  = buildPairs(compliance?.warnings_cn, compliance?.warnings, '请向服务员确认过敏原信息后再点餐。', 'No additional warning')
  const notes     = buildPairs(compliance?.notes_cn, compliance?.notes, '如有饮食禁忌，请提前告知服务员。', 'No additional note')
  const pairings  = buildPairs(marketing?.pairing_suggestions_cn, marketing?.pairing_suggestions, `推荐搭配米饭或清爽饮品，与${dishNameZh}相得益彰。`, 'Pairs well with rice or a refreshing drink.')
  const tags      = buildPairs(marketing?.tags_cn, marketing?.tags, categoryZh, categoryEn)
  const usps      = buildSellingPoints(dishNameZh, dishNameEn, cuisineZh, cuisineEn, categoryZh, categoryEn, spiceZh, spiceEn, marketing?.unique_selling_points)

  const ingredients = buildIngredientPairs(
    dish.ingredients_cn,
    dish.ingredients_standard || dish.ingredients,
  )

  const allergens = buildAllergenPairs(result)
  const fdaStatementPair = buildFdaStatementPair(compliance?.fda_allergen_statement)
  const safeFor   = buildPairs(
    allergenCheck?.safe_for_cn,
    allergenCheck?.safe_for,
    '根据现有信息暂无法确认更多安全类别，建议顾客告知服务员饮食限制。',
    'No additional safe category',
  )

  const captions: DetailPair[] = [
    {
      label: '社交媒体文案',
      zh: firstChineseText(
        marketing?.social_media_captions?.instagram_cn,
        `🍽️ ${dishNameZh}｜${cuisineZh}${categoryZh}，${spiceLevel > 0 ? `辣度${spiceLevel}级` : '口味温和'}，香气四溢，回味无穷。`,
      ),
      en: firstText(marketing?.social_media_captions?.instagram_en, `${dishNameEn} — bold flavor worth sharing.`),
    },
    {
      label: '外卖平台标题',
      zh: firstChineseText(
        marketing?.social_media_captions?.doordash_cn,
        `${dishNameZh}｜${categoryZh}｜${cuisineZh}${spiceLevel > 0 ? `｜辣度${spiceLevel}级` : ''}`,
      ),
      en: firstText(marketing?.social_media_captions?.doordash_en, `${dishNameEn} | ${categoryEn} | ${cuisineEn}`),
    },
  ]

  // ---- English-only layout (simple single column) ----
  if (locale !== 'zh') {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <ConfidenceIndicator confidence={confidence} locale={locale} />

        <Card>
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">{categoryEn} · {cuisineEn}</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">{dishNameEn}</h2>
          {alternatives.length > 0 && (
            <p className="mt-1 text-sm text-slate-400">Also: {alternatives.join(', ')}</p>
          )}
          <p className="mt-4 text-base leading-7 text-slate-600">{marketingDescPair.en}</p>
        </Card>

        {allergens.length > 0 && (
          <AllergenCard allergens={allergens.map(a => a.en)} fda={compliance?.fda_allergen_statement} warnings={warnings.map(w => w.en)} notes={notes.map(n => n.en)} />
        )}

        <Card>
          <SectionLabel>Ingredients</SectionLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {ingredients.map((ing, i) => (
              <span key={i} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
                {ing.en}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <SectionLabel>Marketing</SectionLabel>
          <div className="mt-4 space-y-4">
            <RowField label="Headline">{headlinePair.en}</RowField>
            <RowField label="Description">{marketingDescPair.en}</RowField>
            {hooks.length > 0 && (
              <RowField label="Hooks">
                <ul className="space-y-1">{hooks.map((h, i) => <li key={i} className="text-slate-700">"{h.en}"</li>)}</ul>
              </RowField>
            )}
            {pairings.length > 0 && (
              <RowField label="Pairings">
                <ul className="space-y-1">{pairings.map((p, i) => <li key={i} className="text-slate-700">{p.en}</li>)}</ul>
              </RowField>
            )}
            {usps.length > 0 && (
              <RowField label="Unique Selling Points">
                <ul className="space-y-1">{usps.map((u, i) => <li key={i} className="text-slate-700">{u.en}</li>)}</ul>
              </RowField>
            )}
            {captions.map(c => <RowField key={c.label} label={c.label}>{c.en}</RowField>)}
            {tags.length > 0 && (
              <RowField label="Tags">
                <div className="flex flex-wrap gap-2">
                  {tags.map((t, i) => <span key={i} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">{t.en}</span>)}
                </div>
              </RowField>
            )}
          </div>
        </Card>
      </div>
    )
  }

  // ============================================================================
  // CHINESE (PRIMARY) LAYOUT — Micro Row-based Alignment
  // ============================================================================

  return (
    <div className="mx-auto max-w-3xl space-y-2">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 px-1 pb-1 pt-2">
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
            {categoryZh} · {cuisineZh}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{dishNameZh}</h1>
          <p className="mt-0.5 text-sm text-slate-400">{dishNameEn}</p>
        </div>
        <ConfidenceIndicator confidence={confidence} locale={locale} />
      </div>

      {/* ── 菜品基本信息 ──────────────────────────────────────────────── */}
      <FormSection title="菜品信息">
        <BilingualRow label="菜品名称" zh={dishNameZh} en={dishNameEn} highlight />
        {alternatives.length > 0 && (
          <BilingualRow
            label="英文备选名"
            zh="（无对应中文备选）"
            en={alternatives.join(' / ')}
            zhMuted
          />
        )}
        <BilingualRow label="菜品分类" zh={categoryZh} en={categoryEn} />
        <BilingualRow label="菜系风格" zh={cuisineZh} en={cuisineEn} />
        <BilingualRow
          label="辣度"
          zh={spiceZh}
          en={spiceEn}
          zhExtra={hasSpice ? <SpiceBar level={spiceLevel} /> : undefined}
        />
        <BilingualRow label="简短描述" zh={shortDescPair.zh} en={shortDescPair.en} multiline />
        <BilingualRow label="营销描述" zh={marketingDescPair.zh} en={marketingDescPair.en} multiline />
      </FormSection>

      {/* ── 食材清单（双语 Pill）──────────────────────────────────────── */}
      <FormSection title="食材清单">
        <div className="flex flex-wrap gap-2 py-1">
          {ingredients.length === 0 ? (
            <span className="text-sm text-slate-400">暂无食材信息</span>
          ) : (
            ingredients.map((ing, i) => (
              <BilingualPill key={i} zh={ing.zh} en={ing.en} />
            ))
          )}
        </div>
      </FormSection>

      {/* ── 过敏原与合规 ──────────────────────────────────────────────── */}
      {(allergens.length > 0 || warnings.some(w => w.zh && w.zh !== '暂无额外警告')) && (
        <FormSection title="过敏原与合规信息">
          {allergens.length > 0 ? (
            <>
              <div className="mb-3">
                <p className="mb-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase">检出的主要过敏原</p>
                <div className="flex flex-wrap gap-2">
                  {allergens.map((a, i) => (
                    <AllergenPill key={i} zh={a.zh} en={a.en} />
                  ))}
                </div>
              </div>
              {fdaStatementPair && (
                <BilingualRow
                  label="监管声明"
                  zh={fdaStatementPair.zh}
                  en={fdaStatementPair.en}
                  multiline
                  warn
                />
              )}
            </>
          ) : (
            <BilingualRow
              label="过敏原检测"
              zh="未检测到主要过敏原"
              en="No major allergens detected"
            />
          )}

          {safeFor.length > 0 && safeFor[0].zh !== '未检测到更多安全分类' && safeFor[0].zh !== '根据现有信息暂无法确认更多安全类别，建议顾客告知服务员饮食限制。' && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase">适用人群</p>
              <div className="flex flex-wrap gap-2">
                {safeFor.map((s, i) => (
                  <BilingualPill key={i} zh={s.zh} en={s.en} tone="emerald" />
                ))}
              </div>
            </div>
          )}

          {warnings.filter(w => w.zh && w.zh !== '暂无额外警告').map((w, i) => (
            <BilingualRow key={i} label={i === 0 ? '警告语' : ''} zh={w.zh} en={w.en} multiline warn />
          ))}
          {notes.filter(n => n.zh && n.zh !== '暂无额外说明').map((n, i) => (
            <BilingualRow key={i} label={i === 0 ? '补充说明' : ''} zh={n.zh} en={n.en} multiline />
          ))}
        </FormSection>
      )}

      {/* ── 营销文案 ──────────────────────────────────────────────────── */}
      <FormSection title="营销文案">
        <BilingualRow label="推荐标题" zh={headlinePair.zh} en={headlinePair.en} highlight multiline />
        <BilingualRow label="营销描述" zh={marketingDescPair.zh} en={marketingDescPair.en} multiline />

        {hooks.length > 0 && (
          <div className="py-2">
            <FieldLabel>营销金句</FieldLabel>
            <div className="mt-2 space-y-1.5">
              {hooks.map((h, i) => (
                <div key={i} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-sm font-medium text-slate-800">{h.zh}</p>
                  <p className="mt-0.5 text-xs text-slate-400 italic">"{h.en}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {pairings.length > 0 && pairings[0].zh !== '可搭配米饭或清爽饮品。' && (
          <div className="py-2">
            <FieldLabel>搭配建议</FieldLabel>
            <div className="mt-2 space-y-1.5">
              {pairings.map((p, i) => (
                <div key={i} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-sm font-medium text-slate-800">{p.zh}</p>
                  <p className="mt-0.5 text-xs text-slate-400 italic">{p.en}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {usps.length > 0 && (
          <div className="py-2">
            <FieldLabel>独特卖点</FieldLabel>
            <div className="mt-2 space-y-1.5">
              {usps.map((u, i) => (
                <div key={i} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-sm font-medium text-slate-800">{u.zh}</p>
                  <p className="mt-0.5 text-xs text-slate-400 italic">"{u.en}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {captions.map(c => (
          <BilingualRow key={c.label} label={c.label} zh={c.zh} en={c.en} multiline />
        ))}

        {tags.length > 0 && (
          <div className="py-2">
            <FieldLabel>标签</FieldLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((t, i) => (
                <BilingualPill key={i} zh={t.zh} en={t.en} tone="violet" />
              ))}
            </div>
          </div>
        )}
      </FormSection>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      {(dish.source || []).length > 0 && (
        <p className="pb-4 text-center text-xs text-slate-400">
          来源：{(dish.source || []).map(getSourceNameZh).join('、')} · 准确度 {(confidence * 100).toFixed(1)}% · {getSourceNameZh(result.source || '')}
        </p>
      )}
    </div>
  )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** 带标题的表单区块 */
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
        <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">{title}</h3>
      </div>
      <div className="divide-y divide-slate-100 px-4">
        {children}
      </div>
    </section>
  )
}

/** 白色卡片（英文布局用） */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      {children}
    </div>
  )
}

/** 核心：单行中英对照，中文在上、英文在下 */
function BilingualRow({
  label,
  zh,
  en,
  zhMuted,
  highlight,
  multiline,
  warn,
  zhExtra,
}: {
  label: string
  zh: string
  en: string
  zhMuted?: boolean
  highlight?: boolean
  multiline?: boolean
  warn?: boolean
  zhExtra?: React.ReactNode
}) {
  return (
    <div className="py-3">
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className={`mt-1.5 ${highlight ? 'space-y-1' : 'space-y-0.5'}`}>
        {/* 中文行 */}
        <div className="flex items-start gap-2">
          <span className="mt-px shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-blue-600">中</span>
          <p className={`${multiline ? 'leading-6' : 'leading-5'} ${zhMuted ? 'text-slate-400 italic' : warn ? 'font-medium text-amber-700' : highlight ? 'text-base font-semibold text-slate-900' : 'text-sm text-slate-800'}`}>
            {zh}
          </p>
          {zhExtra}
        </div>
        {/* 英文行 */}
        <div className="flex items-start gap-2">
          <span className="mt-px shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-emerald-600">EN</span>
          <p className={`${multiline ? 'leading-6' : 'leading-5'} ${warn ? 'text-amber-600/80 text-xs italic' : highlight ? 'text-sm font-medium text-slate-500' : 'text-xs text-slate-400'}`}>
            {en}
          </p>
        </div>
      </div>
    </div>
  )
}

/** 双语 Pill：中文单独一行，英文单独一行，避免中文区夹带英文 */
function BilingualPill({
  zh,
  en,
  tone = 'slate',
}: {
  zh: string
  en: string
  tone?: 'slate' | 'emerald' | 'violet'
}) {
  const toneClass = {
    slate: {
      wrapper: 'border-slate-200 bg-white',
      zh: 'text-slate-700',
      en: 'text-slate-400',
    },
    emerald: {
      wrapper: 'border-emerald-100 bg-emerald-50',
      zh: 'text-emerald-700',
      en: 'text-emerald-500',
    },
    violet: {
      wrapper: 'border-violet-100 bg-violet-50',
      zh: 'text-violet-700',
      en: 'text-violet-500',
    },
  }[tone]

  return (
    <span className={`inline-flex flex-col rounded-xl border px-3 py-1.5 text-xs shadow-sm ${toneClass.wrapper}`}>
      <span className={`font-medium leading-5 ${toneClass.zh}`}>{zh}</span>
      <span className={`leading-4 ${toneClass.en}`}>{en}</span>
    </span>
  )
}

/** 过敏原双语 Pill（红色警示） */
function AllergenPill({ zh, en }: { zh: string; en: string }) {
  return (
    <span className="inline-flex flex-col rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs">
      <span className="font-semibold leading-5 text-red-700">{zh}</span>
      <span className="leading-4 text-red-500">{en}</span>
    </span>
  )
}

/** 辣度可视化 */
function SpiceBar({ level }: { level: number }) {
  return (
    <span className="ml-2 flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`h-2 w-2 rounded-full ${i < level ? 'bg-red-500' : 'bg-slate-200'}`} />
      ))}
    </span>
  )
}

/** 字段 Label */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{children}</p>
  )
}

/** 英文布局 row */
function RowField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-1 text-sm leading-6 text-slate-700">{children}</div>
    </div>
  )
}

/** 英文布局区块标题 */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{children}</p>
}

// ---- 英文布局的过敏原卡片 ----
function AllergenCard({ allergens, fda, warnings, notes }: {
  allergens: string[]
  fda?: string
  warnings: string[]
  notes: string[]
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-widest text-red-600">⚠ Allergen Information</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {allergens.map((a, i) => (
          <span key={i} className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">{a}</span>
        ))}
      </div>
      {fda && (
        <p className="mt-3 rounded-md bg-white border border-red-100 px-3 py-2 font-mono text-xs text-red-700">{fda}</p>
      )}
      {warnings.filter(Boolean).map((w, i) => (
        <p key={i} className="mt-2 text-xs text-red-600 italic">{w}</p>
      ))}
    </div>
  )
}

// =============================================================================
// UTILITY FUNCTIONS  (mirrors lib/translation-utils.ts)
// =============================================================================

function toChineseSafeText(value: string | undefined, fallback: string): string {
  return normalizeChineseDisplayText(value, fallback)
}

function hasChinese(value: string): boolean {
  return /[\u3400-\u9fff\uf900-\ufaff]/.test(value)
}

function containsEnglishWords(value: string): boolean {
  return /[A-Za-z]{2,}/.test(value)
}

function applyIngredientReplacements(text: string): string {
  let result = text
  const entries = Object.entries(INGREDIENT_ZH_MAP).sort((a, b) => b[0].length - a[0].length)
  for (const [en, zh] of entries) {
    if (en.length <= 3 && /^[a-z]+$/.test(en)) {
      result = result.replace(new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), zh)
    } else {
      result = result.replace(new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), zh)
    }
  }
  return result
}

function sanitizeChineseText(value: string, fallback: string): string {
  if (!value || !hasChinese(value)) return fallback
  let text = value
  // 替换已知英文术语为中文
  text = text.replace(/\bFDA\b/g, '美国食品药品监督管理局')
  text = text.replace(/Contains\s*:\s*/gi, '包含：')
  text = text.replace(/No major allergens detected/gi, '未检测到主要过敏原')
  text = text.replace(/requires manual verification/gi, '需要人工确认')
  text = text.replace(/manual verification/gi, '人工确认')
  // 从 EN_TO_ZH_PHRASES 替换（在函数引用之前 EN_TO_ZH_PHRASES 尚未声明，用内联 map 避免循环依赖）
  const inlineMap: Record<string, string> = {
    'bold flavor': '风味鲜明', 'rich flavor': '口味醇厚', 'authentic': '正宗',
    'traditional': '传统', 'classic': '经典', 'signature': '招牌',
    'spicy': '麻辣', 'mildly spicy': '微辣', 'crispy': '酥脆', 'tender': '嫩滑',
    'steamed rice': '白米饭', 'fried rice': '炒饭', 'noodles': '面条',
    'vegetarian': '素食', 'vegan': '纯素', 'gluten-free': '无麸质',
  }
  for (const [en, zh] of Object.entries(inlineMap)) {
    text = text.replace(new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), zh)
  }
  text = applyIngredientReplacements(text)
  text = text.replace(/\s+/g, ' ').trim()
  // 清洗后仍含中文即视为有效，不再因残留少量英文字母而整体丢弃
  return hasChinese(text) ? text : fallback
}

function normalizeChineseDisplayText(value: string | undefined, fallback: string): string {
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

// ---- 基于结构化信息构造中文营销描述（当后端 _cn 字段缺失时使用）----

function buildZhDescFallback(
  dishNameZh: string,
  cuisineZh: string,
  categoryZh: string,
  spiceZh: string,
): string {
  const spicePart = spiceZh !== '不辣或未标注' ? `，${spiceZh}` : '，口味温和'
  return `${dishNameZh}是一道经典${cuisineZh}${categoryZh}${spicePart}，选材讲究，风味鲜明，适合搭配米饭或面食享用，深受食客喜爱。`
}

const EN_TO_ZH_PHRASES: Record<string, string> = {
  // allergen statements
  'Contains:': '包含：', 'contains:': '包含：', 'Contains': '包含', 'contains': '包含',
  'May contain': '可能含有', 'may contain': '可能含有',
  'May contain traces of': '可能含有微量', 'may contain traces of': '可能含有微量',
  'Processed in a facility that also processes': '生产设备同时处理',
  'processed in a facility that also processes': '生产设备同时处理',
  'Manufactured on shared equipment with': '与以下原料共用生产线：',
  'manufactured on shared equipment with': '与以下原料共用生产线：',
  'Allergen Warning:': '过敏原警告：', 'allergen warning:': '过敏原警告：', 'Allergen warning:': '过敏原警告：',
  'Warning:': '警告：', 'warning:': '警告：',
  'No major allergens detected': '未检测到主要过敏原',
  'requires manual verification': '需要人工确认',
  'manual verification': '人工确认',

  // cuisine & category translations
  'Sichuan cuisine': '川菜', 'Cantonese cuisine': '粤菜', 'Shanghai cuisine': '沪菜',
  'Beijing cuisine': '京菜', 'Hunan cuisine': '湘菜', 'Fujian cuisine': '闽菜',
  'Fusion cuisine': '融合菜', 'Chinese cuisine': '中餐',
  'Main Course': '主菜', 'Appetizer': '开胃菜', 'Soup': '汤品',
  'Noodles/Rice': '面食/米饭', 'Dessert': '甜品', 'Beverage': '饮品',

  // common marketing phrases
  'bold flavor': '风味鲜明', 'rich flavor': '口味醇厚', 'savory': '鲜美', 'umami': '鲜香',
  'melt-in-your-mouth': '入口即化', 'crispy': '酥脆', 'tender': '嫩滑',
  'aromatic': '香气四溢', 'fragrant': '芳香浓郁', 'flavorful': '风味浓郁',
  'spicy': '麻辣', 'mildly spicy': '微辣', 'fiery': '火辣',
  'authentic': '正宗', 'traditional': '传统', 'classic': '经典',
  'handcrafted': '手工制作', 'slow-cooked': '慢火炖制', 'wok-tossed': '大火爆炒',
  'stir-fried': '翻炒', 'deep-fried': '油炸', 'steamed': '清蒸', 'braised': '红烧',
  'chef\'s special': '大厨特制', 'house specialty': '招牌菜', 'signature': '招牌', 'must-try': '必点推荐',
  'customer favorite': '顾客最爱', 'best seller': '畅销菜品', 'popular': '深受欢迎',
  'recommended': '推荐', 'signature dish': '招牌菜', 'award-winning': '屡获好评',

  // pairing suggestions
  'Pairs well with': '推荐搭配', 'pairs well with': '推荐搭配',
  'Perfect with': '最佳搭配', 'perfect with': '最佳搭配',
  'Great with': '适合搭配', 'great with': '适合搭配',
  'steamed rice': '白米饭', 'fried rice': '炒饭', 'white rice': '白米饭',
  'jasmine tea': '茉莉花茶', 'green tea': '绿茶', 'oolong tea': '乌龙茶',
  'cold beer': '冰镇啤酒', 'sparkling water': '气泡水', 'lemonade': '柠檬水',
  'noodles': '面条', 'dumplings': '饺子', 'spring rolls': '春卷',

  // safe-for categories
  'gluten-free': '无麸质', 'dairy-free': '无乳制品', 'nut-free': '无坚果',
  'vegetarian': '素食', 'vegan': '纯素', 'halal': '清真',
  'low-sodium': '低钠', 'low-calorie': '低热量',
}

function translateEnglishTerms(text: string): string | null {
  if (!text) return null
  let result = text
  for (const [en, zh] of Object.entries(EN_TO_ZH_PHRASES)) {
    result = result.replace(new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), zh)
  }
  result = applyIngredientReplacements(result)
  return result !== text ? result.trim() : null
}

function firstText(...values: Array<string | undefined>): string {
  return values.find(v => v && v.trim().length > 0)?.trim() || ''
}

function firstChineseText(...values: Array<string | undefined>): string {
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
  // 第一轮：找到有中文字段且对应英文字段都存在的 pair
  for (const [zhVal, enVal] of pairs) {
    const en = (enVal || '').trim()
    if (!en) continue
    const normalizedZh = normalizeChineseDisplayText(zhVal, '')
    if (normalizedZh) {
      return { zh: normalizedZh, en }
    }
  }
  // 第二轮：有英文但没有中文——用英文内容做结构化翻译
  for (const [, enVal] of pairs) {
    const en = (enVal || '').trim()
    if (!en) continue
    const translated = translateEnglishTerms(en)
    if (translated && hasChinese(translated)) {
      return { zh: translated, en }
    }
    // translateEnglishTerms 覆盖不了的长句，直接用英文内容构造中文
    return { zh: zhFallback, en }
  }
  return { zh: zhFallback, en: enFallback }
}

function normalizeList(values?: string[]): string[] {
  return (values || []).map(item => String(item || '').trim()).filter(Boolean)
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
  if (length === 0) return []
  return Array.from({ length }, (_, i) => {
    const enText = en[i] || enFallback
    const normalizedZh = normalizeChineseDisplayText(zh[i], '')

    // 优先用后端返回的中文字段（经过清洗）
    if (normalizedZh) {
      return { zh: normalizedZh, en: enText }
    }

    // 后端中文字段缺失或被污染——用英文做结构化翻译
    const translated = translateEnglishTerms(enText)
    if (translated && hasChinese(translated)) {
      return { zh: translated, en: enText }
    }

    // translateEnglishTerms 无法处理的长句——用 zhFallback（调用方保证其为有意义的中文）
    return { zh: zhFallback, en: enText }
  })
}

function buildIngredientPairs(
  zhValues: string[] | undefined,
  enValues: string[] | undefined,
): TextPair[] {
  const zh = normalizeList(zhValues)
  const en = normalizeList(enValues)
  const length = Math.max(zh.length, en.length)
  if (length === 0) return []
  return Array.from({ length }, (_, i) => {
    const enText = en[i] || 'Pending ingredient'
    const normalizedZh = normalizeChineseDisplayText(zh[i], '')
    if (normalizedZh) return { zh: normalizedZh, en: enText }
    const translated = ingredientNameToChinese(enText)
    return { zh: translated || '待确认食材', en: enText }
  })
}

function buildAllergenPairs(result: TranslationResult): TextPair[] {
  const detected = result.allergen_check?.allergens || []
  if (detected.length > 0) {
    return detected.map(allergen => ({
      zh: normalizeChineseDisplayText(
        allergen.name_cn,
        getAllergenNameZh(allergen.id || allergen.name),
      ),
      en: allergen.name || normalizeAllergenName(allergen.id),
    }))
  }
  return (result.dish.allergens_standard || []).map(allergen => ({
    zh: getAllergenNameZh(allergen),
    en: normalizeAllergenName(allergen),
  }))
}

function buildSellingPoints(
  dishNameZh: string, dishNameEn: string,
  cuisineZh: string, cuisineEn: string,
  categoryZh: string, categoryEn: string,
  spiceZh: string, spiceEn: string,
  source?: string[],
): TextPair[] {
  const en = normalizeList(source)
  if (en.length > 0) {
    return en.map((enText) => {
      // 先尝试结构化翻译
      const translated = translateEnglishTerms(enText)
      if (translated && hasChinese(translated)) {
        return { zh: translated, en: enText }
      }
      // 翻译不了的，构造语义等价中文
      return {
        zh: buildUspZh(enText, dishNameZh, cuisineZh, categoryZh, spiceZh),
        en: enText,
      }
    })
  }
  // 后端没有 USP 数据，基于菜品信息生成3条完整中文卖点
  return [
    {
      zh: `${dishNameZh}采用${cuisineZh}传统做法，突出${categoryZh}的核心风味，适合作为菜单重点推荐。`,
      en: `${dishNameEn} follows traditional ${cuisineEn} cooking methods, ideal as a featured ${categoryEn}.`,
    },
    {
      zh: `${spiceZh}，方便顾客根据口味喜好提前判断，减少点餐疑虑。`,
      en: `${spiceEn}, helping guests make an informed choice based on their spice preference.`,
    },
    {
      zh: `本文案经过专业优化，可直接用于菜单印刷、外卖平台上架及社交媒体推广，节省重复编辑时间。`,
      en: `Copy is professionally optimized for use on printed menus, delivery platforms, and social media.`,
    },
  ]
}

function buildFdaStatementPair(statement?: string): TextPair | null {
  const en = firstText(statement)
  if (!en) return null

  const translated = normalizeChineseDisplayText(
    en,
    '该合规声明需人工确认，请以英文说明为准。',
  )

  return {
    zh: translated,
    en,
  }
}

function buildUspZh(
  enText: string,
  dishNameZh: string,
  cuisineZh: string,
  categoryZh: string,
  spiceZh: string,
): string {
  const lower = enText.toLowerCase()
  if (lower.includes('authentic') || lower.includes('traditional')) return `${dishNameZh}沿用${cuisineZh}正宗传统做法，口味地道，还原经典风味。`
  if (lower.includes('spice') || lower.includes('hot') || lower.includes('fiery')) return `${dishNameZh}${spiceZh}，麻辣鲜香，是嗜辣食客的首选。`
  if (lower.includes('vegetarian') || lower.includes('vegan')) return `${dishNameZh}适合素食者，无肉类成分，营养均衡。`
  if (lower.includes('gluten')) return `${dishNameZh}无麸质，适合麸质过敏人群放心享用。`
  if (lower.includes('popular') || lower.includes('best seller') || lower.includes('favorite')) return `${dishNameZh}是本店畅销${categoryZh}，深受顾客喜爱，点单率持续领先。`
  if (lower.includes('fresh')) return `${dishNameZh}选用新鲜食材每日现做，保证口感与品质。`
  if (lower.includes('chef') || lower.includes('special') || lower.includes('signature')) return `${dishNameZh}为本店招牌${categoryZh}，由主厨亲自调制，秘方独特。`
  if (lower.includes('healthy') || lower.includes('nutritious')) return `${dishNameZh}营养均衡，健康美味，是注重饮食健康顾客的理想之选。`
  // 通用 fallback
  return `${dishNameZh}是一道精选${cuisineZh}${categoryZh}，风味突出，深受食客推荐。`
}

// ---- Name maps ----

function getCategoryNameZh(category?: string): string {
  const map: Record<string, string> = {
    Appetizer: '开胃菜', Soup: '汤品', 'Main Course': '主菜',
    'Noodles/Rice': '面食/米饭', Dessert: '甜品', Beverage: '饮品',
  }
  return map[category || ''] || '其他分类'
}

function getCuisineNameZh(cuisine?: string): string {
  const map: Record<string, string> = {
    Sichuan: '川菜', Cantonese: '粤菜', Shanghai: '沪菜',
    Beijing: '京菜', Hunan: '湘菜', Fujian: '闽菜', Fusion: '融合菜', Other: '其他',
  }
  return map[cuisine || ''] || '其他菜系'
}

function getAllergenNameZh(allergen?: string): string {
  const key = String(allergen || '').toLowerCase()
  const map: Record<string, string> = {
    milk: '牛奶', dairy: '牛奶', eggs: '鸡蛋', egg: '鸡蛋',
    fish: '鱼类', shellfish: '甲壳类海鲜',
    'tree nuts': '坚果', tree_nuts: '坚果',
    peanuts: '花生', peanut: '花生',
    wheat: '小麦', soy: '大豆', soybeans: '大豆', sesame: '芝麻',
  }
  return map[key] || '需人工确认的过敏原'
}

function normalizeAllergenName(allergen?: string): string {
  const raw = String(allergen || '').replace(/_/g, ' ').trim()
  const value = raw && raw !== 'undefined' ? raw : ''
  if (!value) return 'Allergen pending review'
  return value.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
}

function getSourceNameZh(source: string): string {
  const map: Record<string, string> = {
    standards_db: '标准数据库',
    rag_vector: '向量检索',
    hybrid: '混合模式',
    gemini: 'AI 生成',
  }
  return map[source] || source
}

const INGREDIENT_ZH_MAP: Record<string, string> = {
  // meat & poultry
  'chicken breast': '鸡胸肉', 'chicken thigh': '鸡腿肉', 'chicken wing': '鸡翅',
  'ground chicken': '鸡肉碎', chicken: '鸡肉',
  'roast duck': '烧鸭', duck: '鸭肉',
  lamb: '羊肉', mutton: '羊肉',
  beef: '牛肉',
  'beef brisket': '牛腩', 'beef shank': '牛腱', 'beef tenderloin': '牛里脊', 'beef tripe': '牛肚',
  pork: '猪肉', 'ground pork': '猪肉碎',
  'pork belly': '五花肉', 'pork ribs': '排骨', 'pork shoulder': '猪肩肉', 'pork loin': '猪里脊',
  // seafood
  salmon: '三文鱼', cod: '鳕鱼', tilapia: '罗非鱼',
  shrimp: '虾', 'shrimp paste': '虾酱',
  crab: '蟹肉', lobster: '龙虾',
  scallop: '扇贝', squid: '鱿鱼', octopus: '章鱼',
  clam: '蛤蜊', mussel: '青口', oyster: '蚝',
  'fish fillet': '鱼片', 'fish ball': '鱼丸',
  // vegetables
  broccoli: '西兰花', 'chinese broccoli': '芥蓝',
  'bok choy': '白菜', 'baby bok choy': '小白菜',
  cabbage: '卷心菜', 'napa cabbage': '大白菜',
  spinach: '菠菜', 'water spinach': '空心菜', lettuce: '生菜',
  celery: '芹菜', carrot: '胡萝卜',
  potato: '土豆', 'sweet potato': '红薯',
  corn: '玉米', 'baby corn': '玉米笋',
  mushroom: '蘑菇', 'shiitake mushroom': '香菇',
  'enoki mushroom': '金针菇', 'wood ear mushroom': '木耳', 'king oyster mushroom': '杏鲍菇',
  'bamboo shoot': '竹笋',
  cucumber: '黄瓜', 'bitter melon': '苦瓜', eggplant: '茄子',
  'bell pepper': '灯笼椒', 'green pepper': '青椒', 'red pepper': '红椒',
  'snow pea': '荷兰豆', 'snap pea': '甜豆', 'bean sprout': '豆芽',
  onion: '洋葱', 'green onion': '葱', 'spring onion': '小葱', scallion: '葱',
  garlic: '大蒜', ginger: '生姜',
  'lotus root': '莲藕', 'water chestnut': '马蹄',
  // tofu & soy
  tofu: '豆腐', 'silken tofu': '嫩豆腐', 'firm tofu': '老豆腐',
  'fried tofu': '炸豆腐', 'tofu skin': '豆腐皮', 'tofu puff': '豆腐泡',
  'fermented tofu': '腐乳',
  'soy sauce': '酱油', 'dark soy sauce': '老抽', 'light soy sauce': '生抽',
  'soybean paste': '豆瓣酱', doubanjiang: '豆瓣酱', 'hoisin sauce': '海鲜酱',
  // seasoning & sauces
  'oyster sauce': '蚝油', 'sesame oil': '芝麻油',
  'chili oil': '辣椒油', 'chili sauce': '辣椒酱', sriracha: '是拉差辣酱',
  'black bean sauce': '豆豉酱', 'fermented black bean': '豆豉',
  vinegar: '醋', 'rice vinegar': '米醋', 'black vinegar': '陈醋',
  'white pepper': '白胡椒', 'black pepper': '黑胡椒',
  'five spice': '五香粉', 'star anise': '八角', cinnamon: '桂皮', 'sichuan peppercorn': '花椒',
  salt: '盐', sugar: '糖', 'brown sugar': '红糖', 'rock sugar': '冰糖',
  // noodles & dough
  noodles: '面条', 'rice noodle': '米粉', 'flat rice noodle': '河粉', 'egg noodle': '鸡蛋面',
  'wonton wrapper': '馄饨皮', 'dumpling wrapper': '饺子皮', 'spring roll wrapper': '春卷皮',
  rice: '米饭',
  // other
  'corn starch': '玉米淀粉', 'potato starch': '土豆淀粉',
  'cooking wine': '料酒', 'shaoxing wine': '绍兴酒',
  'chicken broth': '鸡汤', 'chicken stock': '鸡高汤', 'pork broth': '猪骨汤',
  'vegetable oil': '植物油', 'peanut oil': '花生油', 'canola oil': '菜籽油',
  egg: '鸡蛋', eggs: '鸡蛋',
  peanut: '花生', cashew: '腰果', almond: '杏仁', walnut: '核桃',
  cilantro: '香菜', basil: '九层塔', 'thai basil': '九层塔', mint: '薄荷',
}

function ingredientNameToChinese(name: string): string | null {
  if (!name) return null
  const lower = name.toLowerCase().trim()
  if (INGREDIENT_ZH_MAP[lower]) return INGREDIENT_ZH_MAP[lower]
  if (lower.endsWith('s')) {
    const singular = lower.slice(0, -1)
    if (INGREDIENT_ZH_MAP[singular]) return INGREDIENT_ZH_MAP[singular]
  }
  const stripped = lower.replace(/^(fresh|dried|ground|sliced|chopped|minced|roasted|fried|steamed|boiled|pickled|crispy|(?:deep|slow|pan|wok|stir|hand)[- ]?(?:fried|cooked|made|tossed))\s+/, '')
  if (stripped !== lower && INGREDIENT_ZH_MAP[stripped]) return INGREDIENT_ZH_MAP[stripped]
  return null
}
