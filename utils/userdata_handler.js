import { db } from "../gamedata/database.js";
import { filterCharacters, GetCharacter } from "./characterdata_handler.js";

// -------------------- CLASSES --------------------
class Player {
    constructor(balance = 0, collection = {}, inventory = {}) {
        this.balance = balance;
        this.collection = collection;
        this.inventory = inventory;
    }
}
class Channel {
    constructor({
        user_id,
        channel_name,
        profile_picture = null,
        banner_picture = null,
        mood = 0,
        color = "",
        character_id = null,
        sub_count = 0,
        growth_rate = 0,
        mood_down_rate = 0,
        supa_rate = 0,
        stamina_current = 0,
        stamina_max = 0,
        stamina_cost_per_hour = 0,
        gears = {},
    }) {
        this.user_id = user_id;
        this.channel_name = channel_name;
        this.profile_picture = profile_picture;
        this.banner_picture = banner_picture;
        this.mood = mood;
        this.color = color;
        this.character_id = character_id;
        this.sub_count = sub_count;
        this.growth_rate = growth_rate;
        this.mood_down_rate = mood_down_rate;
        this.supa_rate = supa_rate;
        this.stamina_current = stamina_current;
        this.stamina_max = stamina_max;
        this.stamina_cost_per_hour = stamina_cost_per_hour;

        // ensure gears is an object (DB returns a string for the JSON column)
        if (typeof gears === "string") {
            try {
                this.gears = JSON.parse(gears);
            } catch (e) {
                // fallback to empty object or default template if parsing fails
                this.gears = {
                    cpu: null,
                    gpu: null,
                    monitor: null,
                    mouse: null,
                    keyboard: null,
                };
            }
        } else if (gears === null || gears === undefined) {
            this.gears = {
                cpu: null,
                gpu: null,
                monitor: null,
                mouse: null,
                keyboard: null,
            };
        } else {
            this.gears = gears;
        }
    }
}

class Item {
    constructor(value = "", count = 0) {
        this.value = value;
        this.count = count;
    }
}

// -------------------- PLAYER DATA --------------------
export async function GetPlayerData(user) {
    if (user.bot) return null;

    const row = await db.get("SELECT * FROM users WHERE id = ?", user.id);
    if (!row) return await StartPlayer(user);

    // build collection from user_characters rows
    const rows = await db.all(
        `SELECT character_id, level, xp_now, xp_max FROM user_characters WHERE user_id = ?`,
        user.id
    );

    const collection = {};
    for (const r of rows) {
        collection[r.character_id] = {
            level: r.level,
            xp_now: r.xp_now,
            xp_max: r.xp_max,
        };
    }

    const inventory = JSON.parse(row.inventory || "{}");

    return new Player(row.balance, collection, inventory);
}

export async function StartPlayer(user) {
    if (user.bot) return null;

    const newPlayer = new Player();
    await db.run(
        "INSERT INTO users (id, balance, inventory) VALUES (?, ?, ?)",
        user.id,
        newPlayer.balance,
        JSON.stringify(newPlayer.inventory)
    );
    return newPlayer;
}

// -------------------- BALANCE --------------------
export async function ReduceBalance(user, amount) {
    const player = await GetPlayerData(user);
    if (!player) return null;

    player.balance -= amount;

    // update only balance and inventory (collection is in user_characters)
    await db.run(
        "UPDATE users SET balance = ?, inventory = ? WHERE id = ?",
        player.balance,
        JSON.stringify(player.inventory),
        user.id
    );

    return player.balance;
}

// -------------------- RARITY INFO --------------------
export function GetRarityValue(rarity) {
    switch (rarity.toLowerCase()) {
        case "ssr":
            return { addValue: 60, level: 3, xp_on_start: 90, xp_max: 200 };
        case "sr":
            return { addValue: 10, level: 2, xp_on_start: 20, xp_max: 100 };
        case "r":
            return { addValue: 5, level: 1, xp_on_start: 10, xp_max: 50 };
        default:
            return { addValue: 1, level: 1, xp_on_start: 1, xp_max: 1 };
    }
}
export function GetCharacterStat(character, level) {
    switch (character.rarity) {
        case "ssr":
            return {
                growth_rate: 3 * level,
                mood_down_rate: 3 * level,
                supa_rate: 3 * level,
                stamina_max: 100,
                stamina_cost_per_hour: 1,
            };
        case "sr":
            return {
                growth_rate: 3 * level,
                mood_down_rate: 3 * level,
                supa_rate: 3 * level,
                stamina_max: 100,
                stamina_cost_per_hour: 1,
            };
        case "r":
            return {
                growth_rate: 3 * level,
                mood_down_rate: 3 * level,
                supa_rate: 3 * level,
                stamina_max: 100,
                stamina_cost_per_hour: 1,
            };
        default:
            return {
                growth_rate: 3 * level,
                mood_down_rate: 3 * level,
                supa_rate: 3 * level,
                stamina_max: 100,
                stamina_cost_per_hour: 1,
            };
    }
}
export function GetCharacterMood(mood) {
    switch (mood) {
        case -2:
            return "Awful";
        case -1:
            return "Bad";
        case 0:
            return "Normal";
        case 1:
            return "Good";
        case 2:
            return "Great";
        default:
            return "Normal";
    }
}

