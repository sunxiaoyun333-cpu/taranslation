# PROJECT_MAP.md

## 项目概述

**项目名称**: Menu Translator - 专业中餐菜单翻译系统  
**技术栈**: Next.js 14 + TypeScript + Gemini AI + Supabase + Tailwind CSS  
**目标**: 为美国华人餐厅提供专业的菜单翻译，包含FDA合规检查、营销优化建议

## 核心功能

1. **RAG向量搜索**: 基于Gemini embeddings的语义搜索
2. **LLM增强**: 使用Gemini 1.5 Flash生成合规建议、FAQ、营销文案
3. **多层缓存**: 内存缓存 + 数据库缓存，降低API成本
4. **响应式UI**: 搜索界面 + 详细结果展示
5. **🆕 FDA标准过敏原库**: 完整的食材→过敏原映射数据库

## 技术决策

### 为什么选择Gemini？
- ✅ 免费额度充足（1500次/天）
- ✅ 成本极低（$0.075/百万tokens）
- ✅ 原生JSON输出支持
- ✅ 多模态能力（未来可扩展图片识别）

### 为什么选择Supabase？
- ✅ 免费PostgreSQL + pgvector
- ✅ 实时数据库功能
- ✅ 简单易用的客户端SDK

### 架构图

```
用户输入 → Next.js API Route → RAG向量搜索 → Supabase
                ↓
         LLM增强（Gemini）
                ↓
      🆕 过敏原智能检测
                ↓
         结构化结果返回
```

---

## 📁 项目结构

```
menu-translator/
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx               # 全局布局
│   ├── page.tsx                 # 首页（搜索+结果展示）
│   ├── globals.css              # 全局样式（Tailwind）
│   │
│   └── api/                     # API Routes
│       ├── translate/
│       │   └── route.ts         # 🔥 核心翻译API
│       ├── search/
│       │   └── route.ts         # 搜索建议API（可选）
│       ├── allergens/           # 🆕 过敏原相关API
│       │   ├── check/route.ts  # 检测食材中的过敏原
│       │   └── list/route.ts   # 获取所有过敏原列表
│       └── health/
│           └── route.ts         # 健康检查
│
├── lib/                         # 核心业务逻辑
│   ├── types.ts                 # 🔥 TypeScript类型定义（全局）
│   ├── gemini.ts                # 🔥 Gemini API封装
│   ├── supabase.ts              # Supabase客户端
│   ├── rag.ts                   # RAG向量搜索逻辑
│   ├── cache.ts                 # 缓存管理
│   ├── allergens.ts             # 🆕🔥 过敏原检测逻辑
│   └── utils.ts                 # 工具函数
│
├── components/                  # React组件
│   ├── SearchBar.tsx            # 搜索输入框
│   ├── ResultCard.tsx           # 结果卡片
│   ├── ComplianceAlert.tsx      # 🔥 FDA合规提醒组件
│   ├── AllergenBadge.tsx        # 🆕 过敏原标签组件
│   ├── MarketingTips.tsx        # 营销建议组件
│   ├── LoadingState.tsx         # 加载骨架屏
│   └── ErrorBoundary.tsx        # 错误边界
│
├── data/                        # 静态数据
│   ├── dishes-seed.json         # 🔥 初始10个菜品数据
│   ├── allergens-fda.json       # 🆕🔥 FDA认定的主要过敏原
│   ├── ingredients-allergens-map.json  # 🆕🔥 食材→过敏原映射表
│   └── chinese-ingredients.json # 🆕 常见中餐食材中英对照
│
├── scripts/                     # 开发脚本
│   ├── init-db.ts               # 🔥 初始化数据库
│   ├── generate-embeddings.ts  # 🔥 生成向量embedding
│   ├── seed-data.ts             # 填充种子数据
│   ├── validate-allergens.ts   # 🆕 验证过敏原数据完整性
│   └── test-api.ts              # API测试脚本
│
├── supabase/                    # Supabase配置
│   └── schema.sql               # 🔥 数据库Schema
│
├── public/                      # 静态资源
│   ├── logo.svg
│   └── og-image.png
│
├── .env.local.example           # 环境变量模板
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── postcss.config.js
├── PROJECT_MAP.md               # 本文件
└── README.md                    # 用户文档
```

---

## 🔥 关键文件说明

### 🆕 1. `data/allergens-fda.json`
**作用**: FDA认定的主要食物过敏原标准库  
**重要性**: ⭐⭐⭐⭐⭐  
**数据来源**: FDA Food Allergen Labeling

