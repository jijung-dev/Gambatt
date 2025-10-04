const { Jsoning, MathOps } = require("jsoning");
const { filterCharacters, GetCharacter } = require("./characterdata_handler");
const dataTable = new Jsoning("../Gambatt/gamedata/data.json");
const characterTable = new Jsoning("../Gambatt/gamedata/characterdata.json");
const userTable = new Jsoning("../Gambatt/gamedata/userdata.json");
const perserverTable = new Jsoning("../Gambatt/gamedata/perserverdata.json");

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

async function ReduceBalance(user, amount) {
    const player = await GetPlayerData(user);
    player.balance -= amount;
    await userTable.set(user.id, player);
}

async function AddCharacterToCollection(user, characterValue, rarity) {
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
            if (rarity.toLowerCase() === "r" && character.level == 2) {
                character.xp_max += 50;
            } else {
                character.xp_max += 100;
            }
        }
    }

    await userTable.set(user.id, player);
    return { isFirstTime, isLevelUp, character };
}

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

async function GetCharacterFromCollection(user, characterValue) {
    const character = (await GetPlayerData(user)).collection[characterValue];
    if (!character) {
        throw new Error(
            `Character named: ${characterValue} does not exist in collection`
        );
    }
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

module.exports = {
    Player,
    ReduceBalance,
    GetRarityValue,
    GetPlayerData,
    AddCharacterToCollection,
    GetCharactersFromCollection,
    GetCharacterFromCollection,
};