// -------------------- COLLECTION --------------------
export async function AddCharacterToCollection(user, characterValue, rarity) {
    if (user.bot) return null;

    // Ensure player exists (creates user row if not present)
    const player = await GetPlayerData(user);
    if (!player) return null;

    const rarityValue = GetRarityValue(rarity);

    // fetch existing character row
    let charRow = await db.get(
        `SELECT level, xp_now, xp_max FROM user_characters WHERE user_id = ? AND character_id = ?`,
        user.id,
        characterValue
    );

    let isFirstTime = false;
    let isLevelUp = false;
    let character;

    if (!charRow) {
        // insert new character row
        isFirstTime = true;
        const level = rarityValue.level;
        const xp_now = rarityValue.xp_on_start;
        const xp_max = rarityValue.xp_max;

        await db.run(
            `INSERT INTO user_characters (user_id, character_id, level, xp_now, xp_max)
             VALUES (?, ?, ?, ?, ?)`,
            user.id,
            characterValue,
            level,
            xp_now,
            xp_max
        );

        character = { level, xp_now, xp_max };
    } else {
        // update existing row
        let level = charRow.level;
        let xp_now = charRow.xp_now + rarityValue.addValue;
        let xp_max = charRow.xp_max;

        if (xp_now >= xp_max) {
            isLevelUp = true;
            level++;
            xp_now -= xp_max;
            xp_max += rarity.toLowerCase() === "r" && level === 2 ? 50 : 100;
        }

        await db.run(
            `UPDATE user_characters SET level = ?, xp_now = ?, xp_max = ?
             WHERE user_id = ? AND character_id = ?`,
            level,
            xp_now,
            xp_max,
            user.id,
            characterValue
        );

        character = { level, xp_now, xp_max };
    }

    // Keep behavior: update user's balance & inventory in users table (collection is normalized now)
    await db.run(
        "UPDATE users SET balance = ?, inventory = ? WHERE id = ?",
        player.balance,
        JSON.stringify(player.inventory),
        user.id
    );

    return { isFirstTime, isLevelUp, character };
}

export async function AddCharactersToCollection(user, characters) {
    if (user.bot) return null;

    const player = await GetPlayerData(user);
    if (!player) return null;

    const results = [];

    for (const { value, rarity } of characters) {
        const rarityValue = GetRarityValue(rarity);

        let isFirstTime = false;
        let isLevelUp = false;
        let character;

        const charRow = await db.get(
            `SELECT level, xp_now, xp_max FROM user_characters WHERE user_id = ? AND character_id = ?`,
            user.id,
            value
        );

        if (!charRow) {
            isFirstTime = true;
            const level = rarityValue.level;
            const xp_now = rarityValue.xp_on_start;
            const xp_max = rarityValue.xp_max;

            await db.run(
                `INSERT INTO user_characters (user_id, character_id, level, xp_now, xp_max)
                 VALUES (?, ?, ?, ?, ?)`,
                user.id,
                value,
                level,
                xp_now,
                xp_max
            );

            character = { level, xp_now, xp_max };
        } else {
            let level = charRow.level;
            let xp_now = charRow.xp_now + rarityValue.addValue;
            let xp_max = charRow.xp_max;

            if (xp_now >= xp_max) {
                isLevelUp = true;
                level++;
                xp_now -= xp_max;
                xp_max +=
                    rarity.toLowerCase() === "r" && level === 2 ? 50 : 100;
            }

            await db.run(
                `UPDATE user_characters SET level = ?, xp_now = ?, xp_max = ?
                 WHERE user_id = ? AND character_id = ?`,
                level,
                xp_now,
                xp_max,
                user.id,
                value
            );

            character = { level, xp_now, xp_max };
        }

        results.push({ isFirstTime, isLevelUp, character, rarity });
    }

    // update users balance & inventory JSON (collection now in user_characters)
    await db.run(
        "UPDATE users SET balance = ?, inventory = ? WHERE id = ?",
        player.balance,
        JSON.stringify(player.inventory),
        user.id
    );

    return results;
}

