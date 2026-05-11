const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const path = require('path')
const fs = require('fs')

let dbPath
if (process.env.VERCEL) {
  dbPath = '/tmp/db.json'
  if (!fs.existsSync(dbPath)) {
    fs.copyFileSync(path.join(__dirname, 'db.json'), dbPath)
  }
} else {
  dbPath = path.join(__dirname, 'db.json')
}

const adapter = new FileSync(dbPath)
const db = low(adapter)

db.defaults({ objectives: [] }).write()

module.exports = db
