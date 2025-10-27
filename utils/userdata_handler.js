import { db } from "#data";
import {
    filterCharacters,
    getCharacter,
} from "#utils/characterdata_handler.js";

// -------------------- CLASSES --------------------
class Player {
    constructor(balance = 0) {
        this.balance = balance;
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

        if (typeof gears === "string") {
            try {
                this.gears = JSON.parse(gears);
            } catch {
                this.gears = {
                    cpu: null,
                    gpu: null,
                    monitor: null,
                    mouse: null,
                    keyboard: null,
                };
            }
        } else if (!gears) {
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
export async function getPlayerData(user) {
    if (user.bot) return null;

    const row = await db.get("SELECT * FROM users WHERE id = ?", user.id);
    if (!row) return await StartPlayer(user);

    return new Player(row.balance);
}

export async function StartPlayer(user) {
    if (user.bot) return null;

    const newPlayer = new Player();
    await db.run(
        "INSERT INTO users (id, balance) VALUES (?, ?)",
        user.id,
        newPlayer.balance
    );
    return newPlayer;
}

// -------------------- BALANCE --------------------
export async function reduceBalance(user, amount) {
    const player = await getPlayerData(user);
    if (!player) return null;

    player.balance -= amount;
    await db.run(
        "UPDATE users SET balance = ? WHERE id = ?",
        player.balance,
        user.id
    );

    return player.balance;
}

// -------------------- RARITY INFO --------------------
export function getRarityValue(rarity) {
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
    return {
        growth_rate: 3 * level,
        mood_down_rate: 3 * level,
        supa_rate: 3 * level,
        stamina_max: 100,
        stamina_cost_per_hour: 1,
    };
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
export async function addCharacterToCollection(user, characterValue, rarity) {
    if (user.bot) return null;

    const rarityValue = getRarityValue(rarity);

    const charRow = await db.get(
        `SELECT level, xp_now, xp_max FROM user_characters WHERE user_id = ? AND character_id = ?`,
        user.id,
        characterValue
    );

    let isFirstTime = false;
    let isLevelUp = false;
    let character;

    if (!charRow) {
        isFirstTime = true;
        const { level, xp_on_start: xp_now, xp_max } = rarityValue;
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
        let { level, xp_now, xp_max } = charRow;
        xp_now += rarityValue.addValue;
        if (xp_now >= xp_max) {
            isLevelUp = true;
            level++;
            xp_now -= xp_max;
            xp_max += rarity.toLowerCase() === "r" && level === 2 ? 50 : 100;
        }
        await db.run(
            `UPDATE user_characters SET level = ?, xp_now = ?, xp_max = ? WHERE user_id = ? AND character_id = ?`,
            level,
            xp_now,
            xp_max,
            user.id,
            characterValue
        );
        character = { level, xp_now, xp_max };
    }

    return { isFirstTime, isLevelUp, character };
}

export async function getCharacterFromCollection(user, characterValue) {
    if (user.bot) return null;
    const row = await db.get(
        `SELECT level, xp_now, xp_max FROM user_characters WHERE user_id = ? AND character_id = ?`,
        user.id,
        characterValue
    );
    return row
        ? { level: row.level, xp_now: row.xp_now, xp_max: row.xp_max }
        : { level: -1 };
}

export async function getCharactersFromCollection(
    user,
    value,
    charName,
    edition = null,
    series = null,
    rarity = null
) {
    if (user.bot) return [];
    const rows = await db.all(
        `SELECT character_id FROM user_characters WHERE user_id = ?`,
        user.id
    );
    const keys = rows.map((r) => r.character_id);
    return filterCharacters(
        (key) => getCharacter(key),
        keys,
        value,
        charName,
        edition,
        series,
        rarity
    );
}

// -------------------- CHANNEL --------------------
export async function getChannels(user) {
    if (user.bot) return [];
    const rows = await db.all(
        `SELECT * FROM channels WHERE user_id = ?`,
        user.id
    );
    return rows.map((row) => new Channel(row));
}

export async function getChannel(user, namePart) {
    if (user.bot) return null;

    // Try exact (case-insensitive) match first
    const exactRows = await db.all(
        `SELECT * FROM channels WHERE user_id = ? AND LOWER(channel_name) = LOWER(?)`,
        user.id,
        namePart
    );

    if (exactRows.length > 0) {
        return exactRows.map((row) => new Channel(row));
    }

    // Fallback to partial match if no exact match found
    const partialRows = await db.all(
        `SELECT * FROM channels WHERE user_id = ? AND LOWER(channel_name) LIKE LOWER(?)`,
        user.id,
        `%${namePart}%`
    );

    return partialRows.map((row) => new Channel(row));
}

export async function createChannel(user, channel) {
    if (user.bot) return null;
    await getPlayerData(user);
    const gearsObj = channel.gears || {
        cpu: null,
        gpu: null,
        monitor: null,
        mouse: null,
        keyboard: null,
    };
    await db.run(
        `INSERT INTO channels (
            user_id, channel_name, profile_picture, banner_picture, mood, color, character_id,
            sub_count, growth_rate, mood_down_rate, supa_rate, stamina_current, stamina_max, stamina_cost_per_hour, gears
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
    console.log(
        `[DB] Created channel: '${channel.channel_name}' owned by ${user.username}`
    );
}

export async function updateChannel(user, channel, data) {
    if (user.bot) return null;

    const fields = [],
        values = [];
    for (const [key, value] of Object.entries(data)) {
        fields.push(`${key} = ?`);
        values.push(key === "gears" ? JSON.stringify(value) : value);
    }

    const oldName = channel.channel_name;
    const newName = data.channel_name ?? oldName;
    values.push(user.id, oldName);

    await db.run(
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

    console.log(
        `[DB] Updated channel: '${channel.channel_name}' owned by ${user.username}`
    );
    return updatedRow ? new Channel(updatedRow) : null;
}

export async function deleteChannel(user, channel) {
    if (user.bot) return null;

    await db.run(
        `DELETE FROM channels WHERE user_id = ? AND channel_name = ?`,
        user.id,
        channel.channel_name
    );
    console.log(
        `[DB] Deleted channel: '${channel.channel_name}' owned by ${user.username}`
    );
    return channel;
}

export { Player, Item, Channel };
