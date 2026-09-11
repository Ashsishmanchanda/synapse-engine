import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { executeDDL, executeQuery, getTables, getTableRows, resetDatabase } from './sqliteRunner';
import { createProject, deleteProject } from '../projects/projectManager';

describe('Native SQLite Engine Runner', () => {
  const testProjectId = 'test-sqlite-project';

  beforeEach(() => {
    createProject(testProjectId, 'SQLite Test Project');
    resetDatabase(testProjectId);
  });

  afterEach(() => {
    resetDatabase(testProjectId);
    deleteProject(testProjectId);
  });

  it('executes DDL statements to create tables', () => {
    const ddlResult = executeDDL(
      testProjectId,
      `CREATE TABLE IF NOT EXISTS slides (
        id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL,
        timestamp_sec INTEGER NOT NULL,
        title TEXT,
        ocr_text TEXT
      );`
    );

    expect(ddlResult.success).toBe(true);

    const tables = getTables(testProjectId);
    expect(tables.some(t => t.name === 'slides')).toBe(true);
  });

  it('executes parameterized INSERT and SELECT queries', () => {
    executeDDL(
      testProjectId,
      `CREATE TABLE transcript (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_sec REAL,
        text TEXT
      );`
    );

    const insertRes = executeQuery(
      testProjectId,
      `INSERT INTO transcript (start_sec, text) VALUES (?, ?)`,
      [12.5, 'Welcome to the lecture']
    );

    expect(insertRes.success).toBe(true);
    expect(insertRes.changes).toBe(1);

    const selectRes = executeQuery(
      testProjectId,
      `SELECT * FROM transcript WHERE start_sec = ?`,
      [12.5]
    );

    expect(selectRes.success).toBe(true);
    expect(selectRes.rows?.length).toBe(1);
    expect(selectRes.rows?.[0].text).toBe('Welcome to the lecture');
  });

  it('inspects table rows via getTableRows helper', () => {
    executeDDL(
      testProjectId,
      `CREATE TABLE topics (id TEXT PRIMARY KEY, title TEXT);`
    );

    executeQuery(testProjectId, `INSERT INTO topics VALUES (?, ?)`, ['top-1', 'Calculus Intro']);
    executeQuery(testProjectId, `INSERT INTO topics VALUES (?, ?)`, ['top-2', 'Derivatives']);

    const rows = getTableRows(testProjectId, 'topics', 10);
    expect(rows.length).toBe(2);
    expect(rows[0].title).toBe('Calculus Intro');
  });
});
