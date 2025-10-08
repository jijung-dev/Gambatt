// gamedata/database.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { join } from "path";

const dbPath = join(process.cwd(), "gamedata", "gamedata.db");
export let db;

export async function initDatabase() {
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            balance INTEGER,
            collection TEXT,
            inventory TEXT
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS characters (
            value TEXT PRIMARY KEY,
            label TEXT,
            series TEXT,
            rarity TEXT,
            image TEXT,
            edition TEXT
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS data (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `);

    console.log("✅ Database initialized at", dbPath);
    console.log("   Tables: users, characters, data");
}
