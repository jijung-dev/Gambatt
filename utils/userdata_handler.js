import { Jsoning } from "jsoning";
import { filterCharacters, GetCharacter } from "./characterdata_handler.js";

const dataTable = new Jsoning("./gamedata/data.json");
const characterTable = new Jsoning("./gamedata/characterdata.json");
const userTable = new Jsoning("./gamedata/userdata.json");
const perserverTable = new Jsoning("./gamedata/perserverdata.json");

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

async function GetPlayerData(user) {
    if (user.bot) return null;

    let player = await userTable.get(user.id);
    if (!player) {
        player = await StartPlayer(user);
    }

    return new Player(player.balance, player.collection, player.inventory);
}

async function StartPlayer(user) {
    const newPlayer = new Player(0, {}, {});
    await userTable.set(user.id, newPlayer);
    return newPlayer;
}

// -------------------- BALANCE --------------------

async function ReduceBalance(user, amount) {
    const player = await GetPlayerData(user);
    player.balance -= amount;
    await userTable.set(user.id, player);
}

// -------------------- COLLECTION --------------------

async function AddCharacterToCollection(user, characterValue, rarity) {
    const player = await GetPlayerData(user);
    const rarityValue = GetRarityValue(rarity);

    let isFirstTime = false;
    let isLevelUp = false;
    let character = player.collection[characterValue];

    if (!character) {
        // First time acquiring
        character = {
            level: rarityValue.level,
            xp_now: rarityValue.xp_on_start,
            xp_max: rarityValue.xp_max,
        };
        player.collection[characterValue] = character;
        isFirstTime = true;
    } else {
        // Duplicate: add XP
        character.xp_now += rarityValue.addValue;

        // Level up if XP exceeds max
        if (character.xp_now >= character.xp_max) {
            isLevelUp = true;
            character.level++;
            character.xp_now -= character.xp_max;
            // Increase XP cap depending on rarity
            character.xp_max +=
                rarity.toLowerCase() === "r" && character.level === 2
                    ? 50
                    : 100;
        }
    }

    await userTable.set(user.id, player);
    return { isFirstTime, isLevelUp, character };
}

// -------------------- RARITY INFO --------------------

function GetRarityValue(rarity) {
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

// -------------------- COLLECTION QUERIES --------------------

async function GetCharacterFromCollection(user, characterValue) {
    const character = (await GetPlayerData(user)).collection[characterValue];
    if (!character)
        throw new Error(
            `Character ${characterValue} does not exist in collection`
        );
    return character;
}

async function GetCharactersFromCollection(
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

// -------------------- EXPORTS --------------------

export {
    Player,
    ReduceBalance,
    GetRarityValue,
    GetPlayerData,
    AddCharacterToCollection,
    GetCharactersFromCollection,
    GetCharacterFromCollection,
};
