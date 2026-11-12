import { apiHandler, notFound } from '../src/server/http/response.js'

// The API-only Vercel fallback must return JSON, never the Vite index page.
export default apiHandler(null, notFound)
