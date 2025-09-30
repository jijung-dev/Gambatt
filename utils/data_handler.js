const { Jsoning, MathOps } = require("jsoning");
const dataTable = new Jsoning("../Gambatt/gamedata/data.json");
const characterTable = new Jsoning("../Gambatt/gamedata/characterdata.json");
const dataUser = new Jsoning("../Gambatt/gamedata/userdata.json");
const perserverTable = new Jsoning("../Gambatt/gamedata/perserverdata.json");

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
const rarityIcons = {
    ssr: {
        id: "1421962816755073085",
        image: "https://cdn.discordapp.com/emojis/1421962816755073085.png",
        emoji: "<:SSR:1421962816755073085>",
    },
    sr: {
        id: "1421962809742463028",
        image: "https://cdn.discordapp.com/emojis/1421962809742463028.png",
        emoji: "<:SR:1421962809742463028>",
    },
    r: {
        id: "1421962806097477672",
        image: "https://cdn.discordapp.com/emojis/1421962806097477672.png",
        emoji: "<:R_:1421962806097477672>",
    },
};
async function HasCharacter(characterValue) {
    const character_data = await characterTable.get(characterValue);

    if (!character_data) {
        return false;
    }
    return true;
}

let cachedCharacters = null;

async function LoadCharacterData() {
    if (!cachedCharacters) {
        cachedCharacters = await characterTable.all(); // load once
        console.log(
            "[Character Cache] Loaded",
            Object.keys(cachedCharacters).length,
            "characters."
        );
    }
    return cachedCharacters;
}
async function GetCharacters(charName, edition = null, series = null) {
    const character_data = await LoadCharacterData();

    const nameLower = charName?.toLowerCase() || null;
    const editionLower = edition?.toLowerCase() || null;
    const seriesLower = series?.toLowerCase() || null;

    const results = Object.keys(character_data).filter((key) => {
        const entry = character_data[key];

        const matchName = nameLower
            ? entry.label.toLowerCase().includes(nameLower)
            : true;

        const matchEdition = editionLower
            ? entry.edition.toLowerCase() === editionLower
            : true;

        const matchSeries = seriesLower
            ? entry.series.toLowerCase().includes(seriesLower)
            : true;

        return matchName && matchEdition && matchSeries;
    });

    return results;
}

async function GetCharacter(characterValue) {
    const character_data = await characterTable.get(characterValue);

    if (!character_data) {
        throw new Error(`Character named: ${characterValue} does not exist`);
    }

    return new Character(
        characterValue,
        character_data.label,
        character_data.series,
        character_data.rarity,
        character_data.image,
        character_data.edition
    );
}

async function GetBanner() {
    const banner_data = await dataTable.get("banner");

    if (!banner_data || !banner_data.current_characters) {
        throw new Error(`No banner found`);
    }

    return new Banner(banner_data.current_characters);
}

async function SetPrefix(guildID, newPrefix) {
    const allPrefixes = (await perserverTable.get("prefix")) || {};
    allPrefixes[guildID] = newPrefix;
    await perserverTable.set("prefix", allPrefixes);
}

async function GetPrefix(guildID) {
    const allPrefixes = (await perserverTable.get("prefix")) || {};
    return allPrefixes[guildID] || ".";
}

module.exports = {
    Character,
    rarityIcons,
    LoadCharacterData,
    GetCharacter,
    GetCharacters,
    GetBanner,
    SetPrefix,
    GetPrefix,
};
