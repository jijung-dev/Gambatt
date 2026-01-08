import { Jsoning } from "jsoning";

const perserverTable = new Jsoning("./gamedata/perserverdata.json");

// -------------------- PREFIX --------------------

export async function setPrefix(guildId, prefix) {
    if (!guildId || typeof prefix !== "string") return false;

    const current = (await perserverTable.get(guildId)) ?? {};

    await perserverTable.set(guildId, {
        ...current,
        prefix: prefix,
    });

    return true;
}

export async function getPrefix(guildId) {
    if (!guildId) return ".";

    const data = await perserverTable.get(guildId);
    return data?.prefix ?? ".";
}

// -------------------- Channel Restrict --------------------

export async function setRestrict(guildId, channelId, deny = true) {
    if (!guildId || !channelId) return false;

    const current = (await perserverTable.get(guildId)) ?? {};
    const restricted = new Set(current.restrict ?? []);

    deny ? restricted.add(channelId) : restricted.delete(channelId);

    await perserverTable.set(guildId, {
        ...current,
        restrict: [...restricted],
    });

    return true;
}

export async function isRestricted(guildId, channelId) {
    if (!guildId || !channelId) return false;

    const data = await perserverTable.get(guildId);
    return data?.restrict?.includes(channelId) ?? false;
}
