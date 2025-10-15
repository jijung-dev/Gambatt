// gamedata/database.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { join } from "path";
import { existsSync } from "fs";

const dbPath = join(process.cwd(), "gamedata", "gamedata.db");
export let db;

export async function initDatabase() {
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
    });

    const isNewDB = !existsSync(dbPath);

    console.log(
        isNewDB
            ? "\n[DB] Creating new database..."
            : "\n[DB] Using existing database"
    );
    console.log("[DB] Path:", dbPath);
    console.log("[DB] Ready\n");
}
