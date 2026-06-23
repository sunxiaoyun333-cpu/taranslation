import { standardsDB } from '../lib/standards-db'
import { embeddingsManager } from '../lib/embeddings-manager'
import type { StandardDish } from '../lib/types'
import { v4 as uuidv4 } from 'uuid'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function addDish() {
  console.log('🍜 Add New Dish to Standards Database\n')
  console.log('='.repeat(60))

  try {
    const name_cn = await question('\n中文名称: ')
    const name_en = await question('英文名称 (标准): ')
    const pinyin = await question('拼音: ')

    console.log('\n选择分类:')
    console.log('1. Appetizer')
    console.log('2. Soup')
    console.log('3. Main Course')
    console.log('4. Noodles/Rice')
    console.log('5. Dessert')
    console.log('6. Beverage')
    const categoryChoice = await question('选择 (1-6): ')

    const categories = ['Appetizer', 'Soup', 'Main Course', 'Noodles/Rice', 'Dessert', 'Beverage']
    const category = categories[parseInt(categoryChoice) - 1] || 'Main Course'

    console.log('\n选择菜系:')
    console.log('1. Sichuan')
    console.log('2. Cantonese')
    console.log('3. Shanghai')
    console.log('4. Beijing')
    console.log('5. Hunan')
    console.log('6. Fujian')
    console.log('7. Fusion')
    console.log('8. Other')
    const cuisineChoice = await question('选择 (1-8): ')

    const cuisines = ['Sichuan', 'Cantonese', 'Shanghai', 'Beijing', 'Hunan', 'Fujian', 'Fusion', 'Other']
    const cuisine = cuisines[parseInt(cuisineChoice) - 1] || 'Other'

    console.log('\n食材 (用逗号分隔):')
    const ingredientsInput = await question('Ingredients: ')
    const ingredients = ingredientsInput.split(',').map(i => i.trim()).filter(Boolean)

    console.log('\n过敏原 (用逗号分隔，如: peanuts, soy):')
    const allergensInput = await question('Allergens: ')
    const allergens = allergensInput.split(',').map(a => a.trim()).filter(Boolean)

    const spiceLevelInput = await question('\n辣度 (0-5): ')
    const spice_level = Math.min(5, Math.max(0, parseInt(spiceLevelInput) || 0)) as 0 | 1 | 2 | 3 | 4 | 5

    const description_short = await question('\n简短描述 (15-25 words): ')
    const description_marketing = await question('营销描述 (30-50 words): ')

    const sourceInput = await question('\n来源 (用逗号分隔): ')
    const source = sourceInput.split(',').map(s => s.trim()).filter(Boolean)

    const dish: StandardDish = {
      id: uuidv4(),
      name_cn,
      name_en_standard: name_en,
      name_en_alternatives: [],
      pinyin,
      category: category as StandardDish['category'],
      cuisine: cuisine as StandardDish['cuisine'],
      ingredients_standard: ingredients,
      allergens_standard: allergens,
      spice_level,
      description_short,
      description_marketing,
      source: source.length > 0 ? source : ['Manual Entry'],
      confidence: 1.0,
      verified: true,
      verified_by: 'admin',
      verified_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('\n' + '='.repeat(60))
    console.log('\n📋 Preview:\n')
    console.log(JSON.stringify(dish, null, 2))

    const confirm = await question('\n确认添加? (y/n): ')

    if (confirm.toLowerCase() === 'y') {
      standardsDB.add(dish)
      standardsDB.save()
      console.log('\n✅ Dish added to database')

      console.log('\n🔢 Generating embedding...')
      await embeddingsManager.generateForDish(dish)
      embeddingsManager.save()
      console.log('✅ Embedding generated and saved')

      const stats = standardsDB.getStats()
      console.log('\n📊 Database stats:')
      console.log(`  Total dishes: ${stats.total}`)
      console.log(`  Verified: ${stats.verified}`)

      console.log('\n🎉 Success! Dish added to the system.\n')
    } else {
      console.log('\n❌ Cancelled\n')
    }

  } catch (error) {
    console.error('\n❌ Error:', error)
  } finally {
    rl.close()
  }
}

addDish()
