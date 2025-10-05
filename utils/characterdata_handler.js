import { Jsoning } from "jsoning";

const dataTable = new Jsoning("./gamedata/data.json");
const characterTable = new Jsoning("./gamedata/characterdata.json");
const userTable = new Jsoning("./gamedata/userdata.json");
const perserverTable = new Jsoning("./gamedata/perserverdata.json");

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

/**
 * @returns {string} return an array of strings 
 */
async function GetCharacters(
    charName,
    edition = null,
    series = null,
    rarity = null
) {
    const characterData = await LoadCharacterData();
    const keys = Object.keys(characterData);

    return filterCharacters(
        (key) => characterData[key], // already loaded
        keys,
        charName,
        edition,
        series,
        rarity
    );
}

/**
 * @returns {Character} return the character object 
 */
async function GetCharacter(characterValue) {
    if (!cachedCharacters) await LoadCharacterData();

    const characterData = cachedCharacters[characterValue];
    if (!characterData) {
        throw new Error(`Character named: ${characterValue} does not exist`);
    }

    return new Character(
        characterValue,
        characterData.label,
        characterData.series,
        characterData.rarity,
        characterData.image,
        characterData.edition
    );
}

/**
 * Filter characters
 * @returns {string} return an array of strings 
 */
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
        const entry = await getEntry(key); // supports sync or async fetch
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

/**
 * @returns {Banner} return a banner object
 */
async function GetBanner() {
    const bannerData = await dataTable.get("banner");
    if (!bannerData?.current_characters) {
        throw new Error("No banner found");
    }
    return new Banner(bannerData.current_characters);
}

export {
    Character,
    LoadCharacterData,
    GetCharacter,
    GetCharacters,
    filterCharacters,
    GetBanner,
};
