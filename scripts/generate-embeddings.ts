import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { createGeminiClient } from '../lib/gemini-client'
import dishes from '../data/dishes-seed.json'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const genAI = createGeminiClient()
const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })

async function generateEmbeddings() {
  console.log('Generating embeddings for all dishes...')

  for (const dish of dishes) {
    const content = `${dish.name_cn} ${dish.name_en} ${dish.description_short} ${dish.description_marketing} ${dish.ingredients.join(' ')}`

    try {
      const result = await model.embedContent(content)
      const embedding = result.embedding.values

      const { error } = await supabase
        .from('dishes')
        .update({ embedding })
        .eq('id', dish.id)

      if (error) {
        console.error(`Failed to update embedding for ${dish.name_en}:`, error.message)
      } else {
        console.log(`✅ Embedded: ${dish.name_en}`)
      }
    } catch (err) {
      console.error(`Error embedding ${dish.name_en}:`, err instanceof Error ? err.message : err)
    }
  }

  console.log('Embedding generation complete.')
}

generateEmbeddings()
