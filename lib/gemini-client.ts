import { GoogleGenerativeAI } from '@google/generative-ai'
import { ProxyAgent, setGlobalDispatcher } from 'undici'

let proxyConfigured = false

function configureProxy() {
  if (proxyConfigured) return

  const allowLocalProxy = process.env.ALLOW_LOCAL_PROXY === 'true'
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
  if (!proxyUrl) {
    proxyConfigured = true
    return
  }

  // A dead localhost proxy can block all Gemini requests.
  // Default to direct network access unless the proxy is explicitly enabled.
  if (!allowLocalProxy && /^http:\/\/(127\.0\.0\.1|localhost):/i.test(proxyUrl)) {
    proxyConfigured = true
    return
  }

  setGlobalDispatcher(new ProxyAgent(proxyUrl))
  proxyConfigured = true
}

export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable. Set it in .env.local')
  }

  return apiKey
}

export function createGeminiClient(): GoogleGenerativeAI {
  configureProxy()
  return new GoogleGenerativeAI(getGeminiApiKey())
}
