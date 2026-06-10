const low = require('lowdb')
const Memory = require('lowdb/adapters/Memory')
const FileSync = require('lowdb/adapters/FileSync')
const path = require('path')
const initialData = require('./db.json')

const useRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL)

let adapter
if (useRedis) {
  adapter = new Memory()
} else if (process.env.VERCEL) {
  const fs = require('fs')
  const tmpPath = '/tmp/db.json'
  if (!fs.existsSync(tmpPath)) fs.copyFileSync(path.join(__dirname, 'db.json'), tmpPath)
  adapter = new FileSync(tmpPath)
} else {
  adapter = new FileSync(path.join(__dirname, 'db.json'))
}

const db = low(adapter)

if (useRedis) {
  db.defaults(initialData).write()
}
db.defaults({ objectives: [] }).write()

// ── Upstash Redis persistence ─────────────────────────────────────────────────
let redis = null

async function initRedis() {
  if (!useRedis) return
  try {
    const { Redis } = require('@upstash/redis')
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    const saved = await redis.get('riad_db')
    if (saved) {
      db.setState(typeof saved === 'string' ? JSON.parse(saved) : saved)
      console.log('DB loaded from Redis')
    } else {
      await redis.set('riad_db', JSON.stringify(db.getState()))
      console.log('DB seeded to Redis')
    }
  } catch (e) {
    console.error('Redis init error:', e.message)
  }
}

async function persistToRedis() {
  if (!redis) return
  try {
    await redis.set('riad_db', JSON.stringify(db.getState()))
  } catch (e) {
    console.error('Redis persist error:', e.message)
  }
}

module.exports = db
module.exports.initRedis = initRedis
module.exports.persistToRedis = persistToRedis
