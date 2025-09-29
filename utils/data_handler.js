const { Jsoning, MathOps } = require("jsoning");
const dataTable = new Jsoning("../Gambatt/gamedata/data.json");
const characterTable = new Jsoning("../Gambatt/gamedata/characterdata.json");
const dataUser = new Jsoning("../Gambatt/gamedata/userdata.json");

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
    },
    sr: {
        id: "1421962809742463028",
        image: "https://cdn.discordapp.com/emojis/1421962809742463028.png",
    },
    r: {
        id: "1421962806097477672",
        image: "https://cdn.discordapp.com/emojis/1421962806097477672.png",
    },
};

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

module.exports = {
    Character,
    rarityIcons,
    GetCharacter,
    GetBanner,
};
