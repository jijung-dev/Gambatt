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

async function GetCharacterFromCollection(user, characterValue) {
    const character = (await GetPlayerData(user)).collection[characterValue];    
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
    GetPlayerData,
    GetCharactersFromCollection,
    GetCharacterFromCollection,
};
