import path from 'path';
import fs from 'fs';
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

/**
 * Gets or initializes a bun:sqlite Database instance for a project.
 */
function getProjectDb(projectId: string) {
  const dbPath = getDatabasePath(projectId);
  // Ensure parent directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    // Dynamic import/require of bun:sqlite
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Database } = require('bun:sqlite');
    const db = new Database(dbPath, { create: true });
    db.run('PRAGMA journal_mode = WAL;');
    db.run('PRAGMA foreign_keys = ON;');
    return db;
  } catch (err: any) {
    throw new Error(`Failed to initialize SQLite database: ${err.message}`);
  }
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
      const stmt = db.query(sql);
      const rows = stmt.all(...params);
      db.close();
      return { success: true, rows };
    } else {
      const stmt = db.query(sql);
      const result = stmt.run(...params);
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
    const stmt = db.query(
      `SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;`
    );
    const tables: TableInfo[] = stmt.all() as TableInfo[];

    // Count rows for each table
    for (const table of tables) {
      try {
        const countStmt = db.query(`SELECT COUNT(*) as count FROM "${table.name}";`);
        const countRes = countStmt.get() as { count: number };
        table.rowCount = countRes ? countRes.count : 0;
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
    // Sanitize table name against injection
    const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    const db = getProjectDb(projectId);
    const stmt = db.query(`SELECT * FROM "${safeTable}" LIMIT ?;`);
    const rows = stmt.all(limit);
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
