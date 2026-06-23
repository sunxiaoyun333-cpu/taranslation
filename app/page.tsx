'use client';

import SearchBar from '@/components/SearchBar';
import { useLanguage } from '@/components/LanguageProvider';

const content = {
  en: {
    navLabel: 'Language',
    zhToggle: '中文',
    enToggle: 'English',
    eyebrow: 'AI menu translation for North American restaurants',
    heroLine1: 'Translate Chinese menus into',
    heroLine2: 'clear, compliant English.',
    heroSubtitle:
      'Turn Chinese dish names into polished English menu copy with allergen checks, ingredient context, and marketing-ready descriptions in one workflow.',
    primaryMetric: '9',
    primaryMetricLabel: 'FDA major allergens checked',
    secondaryMetric: '100+',
    secondaryMetricLabel: 'Chinese ingredients mapped',
    tertiaryMetric: 'CN/EN',
    tertiaryMetricLabel: 'Bilingual output',
    searchTitle: 'Start with a dish name',
    searchSubtitle: 'Use Chinese, English, or pinyin. Results include translation, allergen risk, and ready-to-use copy.',
    workflowTitle: 'A practical workflow for busy menus',
    workflowSubtitle:
      'Designed around the actual handoff from kitchen language to customer-facing English.',
    trustTitle: 'Built for restaurant operations',
    faqTitle: 'Questions operators ask first',
    features: [
      {
        label: 'Translation',
        title: 'Cuisine-aware English names',
        description:
          'Keeps regional cooking context intact, so dishes read naturally instead of sounding machine translated.',
      },
      {
        label: 'Compliance',
        title: 'Allergen risk surfaced early',
        description:
          'Flags FDA major allergens and uncertain ingredients before copy goes live on menus or delivery platforms.',
      },
      {
        label: 'Sales copy',
        title: 'Descriptions that help guests order',
        description:
          'Creates concise bilingual selling points that explain flavor, texture, and appeal without overpromising.',
      },
    ],
    steps: [
      {
        title: 'Enter the dish',
        description: 'Paste a Chinese name, English name, or pinyin from your working menu.',
      },
      {
        title: 'Review the translation',
        description: 'Compare the English output with ingredient and cuisine context.',
      },
      {
        title: 'Check allergen notes',
        description: 'Scan confidence levels and items that may need manual kitchen verification.',
      },
      {
        title: 'Publish cleaner copy',
        description: 'Use the bilingual description in your printed menu, POS, or delivery listing.',
      },
    ],
    trust: [
      'Structured for Chinese and Asian cuisine terminology',
      'Focused on FDA-recognized allergen categories',
      'Useful for delivery menus, dine-in menus, and staff review',
    ],
    faqs: [
      {
        q: 'What cuisines does this support?',
        a: 'It is optimized for Chinese and Asian cuisine, including Cantonese, Sichuan, Hunan, Taiwanese, and similar regional menus.',
      },
      {
        q: 'Can this replace manual allergen review?',
        a: 'No. It helps surface likely risks quickly, but final allergen verification should still come from the restaurant team and ingredient suppliers.',
      },
      {
        q: 'Do I need an API key?',
        a: 'Yes. The app reads the model key from your server environment so it is not exposed in the browser.',
      },
    ],
  },
  zh: {
    navLabel: '界面语言',
    zhToggle: '中文',
    enToggle: 'English',
    eyebrow: '面向北美餐饮的 AI 菜单翻译工具',
    heroLine1: '把中文菜单翻译成',
    heroLine2: '清晰、合规、好下单的英文。',
    heroSubtitle:
      '输入一道菜名，即可生成专业英文菜单文案，并同步检查过敏原、解释食材语境、输出可直接使用的中英描述。',
    primaryMetric: '9',
    primaryMetricLabel: 'FDA 主要过敏原检查',
    secondaryMetric: '100+',
    secondaryMetricLabel: '中餐常见食材映射',
    tertiaryMetric: '中英',
    tertiaryMetricLabel: '双语结果输出',
    searchTitle: '先输入一道菜名',
    searchSubtitle: '支持中文、英文或拼音。结果会包含翻译、过敏原风险和可直接使用的营销描述。',
    workflowTitle: '更贴近餐厅实际流程',
    workflowSubtitle:
      '从后厨熟悉的中文菜名，到顾客看得懂、愿意点、也更合规的英文菜单。',
    trustTitle: '为餐饮运营场景设计',
    faqTitle: '餐厅老板常问的问题',
    features: [
      {
        label: '翻译',
        title: '懂中餐语境的英文菜名',
        description: '保留菜系、做法和风味重点，避免生硬直译，让英文菜单更自然。',
      },
      {
        label: '合规',
        title: '提前暴露过敏原风险',
        description: '标记 FDA 主要过敏原和不确定食材，方便上线菜单前做人工复核。',
      },
      {
        label: '转化',
        title: '让顾客更容易下单的描述',
        description: '生成精简的中英卖点，解释口味、口感和特色，适合堂食与外卖平台。',
      },
    ],
    steps: [
      {
        title: '输入菜品',
        description: '把菜单里的中文名、英文名或拼音直接粘贴进来。',
      },
      {
        title: '核对翻译',
        description: '查看英文菜名、食材说明和菜系语境是否准确。',
      },
      {
        title: '检查过敏原',
        description: '重点看置信度和需要后厨人工确认的风险项。',
      },
      {
        title: '发布文案',
        description: '把中英描述用于纸质菜单、POS 系统或外卖平台。',
      },
    ],
    trust: [
      '针对中餐和亚洲菜系术语优化',
      '围绕 FDA 认可的主要过敏原分类',
      '适合外卖菜单、堂食菜单和员工复核',
    ],
    faqs: [
      {
        q: '支持哪些菜系？',
        a: '重点优化中餐和亚洲菜系，包括粤菜、川菜、湘菜、台式料理以及常见区域菜名。',
      },
      {
        q: '可以完全替代人工过敏原审核吗？',
        a: '不建议。它可以快速提示可能风险，但最终确认仍应由餐厅团队结合实际配方和供应商信息完成。',
      },
      {
        q: '需要配置 API Key 吗？',
        a: '需要。API Key 应放在服务端环境变量中读取，避免暴露到浏览器前端。',
      },
    ],
  },
};

