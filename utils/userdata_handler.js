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

    return new Player(
        row.balance,
        JSON.parse(row.collection || "{}"),
        JSON.parse(row.inventory || "{}")
    );
}

export async function StartPlayer(user) {
    const newPlayer = new Player();
    await db.run(
        "INSERT INTO users (id, balance, collection, inventory) VALUES (?, ?, ?, ?)",
        user.id,
        newPlayer.balance,
        JSON.stringify(newPlayer.collection),
        JSON.stringify(newPlayer.inventory)
    );
    return newPlayer;
}

// -------------------- BALANCE --------------------
export async function ReduceBalance(user, amount) {
    const player = await GetPlayerData(user);
    player.balance -= amount;

    await db.run(
        "UPDATE users SET balance = ?, collection = ?, inventory = ? WHERE id = ?",
        player.balance,
        JSON.stringify(player.collection),
        JSON.stringify(player.inventory),
        user.id
    );
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

// -------------------- COLLECTION --------------------
export async function AddCharacterToCollection(user, characterValue, rarity) {
    const player = await GetPlayerData(user);
    const rarityValue = GetRarityValue(rarity);

    let isFirstTime = false;
    let isLevelUp = false;
    let character = player.collection[characterValue];

    if (!character) {
        character = {
            level: rarityValue.level,
            xp_now: rarityValue.xp_on_start,
            xp_max: rarityValue.xp_max,
        };
        player.collection[characterValue] = character;
        isFirstTime = true;
    } else {
        character.xp_now += rarityValue.addValue;
        if (character.xp_now >= character.xp_max) {
            isLevelUp = true;
            character.level++;
            character.xp_now -= character.xp_max;
            character.xp_max +=
                rarity.toLowerCase() === "r" && character.level === 2 ? 50 : 100;
        }
    }

    await db.run(
        "UPDATE users SET balance = ?, collection = ?, inventory = ? WHERE id = ?",
        player.balance,
        JSON.stringify(player.collection),
        JSON.stringify(player.inventory),
        user.id
    );

    return { isFirstTime, isLevelUp, character };
}

export async function AddCharactersToCollection(user, characters) {
    const player = await GetPlayerData(user);
    const results = [];

    for (const { value, rarity } of characters) {
        const rarityValue = GetRarityValue(rarity);
        let isFirstTime = false;
        let isLevelUp = false;
        let character = player.collection[value];

        if (!character) {
            character = {
                level: rarityValue.level,
                xp_now: rarityValue.xp_on_start,
                xp_max: rarityValue.xp_max,
            };
            player.collection[value] = character;
            isFirstTime = true;
        } else {
            character.xp_now += rarityValue.addValue;
            if (character.xp_now >= character.xp_max) {
                isLevelUp = true;
                character.level++;
                character.xp_now -= character.xp_max;
                character.xp_max +=
                    rarity.toLowerCase() === "r" && character.level === 2 ? 50 : 100;
            }
        }

        results.push({ isFirstTime, isLevelUp, character, rarity });
    }

    await db.run(
        "UPDATE users SET balance = ?, collection = ?, inventory = ? WHERE id = ?",
        player.balance,
        JSON.stringify(player.collection),
        JSON.stringify(player.inventory),
        user.id
    );

    return results;
}

// -------------------- COLLECTION QUERIES --------------------
export async function GetCharacterFromCollection(user, characterValue) {
    const character = (await GetPlayerData(user)).collection[characterValue];
    if (!character)
        throw new Error(
            `Character ${characterValue} does not exist in collection`
        );
    return character;
}

export async function GetCharactersFromCollection(
    user,
    charName,
    edition = null,
    series = null,
    rarity = null
) {
    const collection = (await GetPlayerData(user)).collection;
    const keys = Object.keys(collection);

    return filterCharacters(
        (key) => GetCharacter(key),
        keys,
        charName,
        edition,
        series,
        rarity
    );
}

export { Player, Item };
