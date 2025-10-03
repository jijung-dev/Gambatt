const { Jsoning, MathOps } = require("jsoning");
const dataTable = new Jsoning("../Gambatt/gamedata/data.json");
const characterTable = new Jsoning("../Gambatt/gamedata/characterdata.json");
const userTable = new Jsoning("../Gambatt/gamedata/userdata.json");
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

async function GetCharacters(
    charName,
    edition = null,
    series = null,
    rarity = null
) {
    const character_data = await LoadCharacterData();
    const keys = Object.keys(character_data);

    return filterCharacters(
        (key) => character_data[key], // already loaded
        keys,
        charName,
        edition,
        series,
        rarity
    );
}

async function GetCharacter(characterValue) {
    const character_data = await cachedCharacters[characterValue];

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
async function filterCharacters(
    getEntry,
    keys,
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
        const entry = await getEntry(key); // supports sync or async entry fetch

        if (
            matchCharacter(
                entry,
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
    nameLower,
    editionLower,
    seriesLower,
    rarityLower
) {
    if (nameLower && !entry.label.toLowerCase().includes(nameLower))
        return false;
    if (editionLower && entry.edition.toLowerCase() !== editionLower)
        return false;
    if (seriesLower && !entry.series.toLowerCase().includes(seriesLower))
        return false;
    if (rarityLower && entry.rarity.toLowerCase() !== rarityLower) return false;
    return true;
}

class Banner {
    constructor(current_characters = []) {
        this.current_characters = current_characters;
    }
}

async function GetBanner() {
    const banner_data = await dataTable.get("banner");

    if (!banner_data || !banner_data.current_characters) {
        throw new Error(`No banner found`);
    }

    return new Banner(banner_data.current_characters);
}

module.exports = {
    Character,
    LoadCharacterData,
    GetCharacter,
    GetCharacters,
    filterCharacters,
    GetBanner,
};
