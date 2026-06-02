// api/index.ts
// Vercel serverless entry point — imports and re-exports the Express app
// Vercel detects `export default app` and wraps it as a serverless handler

import app from '../server/src/index'
export default app
