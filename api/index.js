// api/index.js — plain JS, no TypeScript, no compilation needed
// Vercel runs this directly as a Node.js serverless function

const express = require('express')
const cors    = require('cors')
const jwt     = require('jsonwebtoken')

const app = express()
const JWT_SECRET = process.env.JWT_SECRET || 'sellbazar-super-secret-key-2025'

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173','http://localhost:5174','http://localhost:3000','https://sell-bazar.vercel.app']

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('CORS not allowed'))
  },
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
