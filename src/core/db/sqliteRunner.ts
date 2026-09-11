import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { getProjectDir } from '../projects/projectManager';

export interface SqlQueryResult {
  success: boolean;
  rows?: any[];
  changes?: number;
  lastInsertRowid?: number | bigint;
  error?: string;
}

export interface TableInfo {
  name: string;
  sql: string;
  rowCount?: number;
}

export function getDatabasePath(projectId: string): string {
  const pDir = getProjectDir(projectId);
  return path.join(pDir, 'data.db');
}

interface DbAdapter {
  run(sql: string, params?: any[]): { changes: number; lastInsertRowid?: number | bigint };
  all(sql: string, params?: any[]): any[];
  close(): void;
}

/**
 * Universal SQLite database adapter:
 * Tries in order:
 * 1. bun:sqlite (when running under Bun)
 * 2. node:sqlite (when running under Node.js 22+)
 * 3. better-sqlite3 (when installed)
 * 4. python3 sqlite3 fallback (universal on all Linux environments)
 */
function getProjectDb(projectId: string): DbAdapter {
  const dbPath = getDatabasePath(projectId);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 1. Try bun:sqlite
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Database } = require('bun:sqlite');
    const db = new Database(dbPath, { create: true });
    db.run('PRAGMA journal_mode = WAL;');
    return {
      run: (sql, params = []) => {
        const stmt = db.query(sql);
        const res = stmt.run(...params);
        return { changes: res.changes, lastInsertRowid: res.lastInsertRowid };
      },
      all: (sql, params = []) => {
        const stmt = db.query(sql);
        return stmt.all(...params);
      },
      close: () => {
        try { db.close(); } catch {}
      }
    };
  } catch {}

  // 2. Try node:sqlite (Node 22.5+)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(dbPath);
    return {
      run: (sql, params = []) => {
        const stmt = db.prepare(sql);
        const res = stmt.run(...params);
        return { changes: Number(res.changes), lastInsertRowid: res.lastInsertRowid };
      },
      all: (sql, params = []) => {
        const stmt = db.prepare(sql);
        return stmt.all(...params);
      },
      close: () => {
        try { db.close(); } catch {}
      }
    };
  } catch {}

  // 3. Try better-sqlite3
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Database = require('better-sqlite3');
    const db = new Database(dbPath);
    return {
      run: (sql, params = []) => {
        const stmt = db.prepare(sql);
        const res = stmt.run(...params);
        return { changes: res.changes, lastInsertRowid: res.lastInsertRowid };
      },
      all: (sql, params = []) => {
        const stmt = db.prepare(sql);
        return stmt.all(...params);
      },
      close: () => {
        try { db.close(); } catch {}
      }
    };
  } catch {}

  // 4. Universal Python 3 SQLite Bridge (Guaranteed on Linux)
  return {
    run: (sql: string, params: any[] = []) => {
      const pyScript = `
import sqlite3, json, sys
conn = sqlite3.connect(sys.argv[1])
cursor = conn.cursor()
sql = sys.argv[2]
params = json.loads(sys.argv[3]) if len(sys.argv) > 3 else []
cursor.execute(sql, params)
conn.commit()
print(json.dumps({'changes': conn.total_changes, 'lastInsertRowid': cursor.lastrowid}))
`;
      const out = execSync(`python3 -c ${JSON.stringify(pyScript)} ${JSON.stringify(dbPath)} ${JSON.stringify(sql)} ${JSON.stringify(JSON.stringify(params))}`, {
        encoding: 'utf8'
      });
      return JSON.parse(out.trim());
    },
    all: (sql: string, params: any[] = []) => {
      const pyScript = `
import sqlite3, json, sys
conn = sqlite3.connect(sys.argv[1])
cursor = conn.cursor()
sql = sys.argv[2]
params = json.loads(sys.argv[3]) if len(sys.argv) > 3 else []
cursor.execute(sql, params)
cols = [d[0] for d in cursor.description] if cursor.description else []
rows = [dict(zip(cols, r)) for r in cursor.fetchall()]
print(json.dumps(rows))
`;
      const out = execSync(`python3 -c ${JSON.stringify(pyScript)} ${JSON.stringify(dbPath)} ${JSON.stringify(sql)} ${JSON.stringify(JSON.stringify(params))}`, {
        encoding: 'utf8'
      });
      return JSON.parse(out.trim());
    },
    close: () => {}
  };
}

/**
 * Executes one or more DDL statements (e.g. CREATE TABLE, ALTER TABLE, CREATE INDEX).
 */
export function executeDDL(projectId: string, sql: string): SqlQueryResult {
  try {
    const db = getProjectDb(projectId);
    db.run(sql);
    db.close();
    return { success: true, changes: 0 };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Executes a SQL query (SELECT, INSERT, UPDATE, DELETE) with optional parameter bindings.
 */
export function executeQuery(projectId: string, sql: string, params: any[] = []): SqlQueryResult {
  try {
    const db = getProjectDb(projectId);
    const trimmed = sql.trim().toUpperCase();

    if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('WITH')) {
      const rows = db.all(sql, params);
      db.close();
      return { success: true, rows };
    } else {
      const result = db.run(sql, params);
      db.close();
      return {
        success: true,
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid
      };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Inspects all non-internal tables and their schema definitions in the project database.
 */
export function getTables(projectId: string): TableInfo[] {
  try {
    const db = getProjectDb(projectId);
    const tables: TableInfo[] = db.all(
      `SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;`
    ) as TableInfo[];

    for (const table of tables) {
      try {
        const countRes = db.all(`SELECT COUNT(*) as count FROM "${table.name}";`) as Array<{ count: number }>;
        table.rowCount = countRes && countRes[0] ? countRes[0].count : 0;
      } catch {
        table.rowCount = 0;
      }
    }

    db.close();
    return tables;
  } catch {
    return [];
  }
}

/**
 * Fetches rows from a specific table for inspection over the API.
 */
export function getTableRows(projectId: string, tableName: string, limit = 50): any[] {
  try {
    const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    const db = getProjectDb(projectId);
    const rows = db.all(`SELECT * FROM "${safeTable}" LIMIT ?;`, [limit]);
    db.close();
    return rows;
  } catch {
    return [];
  }
}

/**
 * Resets / deletes the SQLite database for a fresh start.
 */
export function resetDatabase(projectId: string): boolean {
  const dbPath = getDatabasePath(projectId);
  const walPath = `${dbPath}-wal`;
  const shmPath = `${dbPath}-shm`;

  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

  return true;
}