export default function Home() {
  const { lang, setLang } = useLanguage();
  const t = content[lang];

  return (
    <div className="bg-[linear-gradient(180deg,#fff7ed_0%,#fff_38%,#f8fafc_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-end">
          <div className="flex items-center gap-2 rounded-full border border-orange-100 bg-white/90 p-1 text-sm shadow-sm">
            <span className="hidden px-3 text-xs font-medium uppercase tracking-wide text-gray-500 sm:inline">
              {t.navLabel}
            </span>
            <button
              onClick={() => setLang('zh')}
              className={`rounded-full px-4 py-2 font-medium transition ${
                lang === 'zh' ? 'bg-gray-950 text-white shadow-sm' : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              {t.zhToggle}
            </button>
            <button
              onClick={() => setLang('en')}
              className={`rounded-full px-4 py-2 font-medium transition ${
                lang === 'en' ? 'bg-gray-950 text-white shadow-sm' : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              {t.enToggle}
            </button>
          </div>
        </div>

        <section className="mx-auto max-w-5xl py-10 text-center lg:py-16">
          <div className="flex justify-center">
            <div className="inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm">
              {t.eyebrow}
            </div>
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl font-heading text-4xl font-bold leading-tight tracking-normal text-gray-950 sm:text-5xl lg:text-6xl">
            {t.heroLine1}
            <span className="block text-primary-600">{t.heroLine2}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600 sm:text-xl">
            {t.heroSubtitle}
          </p>

          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-3 overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-sm">
            {[
              [t.primaryMetric, t.primaryMetricLabel],
              [t.secondaryMetric, t.secondaryMetricLabel],
              [t.tertiaryMetric, t.tertiaryMetricLabel],
            ].map(([value, label]) => (
              <div key={label} className="border-r border-gray-200 p-4 text-center last:border-r-0">
                <div className="text-2xl font-bold text-gray-950">{value}</div>
                <div className="mx-auto mt-1 max-w-[9rem] text-xs font-medium leading-5 text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="search" className="mx-auto max-w-4xl pb-12">
          <div className="rounded-lg border border-orange-100 bg-white p-4 text-left shadow-xl shadow-orange-950/10 sm:p-6">
            <div className="mb-5 border-b border-gray-100 pb-5">
              <h2 className="text-center text-xl font-bold text-gray-950">{t.searchTitle}</h2>
              <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-gray-600">{t.searchSubtitle}</p>
            </div>
            <SearchBar />
          </div>
        </section>

        <section id="features" className="py-10">
          <div className="grid gap-4 md:grid-cols-3">
            {t.features.map((feature) => (
              <article key={feature.title} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wide text-primary-600">{feature.label}</div>
                <h3 className="mt-4 text-xl font-bold text-gray-950">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="grid gap-10 py-14 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <h2 className="font-heading text-3xl font-bold text-gray-950 sm:text-4xl">{t.workflowTitle}</h2>
            <p className="mt-4 text-base leading-7 text-gray-600">{t.workflowSubtitle}</p>

            <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">{t.trustTitle}</h3>
              <div className="mt-5 space-y-4">
                {t.trust.map((item) => (
                  <div key={item} className="flex gap-3 text-sm leading-6 text-gray-700">
                    <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-primary-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {t.steps.map((step, i) => (
              <article key={step.title} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-950 text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-5 text-lg font-bold text-gray-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl py-14">
          <h2 className="text-center font-heading text-3xl font-bold text-gray-950 sm:text-4xl">{t.faqTitle}</h2>
          <div className="mt-8 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white shadow-sm">
            {t.faqs.map((faq) => (
              <details key={faq.q} className="group p-6">
                <summary className="cursor-pointer list-none text-base font-semibold text-gray-950 transition group-open:text-primary-600">
                  <span className="flex items-center justify-between gap-4">
                    {faq.q}
                    <span className="text-xl font-light text-gray-400 transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-6 text-gray-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
