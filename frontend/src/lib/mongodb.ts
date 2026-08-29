import { MongoClient } from 'mongodb'

const uri = process.env['MONGODB_URI']
if (!uri) throw new Error('MONGODB_URI is not set in .env')

// Reuse the client across hot-reloads in dev to avoid exhausting connections
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

let clientPromise: Promise<MongoClient>

if (process.env['NODE_ENV'] === 'development') {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  const client = new MongoClient(uri)
  clientPromise = client.connect()
}

export async function getDb() {
  const client = await clientPromise
  return client.db('renukaBilling')
}