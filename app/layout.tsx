import type { Metadata } from 'next'
import { BrandLogo } from '@/components/BrandLogo'
import { LanguageProvider } from '@/components/LanguageProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'DishLingo - Professional Chinese Menu Translation & FDA Compliance',
  description: 'DishLingo helps restaurants turn Chinese dish names into polished English menu copy with allergen compliance support.',
  keywords: ['DishLingo', 'menu translation', 'Chinese food', 'FDA allergens', 'restaurant menu', 'Chinese cuisine'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <a href="#" className="flex h-10 items-center" aria-label="DishLingo home">
              <BrandLogo compact className="h-10" />
            </a>
            <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 sm:flex">
              <a href="#" className="transition-colors hover:text-primary-500">Home</a>
              <a href="#features" className="transition-colors hover:text-primary-500">Features</a>
              <a href="#how-it-works" className="transition-colors hover:text-primary-500">Workflow</a>
              <a href="#faq" className="transition-colors hover:text-primary-500">FAQ</a>
            </nav>
          </div>
        </header>
        <LanguageProvider>
          <main>{children}</main>
        </LanguageProvider>
        <footer className="border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 text-sm text-gray-500 sm:flex-row">
              <div className="flex h-8 items-center">
                <BrandLogo compact className="h-8" />
              </div>
              <p>Powered by Google Gemini AI and structured allergen data.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
