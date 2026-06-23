import { ragRetrieval } from '../lib/rag-retrieval'
import { translationEngine } from '../lib/translation-engine'

interface TestCase {
  query: string
  expectedType: string
  description: string
}

async function testRAG() {
  console.log('🧪 Testing RAG System\n')
  console.log('='.repeat(60))

  const testCases: TestCase[] = [
    {
      query: '宫保鸡丁',
      expectedType: 'exact_match',
      description: 'Exact match - Chinese name'
    },
    {
      query: 'Kung Pao Chicken',
      expectedType: 'exact_match',
      description: 'Exact match - English name'
    },
    {
      query: 'gong bao ji ding',
      expectedType: 'exact_match',
      description: 'Exact match - Pinyin'
    },
    {
      query: '功保鸡丁',
      expectedType: 'fuzzy_match',
      description: 'Fuzzy match - Typo in Chinese'
    },
    {
      query: 'Kung Po Chicken',
      expectedType: 'fuzzy_match',
      description: 'Fuzzy match - Common misspelling'
    },
    {
      query: 'kungpao',
      expectedType: 'fuzzy_match',
      description: 'Fuzzy match - No spaces'
    },
    {
      query: 'spicy chicken with peanuts',
      expectedType: 'vector_match',
      description: 'Vector match - Semantic description'
    },
    {
      query: 'tofu in spicy sauce',
      expectedType: 'vector_match',
      description: 'Vector match - Mapo tofu description'
    },
    {
      query: '火星炒饭',
      expectedType: 'not_found',
      description: 'Not found - Non-existent dish'
    },
    {
      query: 'Martian Fried Rice',
      expectedType: 'not_found',
      description: 'Not found - Invented dish'
    }
  ]

  let passed = 0
  let failed = 0
  const results: Array<{
    query: string
    expected: string
    actual: string
    success: boolean
    time: number
  }> = []

  for (const testCase of testCases) {
    const startTime = Date.now()

    try {
      const result = await ragRetrieval.retrieve(testCase.query)
      const elapsed = Date.now() - startTime

      const success = result.type === testCase.expectedType ||
        (testCase.expectedType === 'not_found' && result.type === 'not_found')

      const icon = success ? '✅' : '❌'

      console.log(`\n${icon} ${testCase.description}`)
      console.log(`   Query: "${testCase.query}"`)
      console.log(`   Expected: ${testCase.expectedType}`)
      console.log(`   Got: ${result.type}`)
      console.log(`   Time: ${elapsed}ms`)

      if (result.dish) {
        console.log(`   Result: ${result.dish.name_en_standard} (${result.dish.name_cn})`)
        console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`)
      }

      if (result.similar_dishes && result.similar_dishes.length > 0) {
        console.log(`   Similar dishes:`)
        result.similar_dishes.slice(0, 2).forEach(s => {
          console.log(`     - ${s.dish.name_en_standard} (${(s.similarity * 100).toFixed(1)}%)`)
        })
      }

      results.push({
        query: testCase.query,
        expected: testCase.expectedType,
        actual: result.type,
        success,
        time: elapsed
      })

      if (success) passed++
      else failed++

    } catch (error) {
      console.error(`\n❌ ${testCase.description}`)
      console.error(`   Query: "${testCase.query}"`)
      console.error(`   Error: ${error}`)

      results.push({
        query: testCase.query,
        expected: testCase.expectedType,
        actual: 'error',
        success: false,
        time: 0
      })

      failed++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Test Results Summary\n')
  console.log(`  Total tests: ${testCases.length}`)
  console.log(`  Passed: ${passed} ✅`)
  console.log(`  Failed: ${failed} ❌`)
  console.log(`  Success rate: ${((passed / testCases.length) * 100).toFixed(1)}%`)

  const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length
  console.log(`  Average query time: ${avgTime.toFixed(0)}ms`)

  if (failed > 0) {
    console.log('\n⚠️  Failed tests:')
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - "${r.query}": expected ${r.expected}, got ${r.actual}`)
    })
  }

  console.log('\n' + '='.repeat(60))

  console.log('\n🔄 Testing Translation Engine...\n')

  const engineTests = ['宫保鸡丁', '创新菜品测试']

  for (const query of engineTests) {
    console.log(`\nQuery: "${query}"`)
    try {
      const result = await translationEngine.translate(query)
      console.log(`  Type: ${result.type}`)
      console.log(`  Source: ${result.source}`)
      console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`)
      console.log(`  Needs review: ${result.needs_review}`)
      console.log(`  Query time: ${result.query_time_ms}ms`)
      if (result.dish) {
        console.log(`  Result: ${result.dish.name_en_standard}`)
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error}`)
    }
  }

  console.log('\n🎉 Testing complete!\n')
}

testRAG().catch((error) => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})
