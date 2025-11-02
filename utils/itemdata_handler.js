import { db } from "#data";

export class Gear {
    constructor(
        id = "",
        label = "",
        tier = "",
        image = "",
        growth_rate = 0,
        mood_down_rate = 0,
        supa_rate = 0,
        stamina_cost_per_hour = 0
    ) {
        this.id = id;
        this.label = label;
        this.tier = tier;
        this.image = image;
        this.growth_rate = growth_rate;
        this.mood_down_rate = mood_down_rate;
        this.supa_rate = supa_rate;
        this.stamina_cost_per_hour = stamina_cost_per_hour;
    }
}

// -------------------- GEAR MANIPULATION --------------------

export async function addGear({
    id,
    label,
    tier,
    image,
    growth_rate,
    mood_down_rate,
    supa_rate,
    stamina_cost_per_hour,
}) {
    await db.run(
        `INSERT OR REPLACE INTO gears (id, label, tier, image, growth_rate, mood_down_rate, supa_rate, stamina_cost_per_hour)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        label,
        tier,
        image,
        growth_rate,
        mood_down_rate,
        supa_rate,
        stamina_cost_per_hour
    );
    console.log(`[DB] Added or updated gear: ${label}`);
    return new Gear(
        id,
        label,
        tier,
        image,
        growth_rate,
        mood_down_rate,
        supa_rate,
        stamina_cost_per_hour
    );
}

export async function editGear(id, updates = {}) {
    const fields = Object.keys(updates);
    if (fields.length === 0) {
        console.warn(`[DB] No fields provided to edit for ${id}`);
        return null;
    }

    const setClause = fields.map((f) => `${f} = ?`).join(", ");
    const params = [...fields.map((f) => updates[f]), id];
    const result = await db.run(
        `UPDATE gears SET ${setClause} WHERE id = ?`,
        ...params
    );

    if (result.changes > 0) {
        console.log(`[DB] Edited gear: ${id}`);

        const updatedRow = await db.get(
            `SELECT id, label, tier, image, growth_rate, mood_down_rate, supa_rate, stamina_cost_per_hour
			 FROM gears WHERE id = ?`,
            id
        );

        return new Gear(
            updatedRow.id,
            updatedRow.label,
            updatedRow.tier,
            updatedRow.image,
            updatedRow.growth_rate,
            updatedRow.mood_down_rate,
            updatedRow.supa_rate,
            updatedRow.stamina_cost_per_hour
        );
    } else {
        console.warn(`[DB] No gear found with id: ${value}`);
        return null;
    }
}

export async function removeGear(id) {
    // Delete from gears table
    const result = await db.run(`DELETE FROM gears WHERE id = ?`, id);

    if (result.changes > 0) {
        console.log(`[DB] Removed gear: ${id}`);

        // Remove from every user's inventory in user_items
        const deleteResult = await db.run(
            `DELETE FROM user_items 
			 WHERE item_id = ?`,
            id
        );

        console.log(
            `[DB] Removed gear '${id}' from ${deleteResult.changes} user(s) in user_items.`
        );
    } else {
        console.warn(`[DB] No gear found to remove: ${id}`);
    }
}

export async function hasGear(id) {
    const row = await db.get(`SELECT 1 FROM gears WHERE id = ?`, id);
    return !!row; // true if gear exists, false otherwise
}

// -------------------- GET GEAR --------------------

export async function getGear(id) {
    const row = await db.get(`SELECT * FROM gears WHERE id = ?`, id);
    if (!row) throw new Error(`Gear named: ${id} does not exist`);

    return new Gear(
        row.id,
        row.label,
        row.tier,
        row.image,
        row.growth_rate,
        row.mood_down_rate,
        row.supa_rate,
        row.stamina_cost_per_hour
    );
}

export async function getGears(
    id = null,
    label = null,
    tier = null,
    growth_rate = null,
    mood_down_rate = null,
    supa_rate = null,
    stamina_cost_per_hour = null
) {
    let query = `SELECT * FROM gears WHERE 1=1`;
    const params = [];

    if (id) {
        query += ` AND id LIKE ?`;
        params.push(id);
    }

    if (label) {
        query += ` AND LOWER(label) LIKE ?`;
        params.push(`%${label.toLowerCase()}%`);
    }

    for (const [col, val] of Object.entries({
        tier,
        growth_rate,
        mood_down_rate,
        supa_rate,
        stamina_cost_per_hour,
    })) {
        const { sql, params: p } = buildNumericFilter(col, val);
        query += sql;
        params.push(...p);
    }

    const rows = await db.all(query, ...params);
    return rows.map((r) => r.id);
}

// -------------------- FILTER GEARS --------------------

function buildNumericFilter(column, value) {
    if (!value) return { sql: "", params: [] };

    const conditions = String(value)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

    let sql = "";
    const params = [];

    for (const cond of conditions) {
        const match = cond.match(/^([<>]=?|=)?\s*(\d+(\.\d+)?)$/);
        if (match) {
            const op = match[1] || "=";
            const num = match[2];
            sql += ` AND ${column} ${op} ?`;
            params.push(num);
        } else {
            sql += ` AND ${column} = ?`;
            params.push(cond);
        }
    }

    return { sql, params };
}
