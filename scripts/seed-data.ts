import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import dishes from '../data/dishes-seed.json'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seedData() {
  console.log('Seeding database with initial dish data...')

  for (const dish of dishes) {
    const { error } = await supabase
      .from('dishes')
      .upsert(dish, { onConflict: 'id' })

    if (error) {
      console.error(`Failed to seed ${dish.name_en}:`, error.message)
    } else {
      console.log(`✅ Seeded: ${dish.name_en} (${dish.name_cn})`)
    }
  }

  console.log(`Seeding complete. ${dishes.length} dishes added.`)
}

seedData()
