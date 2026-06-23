import { detectAllergens, generateAllergenStatement } from '../lib/allergens'

const testCases = [
  {
    dish: '麻婆豆腐',
    ingredients: ['tofu', 'ground pork', 'doubanjiang', 'Sichuan peppercorn', 'scallion', 'soy sauce', 'chili oil'],
  },
  {
    dish: '宫保鸡丁',
    ingredients: ['chicken breast', 'peanuts', 'dried chili', 'scallion', 'soy sauce', 'vinegar'],
  },
  {
    dish: '小笼包',
    ingredients: ['pork', 'flour', 'gelatin', 'ginger', 'soy sauce', 'sesame oil'],
  },
  {
    dish: '扬州炒饭',
    ingredients: ['rice', 'egg', 'shrimp', 'char siu pork', 'pea', 'carrot', 'scallion'],
  },
  {
    dish: '清炒西兰花',
    ingredients: ['broccoli', 'garlic', 'salt', 'vegetable oil'],
  },
]

function runTests() {
  console.log('=== Allergen Detection Tests ===\n')

  for (const test of testCases) {
    console.log(`📋 ${test.dish} (${test.ingredients.join(', ')})`)
    const result = detectAllergens(test.ingredients)

    if (result.allergens.length === 0) {
      console.log('  ✅ No allergens detected')
    } else {
      console.log(`  ⚠️  Found ${result.allergens.length} allergen(s):`)
      result.allergens.forEach((a) => {
        console.log(`    - ${a.name} (${a.severity}) from: ${a.sources_found.join(', ')}`)
      })
    }

    console.log(`  📝 Statement: ${generateAllergenStatement(result)}`)

    if (result.missing_checks.length > 0) {
      console.log(`  🔍 Unknown ingredients: ${result.missing_checks.join(', ')}`)
    }

    console.log(`  🟢 Safe for: ${result.safe_for.slice(0, 4).join(', ')}...`)
    console.log()
  }

  console.log('=== Test Complete ===')
}

runTests()
