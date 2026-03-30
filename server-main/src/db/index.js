import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";

sqlite3.verbose();

let db = null;

export function connectDb(dbFile) {
  return new Promise((resolve, reject) => {
    const resolved = path.resolve(dbFile);
    
    fs.mkdirSync(path.dirname(resolved), { recursive: true });

    const instance = new sqlite3.Database(resolved, (err) => {
      if (err) return reject(err);
      db = instance;
      resolve(db);
    });
  });
}

function getDb() {
  if (!db) throw new Error("DB not initialized. Call connectDb() first.");
  return db;
}

export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

export function dbAll(sql, params = [])
{
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}
export function dbExec(sql) {
  return new Promise((resolve, reject) => {
    getDb().exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}