import { db } from "#data";

class Character {
    constructor(
        value = "",
        label = "",
        series = "",
        rarity = "",
        image = "",
        edition = ""
    ) {
        this.value = value;
        this.label = label;
        this.series = series;
        this.rarity = rarity;
        this.image = image;
        this.edition = edition;
    }
}

class Banner {
    constructor(current_characters = []) {
        this.current_characters = current_characters;
    }
}

// -------------------- CHARACTER MANIPULATION --------------------
export async function addCharacter({
    value,
    label,
    series,
    rarity,
    image,
    edition,
}) {
    await db.run(
        `INSERT OR REPLACE INTO characters (value, label, series, rarity, image, edition)
         VALUES (?, ?, ?, ?, ?, ?)`,
        value,
        label,
        series,
        rarity,
        image,
        edition
    );
    console.log(`[DB] Added or updated character: ${label}`);
    return new Character(value, label, series, rarity, image, edition);
}

export async function editCharacter(value, updates = {}) {
    const fields = Object.keys(updates);
    if (fields.length === 0) {
        console.warn(`[DB] No fields provided to edit for ${value}`);
        return null;
    }

    const setClause = fields.map((f) => `${f} = ?`).join(", ");
    const params = [...fields.map((f) => updates[f]), value];
    const result = await db.run(
        `UPDATE characters SET ${setClause} WHERE value = ?`,
        ...params
    );

    if (result.changes > 0) {
        console.log(`[DB] Edited character: ${value}`);

        const updatedRow = await db.get(
            `SELECT value, label, series, rarity, image, edition
             FROM characters WHERE value = ?`,
            value
        );

        return new Character(
            updatedRow.value,
            updatedRow.label,
            updatedRow.series,
            updatedRow.rarity,
            updatedRow.image,
            updatedRow.edition
        );
    } else {
        console.warn(`[DB] No character found with value: ${value}`);
        return null;
    }
}

export async function removeCharacter(value) {
    // Delete from characters table
    const result = await db.run(
        `DELETE FROM characters WHERE value = ?`,
        value
    );

    if (result.changes > 0) {
        console.log(`[DB] Removed character: ${value}`);

        // Remove from every user's collection in user_characters
        const deleteResult = await db.run(
            `DELETE FROM user_characters 
             WHERE character_id = ?`,
            value
        );

        console.log(
            `[DB] Removed character '${value}' from ${deleteResult.changes} user(s) in user_characters.`
        );
    } else {
        console.warn(`[DB] No character found to remove: ${value}`);
    }
}

export async function hasCharacter(characterValue) {
    const row = await db.get(
        `SELECT 1 FROM characters WHERE value = ?`,
        characterValue
    );
    return !!row; // true if character exists, false otherwise
}

// -------------------- GET CHARACTER --------------------
export async function getCharacter(characterValue) {
    const row = await db.get(
        `SELECT * FROM characters WHERE value = ?`,
        characterValue
    );
    if (!row)
        throw new Error(`Character named: ${characterValue} does not exist`);

    return new Character(
        row.value,
        row.label,
        row.series,
        row.rarity,
        row.image,
        row.edition
    );
}

// -------------------- GET MULTIPLE CHARACTERS --------------------
export async function getCharacters(
    charvalue = null,
    charName = null,
    edition = null,
    series = null,
    rarity = null
) {
    let query = `SELECT * FROM characters WHERE 1=1`;
    const params = [];

    if (charvalue) {
        query += ` AND value LIKE ?`;
        params.push(charvalue);
    }
    if (charName) {
        query += ` AND LOWER(label) LIKE ?`;
        params.push(`%${charName.toLowerCase()}%`);
    }
    if (edition) {
        query += ` AND LOWER(edition) = ?`;
        params.push(edition.toLowerCase());
    }
    if (series) {
        query += ` AND LOWER(series) LIKE ?`;
        params.push(`%${series.toLowerCase()}%`);
    }
    if (rarity) {
        query += ` AND LOWER(rarity) = ?`;
        params.push(rarity.toLowerCase());
    }

    const rows = await db.all(query, ...params);
    return rows.map((r) => r.value);
}

// -------------------- FILTER CHARACTERS --------------------
export async function filterCharacters(
    getEntry,
    keys,
    value,
    charName,
    edition,
    series,
    rarity
) {
    const nameLower = charName?.toLowerCase() || null;
    const editionLower = edition?.toLowerCase() || null;
    const seriesLower = series?.toLowerCase() || null;
    const rarityLower = rarity?.toLowerCase() || null;

    const results = [];
    for (const key of keys) {
        const entry = await getEntry(key);
        if (
            matchCharacter(
                entry,
                value,
                nameLower,
                editionLower,
                seriesLower,
                rarityLower
            )
        ) {
            results.push(key);
        }
    }
    return results;
}

function matchCharacter(
    entry,
    value,
    nameLower,
    editionLower,
    seriesLower,
    rarityLower
) {
    if (nameLower && !entry.label.toLowerCase().includes(nameLower))
        return false;
    if (value && entry.value !== value) return false;
    if (editionLower && entry.edition.toLowerCase() !== editionLower)
        return false;
    if (seriesLower && !entry.series.toLowerCase().includes(seriesLower))
        return false;
    if (rarityLower && entry.rarity.toLowerCase() !== rarityLower) return false;
    return true;
}

// -------------------- BANNER FUNCTIONS --------------------
export async function getBanner() {
    const row = await db.get(`SELECT value FROM data WHERE key = 'banner'`);
    if (!row) throw new Error("No banner found");

    const parsed = JSON.parse(row.value);
    return new Banner(parsed.current_characters || []);
}

export async function setBanner(characters) {
    const value = JSON.stringify({ current_characters: characters });
    await db.run(
        `INSERT OR REPLACE INTO data (key, value) VALUES ('banner', ?)`,
        value
    );
    console.log(`[DB] Banner updated with ${characters.length} characters`);
}

export { Character, Banner };