// -------------------- COLLECTION QUERIES --------------------
export async function GetCharacterFromCollection(user, characterValue) {
    if (user.bot) return null;

    const row = await db.get(
        `SELECT level, xp_now, xp_max FROM user_characters WHERE user_id = ? AND character_id = ?`,
        user.id,
        characterValue
    );

    if (!row) return { level: -1 };

    return {
        level: row.level,
        xp_now: row.xp_now,
        xp_max: row.xp_max,
    };
}

export async function GetCharactersFromCollection(
    user,
    charName,
    edition = null,
    series = null,
    rarity = null
) {
    if (user.bot) return [];

    // get all character ids the user owns
    const rows = await db.all(
        `SELECT character_id FROM user_characters WHERE user_id = ?`,
        user.id
    );
    const keys = rows.map((r) => r.character_id);

    // reuse filterCharacters; it expects a getEntry async function returning Character-like object
    return filterCharacters(
        (key) => GetCharacter(key),
        keys,
        charName,
        edition,
        series,
        rarity
    );
}

// -------------------- CHANNEL --------------------
export async function GetChannels(user) {
    if (user.bot) return [];
    const rows = await db.all(
        `SELECT * FROM channels WHERE user_id = ?`,
        user.id
    );
    return rows.map((row) => new Channel(row));
}

export async function GetChannel(user, namePart) {
    if (user.bot) return null;
    const rows = await db.all(
        `SELECT * FROM channels WHERE user_id = ? AND LOWER(channel_name) LIKE LOWER(?)`,
        user.id,
        `%${namePart}%`
    );
    return rows.map((row) => new Channel(row));
}

export async function CreateChannel(user, channel) {
    if (user.bot) return null;

    await GetPlayerData(user); // Ensure player exists

    // ensure gears exists as an object
    const gearsObj = channel.gears || {
        cpu: null,
        gpu: null,
        monitor: null,
        mouse: null,
        keyboard: null,
    };

    await db.run(
        `INSERT INTO channels (
            user_id,
            channel_name,
            profile_picture,
            banner_picture,
            mood,
            color,
            character_id,
            sub_count,
            growth_rate,
            mood_down_rate,
            supa_rate,
            stamina_current,
            stamina_max,
            stamina_cost_per_hour,
            gears
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        user.id,
        channel.channel_name,
        channel.profile_picture,
        channel.banner_picture,
        channel.mood,
        channel.color,
        channel.character_id,
        channel.sub_count,
        channel.growth_rate,
        channel.mood_down_rate,
        channel.supa_rate,
        channel.stamina_current,
        channel.stamina_max,
        channel.stamina_cost_per_hour,
        JSON.stringify(gearsObj)
    );
}

export async function UpdateChannel(user, namePart, data) {
    if (user.bot) return null;

    const matches = await GetChannel(user, namePart);
    if (matches.length === 0) return null;
    if (matches.length > 1) return matches;

    const channel = matches[0];

    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
        if (key === "gears") {
            fields.push(`${key} = ?`);
            values.push(JSON.stringify(value));
        } else {
            fields.push(`${key} = ?`);
            values.push(value);
        }
    }

    // Save old and new names so we can re-fetch even if renamed
    const oldName = channel.channel_name;
    const newName = data.channel_name ?? oldName;

    values.push(user.id, oldName);

    const result = await db.run(
        `UPDATE channels SET ${fields.join(
            ", "
        )} WHERE user_id = ? AND channel_name = ?`,
        ...values
    );

    const updatedRow = await db.get(
        `SELECT * FROM channels WHERE user_id = ? AND channel_name = ?`,
        user.id,
        newName
    );

    return updatedRow ? new Channel(updatedRow) : null;
}

export async function DeleteChannel(
    user,
    namePart,
    { checkOnly = false } = {}
) {
    if (user.bot) return null;

    const matches = await GetChannel(user, namePart);
    if (matches.length === 0) return null;

    if (checkOnly) {
        return matches;
    }

    if (matches.length > 1) return matches;

    const channel = matches[0];

    await db.run(
        `DELETE FROM channels WHERE user_id = ? AND channel_name = ?`,
        user.id,
        channel.channel_name
    );

    return channel;
}

export { Player, Item, Channel };
