import { Jsoning } from "jsoning";

const perserverTable = new Jsoning("./gamedata/perserverdata.json");

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

const tierIcons = {
    common: {
        id: "1433506049876430898",
        image: "https://cdn.discordapp.com/emojis/1433506049876430898.png",
        emoji: "<:common:1433506049876430898>",
        color: "#bbbbbb",
    },
    uncommon: {
        id: "1433506047024431164",
        image: "https://cdn.discordapp.com/emojis/1433506047024431164.png",
        emoji: "<:uncommon:1433506047024431164>",
        color: "#02db02",
    },
    rare: {
        id: "1433506044574957783",
        image: "https://cdn.discordapp.com/emojis/1433506044574957783.png",
        emoji: "<:rare:1433506044574957783>",
        color: "#02ffff",
    },
    epic: {
        id: "1433506041940676750",
        image: "https://cdn.discordapp.com/emojis/1433506041940676750.png",
        emoji: "<:epic:1433506041940676750>",
        color: "#da02da",
    },
    legendary: {
        id: "1433506039403384892",
        image: "https://cdn.discordapp.com/emojis/1433506039403384892.png",
        emoji: "<:legendary:1433506039403384892>",
        color: "#ff8b2c",
    },
    custom_made: {
        id: "1433506036643532951",
        image: "https://cdn.discordapp.com/emojis/1433506036643532951.png",
        emoji: "<:custom:1433506036643532951>",
        color: "#ff4844",
    },
};

const tierMap = {
    1: "common",
    2: "uncommon",
    3: "rare",
    4: "epic",
    5: "legendary",
    6: "custom_made",
};

const currencyIcon = {
    cube: {
        id: "1423067106441691146",
        image: "https://cdn.discordapp.com/emojis/1423067106441691146.png",
        emoji: "<:cube:1423067106441691146>",
    },
};

// -------------------- PREFIX --------------------

async function SetPrefix(guildID, newPrefix) {
    const allPrefixes = (await perserverTable.get("prefix")) || {};
    allPrefixes[guildID] = newPrefix;
    await perserverTable.set("prefix", allPrefixes);
}

async function GetPrefix(guildID) {
    const allPrefixes = (await perserverTable.get("prefix")) || {};
    return allPrefixes[guildID] || ".";
}

export { tierMap, tierIcons, rarityIcons, currencyIcon, SetPrefix, GetPrefix };
