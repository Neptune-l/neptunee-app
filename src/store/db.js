import { openDB } from 'idb'
import { STORE_NAMES } from '../utils/constants'

const DB_NAME = 'neptune-self-discipline'
const DB_VERSION = 2

let dbPromise = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // DB v1 had a bug: 'global' store was created with keyPath 'id' instead of 'key'
        if (oldVersion < 2) {
          if (db.objectStoreNames.contains('global')) {
            db.deleteObjectStore('global')
          }
        }
        for (const storeName of Object.values(STORE_NAMES)) {
          if (storeName === 'global') continue
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' })
          }
        }
        if (!db.objectStoreNames.contains('global')) {
          db.createObjectStore('global', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

export async function getAll(storeName) {
  const db = await getDb()
  return db.getAll(storeName)
}

export async function get(storeName, id) {
  const db = await getDb()
  return db.get(storeName, id)
}

export async function put(storeName, value) {
  const db = await getDb()
  return db.put(storeName, value)
}

export async function del(storeName, id) {
  const db = await getDb()
  return db.delete(storeName, id)
}

export async function clear(storeName) {
  const db = await getDb()
  return db.clear(storeName)
}

export async function getGlobal(key) {
  const db = await getDb()
  const record = await db.get('global', key)
  return record ? record.value : null
}

export async function setGlobal(key, value) {
  const db = await getDb()
  return db.put('global', { key, value })
}

export async function deleteKey(key) {
  const db = await getDb()
  return db.delete('global', key)
}

export async function exportAllData() {
  const result = {}
  for (const storeName of Object.values(STORE_NAMES)) {
    result[storeName] = await getAll(storeName)
  }
  const db = await getDb()
  result.global = await db.getAll('global')
  return result
}

export async function importAllData(data) {
  const db = await getDb()
  const tx = db.transaction(Object.values(STORE_NAMES).concat('global'), 'readwrite')
  for (const storeName of Object.values(STORE_NAMES).concat('global')) {
    const store = tx.objectStore(storeName)
    store.clear()
    const items = data[storeName]
    if (items && Array.isArray(items)) {
      for (const item of items) {
        store.put(item)
      }
    }
  }
  await tx.done
}

export async function clearAllData() {
  const db = await getDb()
  const tx = db.transaction(Object.values(STORE_NAMES).concat('global'), 'readwrite')
  for (const storeName of Object.values(STORE_NAMES).concat('global')) {
    tx.objectStore(storeName).clear()
  }
  await tx.done
}