> 完整 JSON 见项目文件：`data/allergens-fda.json`

---

### 🆕 2. `data/ingredients-allergens-map.json`
**作用**: 中餐常用食材的详细过敏原映射  
**重要性**: ⭐⭐⭐⭐⭐  
**用途**: 自动检测菜品中的过敏原

> 完整 JSON 见项目文件：`data/ingredients-allergens-map.json`

---

### 🆕 3. `lib/allergens.ts`
**作用**: 过敏原检测和验证逻辑  
**重要性**: ⭐⭐⭐⭐⭐  
**依赖**: `data/allergens-fda.json`, `data/ingredients-allergens-map.json`

> 完整实现见项目文件：`lib/allergens.ts`

---

### 🆕 4. 更新 `lib/types.ts`（添加过敏原类型）

> 完整类型定义见项目文件：`lib/types.ts`

---

### 🆕 5. 更新 `app/api/translate/route.ts`（集成过敏原检测）

> 新增集成片段见项目文件：`app/api/translate/route.ts`

---

### 🆕 6. 新增API: `app/api/allergens/check/route.ts`

> 完整实现见项目文件：`app/api/allergens/check/route.ts`

---

### 🆕 7. 新增组件: `components/AllergenBadge.tsx`

> 完整实现见项目文件：`components/AllergenBadge.tsx`

---

### 🆕 8. 更新数据库 Schema

> 新增 SQL 见项目文件：`supabase/schema.sql`

---

## 🆕 数据文件完整内容

### `data/chinese-ingredients.json`（补充）

> 完整 JSON 见项目文件：`data/chinese-ingredients.json`

---

## 🔄 工作流更新

### 添加新菜品时的过敏原检查

> 完整脚本见项目文件：`scripts/validate-allergens.ts`

---

## 🧪 测试用例

### 测试过敏原检测准确性

> 完整测试脚本见项目文件：`scripts/test-allergen-detection.ts`

---

## 📋 Checklist更新

### 🆕 过敏原数据完整性检查
- [ ] `allergens-fda.json` 包含所有9种FDA认定过敏原
- [ ] `ingredients-allergens-map.json` 覆盖100+常见中餐食材
- [ ] 每个菜品的过敏原自动检测 vs 手动标注一致
- [ ] 缺失映射的食材列表 < 5%

### 添加新菜品时
- [ ] 列出所有食材（中英文）
- [ ] 运行 `npm run validate:allergens`
- [ ] 检查warnings
- [ ] 手动验证未知食材
- [ ] 更新 `ingredients-allergens-map.json`（如需要）

---

## 💡 AI助手使用更新

### 给DeepSeek的新指令

#### 创建过敏原映射
```
任务: 为以下中餐食材创建过敏原映射

食材列表:
- 虾酱 (shrimp paste)
- 蚝油 (oyster sauce)
- XO酱 (XO sauce)

要求:
1. 参考 data/ingredients-allergens-map.json 的格式
2. 列出所有可能的过敏原
3. 标注置信度（high/medium/low）
4. 添加notes说明

输出JSON格式
```

#### 验证菜品过敏原
```
任务: 验证这道菜的过敏原标注是否完整

菜品: 干炒牛河
食材: beef, rice noodles, bean sprouts, soy sauce, scallions

当前标注: [soy]

请:
1. 使用 lib/allergens.ts 的 detectAllergens() 检测
2. 对比当前标注
3. 列出缺失或多余的过敏原
4. 给出修正建议
```

---

## 📊 数据统计（目标）

### 过敏原库覆盖率
- FDA主要过敏原: 9/9 ✅ 100%
- 中餐常用食材映射: 目标 150+
- 准确率: 目标 >95%
- 未知食材率: 目标 <5%

---

## 🔗 参考资源（新增）

### FDA官方文档
- [Food Allergen Labeling](https://www.fda.gov/food/food-allergensgluten-free-guidance-documents-regulatory-information/food-allergen-labeling-and-consumer-protection-act-2004-falcpa)
- [Major Food Allergens](https://www.fda.gov/food/food-labeling-nutrition/food-allergies)

### 数据来源
- FDA FALCPA List
- Common Chinese Restaurant Ingredients
- 中餐协会标准食材表

---

**最后更新**: 2024-12-XX  
**版本**: v1.1 - 添加过敏原检测系统  
**维护者**: [你的名字]
