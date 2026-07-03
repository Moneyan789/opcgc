import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'admin.db');

// ---- Compatibility wrapper: mimics better-sqlite3 API on top of sql.js ----

class StatementWrapper {
  #db;
  #sql;
  constructor(db, sql) {
    this.#db = db;
    this.#sql = sql;
  }

  run(...params) {
    const clean = params.map(p => p === undefined ? null : p);
    this.#db.run(this.#sql, clean);
    saveDb();
    return { changes: this.#db.getRowsModified() };
  }

  get(...params) {
    const stmt = this.#db.prepare(this.#sql);
    if (params.length > 0) stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return undefined;
  }

  all(...params) {
    const stmt = this.#db.prepare(this.#sql);
    if (params.length > 0) stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }
}

class TransactionWrapper {
  #db;
  constructor(db) {
    this.#db = db;
  }
  run(fn) {
    this.#db.run('BEGIN');
    try {
      fn();
      this.#db.run('COMMIT');
      saveDb();
    } catch (e) {
      this.#db.run('ROLLBACK');
      throw e;
    }
  }
}

class DbWrapper {
  #db;
  constructor(sqlDb) {
    this.#db = sqlDb;
  }

  prepare(sql) {
    return new StatementWrapper(this.#db, sql);
  }

  transaction(fn) {
    const tx = new TransactionWrapper(this.#db);
    return (...args) => tx.run(() => fn(...args));
  }

  pragma(str) {
    // no-op for sql.js compatibility
  }

  save() {
    const data = this.#db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

// ---- Database singleton ----

let db;

function saveDb() {
  if (db) {
    db.save();
  }
}

function initSchema(sqlDb) {
  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      desc TEXT NOT NULL DEFAULT '',
      link TEXT DEFAULT '',
      contact TEXT DEFAULT '',
      qrcode TEXT DEFAULT '',
      qrcode2 TEXT DEFAULT '',
      status TEXT DEFAULT '推广阶段',
      statusClass TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      title TEXT NOT NULL,
      desc TEXT NOT NULL,
      files TEXT DEFAULT '[]',
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS faq_qr (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      qr1 TEXT DEFAULT '',
      qr2 TEXT DEFAULT '',
      label1 TEXT DEFAULT '扫码进群',
      label2 TEXT DEFAULT '联系创始人'
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      tag TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      result TEXT NOT NULL DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Insert default FAQ row if not exists
  sqlDb.run('INSERT OR IGNORE INTO faq_qr (id) VALUES (1)');

  // Seed default admin password hash if not exists
  sqlDb.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('admin_password_hash', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')");
}

export async function initDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  let sqlDb;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(buffer);
  } else {
    sqlDb = new SQL.Database();
  }

  initSchema(sqlDb);
  saveDb();

  db = new DbWrapper(sqlDb);
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}
