const { Jsoning, MathOps } = require("jsoning");
const dataTable = new Jsoning("../Gambatt/gamedata/data.json");
const characterTable = new Jsoning("../Gambatt/gamedata/characterdata.json");
const userTable = new Jsoning("../Gambatt/gamedata/userdata.json");
const perserverTable = new Jsoning("../Gambatt/gamedata/perserverdata.json");

const rarityIcons = {
    ssr: {
        id: "1421962816755073085",
        image: "https://cdn.discordapp.com/emojis/1421962816755073085.png",
        emoji: "<:SSR:1421962816755073085>",
        color: "#ffce64",
    },
    sr: {
        id: "1421962809742463028",
        image: "https://cdn.discordapp.com/emojis/1421962809742463028.png",
        emoji: "<:SR:1421962809742463028>",
        color: "#b600ce",
    },
    r: {
        id: "1421962806097477672",
        image: "https://cdn.discordapp.com/emojis/1421962806097477672.png",
        emoji: "<:R_:1421962806097477672>",
        color: "#64edff",
    },
};
const currencyIcon = {
    cube: {
        id: "1423067106441691146",
        image: "https://cdn.discordapp.com/emojis/1423067106441691146.png",
        emoji: "<:cube:1423067106441691146>",
    },
};

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
    rarityIcons,
    currencyIcon,
    SetPrefix,
    GetPrefix,
};
