// scripts/test-allergen-detection.ts

import { detectAllergens } from '../lib/allergens'

const testCases = [
  {
    name: '宫保鸡丁',
    ingredients: ['chicken', 'peanuts', 'soy sauce', 'dried chili peppers'],
    expected: ['peanuts', 'soybeans', 'wheat']
  },
  {
    name: '麻婆豆腐',
    ingredients: ['tofu', 'ground pork', 'doubanjiang', 'soy sauce'],
    expected: ['soybeans', 'wheat']
  },
  {
    name: '清蒸鱼',
    ingredients: ['fish', 'ginger', 'scallions', 'soy sauce'],
    expected: ['fish', 'soybeans', 'wheat']
  }
]

for (const test of testCases) {
  const result = detectAllergens(test.ingredients)
  const detected = new Set(result.allergens.map(a => a.id))
  const expected = new Set(test.expected)
  
  const match = [...expected].every(e => detected.has(e))
  console.log(`${match ? '✅' : '❌'} ${test.name}`)
  
  if (!match) {
    console.log('  Expected:', test.expected)
    console.log('  Detected:', [...detected])
  }
}
