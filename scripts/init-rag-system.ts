import { standardsDB } from '../lib/standards-db'
import { embeddingsManager } from '../lib/embeddings-manager'
import { ragRetrieval } from '../lib/rag-retrieval'

async function main() {
  console.log('🚀 Initializing RAG System...\n')

  console.log('📊 Step 1: Checking standards database...')
  const stats = standardsDB.getStats()

  console.log(`  ✓ Total dishes: ${stats.total}`)
  console.log(`  ✓ Verified: ${stats.verified}`)
  console.log(`  ✓ Categories:`, stats.by_category)
  console.log(`  ✓ Cuisines:`, stats.by_cuisine)
  console.log(`  ✓ Average confidence: ${stats.avg_confidence.toFixed(2)}\n`)

  if (stats.total === 0) {
    console.error('❌ No dishes found in database!')
    console.log('\nPlease add dishes to data/standards/verified-dishes.json')
    process.exit(1)
  }

  console.log('🔢 Step 2: Generating embeddings...')
  const allDishes = standardsDB.getAllVerified()

  console.log(`  Found ${allDishes.length} verified dishes`)
  console.log('  This may take a few minutes...\n')

  const embStats = embeddingsManager.getStats()

  if (embStats.total === 0) {
    console.log('  No existing embeddings found, generating new ones...')
    await embeddingsManager.generateBatch(allDishes)
  } else {
    console.log(`  ✓ Existing embeddings: ${embStats.total}`)
    console.log(`  ✓ Vector dimension: ${embStats.vector_dimension}`)
    console.log(`  ✓ Model: ${embStats.model}`)

    const missingEmbeddings = allDishes.filter(dish =>
      !embeddingsManager.getEmbedding(dish.id)
    )

    if (missingEmbeddings.length > 0) {
      console.log(`\n  Found ${missingEmbeddings.length} dishes without embeddings`)
      console.log('  Generating missing embeddings...\n')
      await embeddingsManager.generateBatch(missingEmbeddings)
    } else {
      console.log('\n  ✓ All dishes have embeddings')
    }
  }

  console.log('\n✅ Step 3: Verifying system...')
  const finalStats = embeddingsManager.getStats()
  console.log(`  ✓ Total embeddings: ${finalStats.total}`)
  console.log(`  ✓ Vector dimension: ${finalStats.vector_dimension}`)
  console.log(`  ✓ Model: ${finalStats.model}\n`)

  console.log('🧪 Step 4: Testing retrieval...')

  const testQueries = [
    '宫保鸡丁',
    'mapo tofu',
    '北京烤鸭',
    'kung pao',
    '功保鸡丁',
  ]

  for (const query of testQueries) {
    try {
      const result = await ragRetrieval.retrieve(query)
      console.log(`\n  Query: "${query}"`)
      console.log(`    Type: ${result.type}`)
      console.log(`    Result: ${result.dish?.name_en_standard || 'Not found'}`)
      console.log(`    Confidence: ${(result.confidence * 100).toFixed(1)}%`)

      if (result.similar_dishes && result.similar_dishes.length > 0) {
        console.log(`    Similar: ${result.similar_dishes[0].dish.name_en_standard}`)
      }
    } catch (error) {
      console.error(`    ❌ Error: ${error}`)
    }
  }

  console.log('\n🎉 RAG System initialized successfully!\n')
  console.log('Next steps:')
  console.log('  1. Run: npx tsx scripts/test-rag.ts')
  console.log('  2. Start the app: npm run dev')
  console.log('  3. Test API: POST http://localhost:3000/api/translate\n')
}

main().catch((error) => {
  console.error('❌ Initialization failed:', error)
  process.exit(1)
})
