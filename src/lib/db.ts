import Database from "better-sqlite3";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export interface DB {
  exec(sql: string): Promise<void>;
  prepare(sql: string): {
    run(...args: any[]): Promise<any>;
    get(...args: any[]): Promise<any>;
    all(...args: any[]): Promise<any[]>;
  };
  close(): void;
}

class SQLiteDB implements DB {
  private db: any;
  constructor(filename: string) {
    this.db = new Database(filename);
  }
  async exec(sql: string) {
    this.db.exec(sql);
  }
  prepare(sql: string) {
    const stmt = this.db.prepare(sql);
    return {
      run: async (...args: any[]) => {
        const result = stmt.run(...args);
        return { lastInsertRowid: result.lastInsertRowid, changes: result.changes };
      },
      get: async (...args: any[]) => stmt.get(...args),
      all: async (...args: any[]) => stmt.all(...args),
    };
  }
  close() {
    this.db.close();
  }
}

class PostgresDB implements DB {
  private pool: pg.Pool;
  constructor(connectionString: string) {
    const isNeon = connectionString.includes("neon.tech");
    this.pool = new Pool({
      connectionString,
      ssl: (isNeon || connectionString.includes("sslmode=require")) ? { rejectUnauthorized: false } : false,
    });
  }
  async exec(sql: string) {
    try {
      // PostgreSQL uses SERIAL instead of AUTOINCREMENT
      // We'll do some basic translation for the schema init
      const pgSql = sql
        .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, "SERIAL PRIMARY KEY")
        .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/g, "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        .replace(/REAL/g, "DECIMAL");
      
      await this.pool.query(pgSql);
    } catch (err: any) {
      if (err.message.includes("password authentication failed")) {
        console.error("❌ Database Authentication Failed: Please check your DATABASE_URL in the Settings menu.");
      }
      throw err;
    }
  }
  prepare(sql: string) {
    return {
      run: async (...args: any[]) => {
        let i = 1;
        const pgSql = sql.replace(/\?/g, () => `$${i++}`);
        const res = await this.pool.query(pgSql, args);
        // Mock lastInsertRowid for compatibility
        return { lastInsertRowid: res.rows[0]?.id || null, changes: res.rowCount };
      },
      get: async (...args: any[]) => {
        let i = 1;
        const pgSql = sql.replace(/\?/g, () => `$${i++}`);
        const res = await this.pool.query(pgSql, args);
        return res.rows[0];
      },
      all: async (...args: any[]) => {
        let i = 1;
        const pgSql = sql.replace(/\?/g, () => `$${i++}`);
        const res = await this.pool.query(pgSql, args);
        return res.rows;
      },
    };
  }
  close() {
    this.pool.end();
  }
}

const databaseUrl = process.env.DATABASE_URL;
let db: DB;

if (databaseUrl && (databaseUrl.startsWith("postgres") || databaseUrl.startsWith("postgresql"))) {
  console.log("🐘 Using PostgreSQL (Neon)");
  db = new PostgresDB(databaseUrl);
} else {
  console.log("💾 Using SQLite (Local)");
  db = new SQLiteDB("tokyo_express.db");
}

export default db;
