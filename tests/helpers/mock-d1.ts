import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';

export function createTestD1Database() {
  const sqlite = new DatabaseSync(':memory:');

  // Load and apply initial drizzle migration
  const migrationPath = path.resolve(__dirname, '../../drizzle/0000_blue_joystick.sql');
  if (fs.existsSync(migrationPath)) {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    // SQLite can execute multiple statements separated by semicolon
    const statements = sql
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      sqlite.exec(stmt);
    }
  }

  function createPreparedStatement(query: string, boundValues: any[] = []): any {
    return {
      bind(...values: any[]) {
        return createPreparedStatement(query, values);
      },
      async all<T = unknown>() {
        const stmt = sqlite.prepare(query);
        const rows = stmt.all(...boundValues) as T[];
        return {
          results: rows,
          success: true,
          meta: { duration: 0, changes: 0, last_row_id: 0, served_by: 'mock-d1' }
        };
      },
      async run<T = unknown>() {
        const stmt = sqlite.prepare(query);
        const result = stmt.run(...boundValues);
        return {
          results: [],
          success: true,
          meta: {
            duration: 0,
            changes: Number(result.changes),
            last_row_id: Number(result.lastInsertRowid),
            served_by: 'mock-d1'
          }
        };
      },
      async raw<T = unknown>() {
        const stmt = sqlite.prepare(query);
        const rows = stmt.all(...boundValues);
        return rows.map(r => Object.values(r as object)) as T[];
      },
      async first<T = unknown>(colName?: string) {
        const stmt = sqlite.prepare(query);
        const rows = stmt.all(...boundValues);
        if (!rows.length) return null;
        if (colName) return (rows[0] as any)[colName] as T;
        return rows[0] as T;
      }
    };
  }

  const d1Mock = {
    prepare(query: string) {
      return createPreparedStatement(query);
    },
    async batch(statements: any[]) {
      const results = [];
      for (const stmt of statements) {
        results.push(await stmt.all());
      }
      return results;
    },
    async exec(query: string) {
      sqlite.exec(query);
      return { count: 1, duration: 0 };
    }
  };

  return { d1Mock, sqlite };
}
