// -------------------- UTIL FUNCTIONS --------------------
export const COSTPERROLL = 160;
/**
 * Wraps a string inside a Markdown code block.
 *
 * @param {string} string - The text to wrap.
 * @returns {string} The formatted code block string.
 */
export function toCodeBlock(string) {
    return `\`\`\`${string}\`\`\``;
}

/**
 * Renders a visual XP bar using emoji or symbols.
 *
 * @param {number} current - The current XP value.
 * @param {number} total - The total XP required.
 * @param {Object} [opts] - Optional settings for display.
 * @param {number} [opts.width=10] - The number of bar segments.
 * @param {string} [opts.filled="▰"] - The character for filled segments.
 * @param {string} [opts.empty="▱"] - The character for empty segments.
 * @param {boolean} [opts.showNumbers=true] - Whether to show numbers next to the bar.
 * @returns {string} A string representing the XP bar.
 */
export function renderXpBarEmoji(current, total, opts = {}) {
    const { width = 10, filled = "▰", empty = "▱", showNumbers = true } = opts;

    if (total <= 0)
        return (
            filled.repeat(width) + (showNumbers ? ` (${current}/${total})` : "")
        );

    const ratio = Math.max(0, Math.min(1, current / total));
    const filledCount = Math.round(ratio * width);
    const emptyCount = width - filledCount;

    const bar = filled.repeat(filledCount) + empty.repeat(emptyCount);
    return showNumbers ? `${bar}` : bar;
}

/**
 * Fetches a user from a mention or defaults to the command author.
 *
 * @async
 * @param {import("discord.js").Message | import("discord.js").CommandInteraction} target - The source message or interaction.
 * @param {string|null} [mention=null] - Optional mention string (e.g., `<@123456>`).
 * @returns {Promise<import("discord.js").User>} The fetched user.
 */
export async function getUser(target, mention = null) {
    const id = mention?.replace(/[<@!>]/g, "");
    const metionUser = await target.client.users.fetch(id).catch(() => null);
    return metionUser || target.user || target.author;
}

/**
 * Parses prefixed arguments (e.g., `n:`, `e:`, `s:`) into categorized structured objects.
 *
 * @param {string[]} args - The argument list to parse.
 * @returns {{
 *   character: object,
 *   channel: object,
 *   gear: object,
 *   mention: string|null
 * }}
 */
export function parseArgs(args) {
    const tokens = args.join(" ").split(/\s+/).filter(Boolean);

    const parts = {
        character: parseCharacter(tokens),
        channel: parseChannel(tokens),
        gear: parseGear(tokens),
        mention: parseMention(tokens),
    };

    return parts;
}

/* ---------------- CHARACTER PARSER ---------------- */
function parseCharacter(tokens) {
    const result = {
        charname: [],
        edition: [],
        series: [],
        rarity: null,
        charvalue: null,
        image_link: null,
    };

    const prefixMap = {
        "n:": "charname",
        "e:": "edition",
        "s:": "series",
        "r:": "rarity",
        "c:": "charvalue",
        "l:": "image_link",
    };

    return parseWithPrefixes(tokens, result, prefixMap, [
        "charname",
        "edition",
        "series",
    ]);
}

/* ---------------- CHANNEL PARSER ---------------- */
function parseChannel(tokens) {
    const result = {
        channame: [],
        channewname: [],
        charvalue: null,
        profile_picture: null,
        banner_picture: null,
        color: null,
    };

    const prefixMap = {
        "cn:": "channame",
        "c:": "charvalue",
        "cnn:": "channewname",
        "pl:": "profile_picture",
        "bl:": "banner_picture",
        "ec:": "color",
    };

    return parseWithPrefixes(tokens, result, prefixMap, [
        "channame",
        "channewname",
    ]);
}

/* ---------------- GEAR PARSER ---------------- */
function parseGear(tokens) {
    const result = {
        gearid: null,
        gearname: [],
        tier: null,
        image_link: null,
        growth_rate: null,
        mood_down_rate: null,
        supa_rate: null,
        stamina_cost_per_hour: null,
    };

    const prefixMap = {
        "gi:": "gearid",
        "gn:": "gearname",
        "t:": "tier",
        "gr:": "growth_rate",
        "mdr:": "mood_down_rate",
        "sr:": "supa_rate",
        "l:": "image_link",
        "scph:": "stamina_cost_per_hour",
    };

    return parseWithPrefixes(tokens, result, prefixMap, ["gearname"]);
}

/* ---------------- MENTION PARSER ---------------- */
function parseMention(tokens) {
    for (const token of tokens) {
        if (token.startsWith("<@") || token.startsWith("u:")) {
            return token.replace(/[<@>]/g, "").trim() || null;
        }
    }
    return null;
}

/* ---------------- GENERIC PARSER ---------------- */
function parseWithPrefixes(tokens, baseObj, prefixMap, joinableKeys = []) {
    let currentArrayKey = null;
    const result = structuredClone(baseObj);

    for (const raw of tokens) {
        const part = raw.trim();
        if (!part) continue;

        const prefix = Object.keys(prefixMap).find((p) => part.startsWith(p));
        if (prefix) {
            const key = prefixMap[prefix];
            const value = part.slice(prefix.length).trim();

            if (Array.isArray(result[key])) {
                result[key].push(value);
                currentArrayKey = key;
            } else {
                result[key] = value || null;
                currentArrayKey = null;
            }
        } else if (currentArrayKey && Array.isArray(result[currentArrayKey])) {
            result[currentArrayKey].push(part);
        }
    }

    for (const key of joinableKeys) {
        if (Array.isArray(result[key])) {
            result[key] = result[key].join(" ").trim() || null;
        }
    }

    return result;
}

/**
 * Checks for null/undefined/empty values in provided data.
 * Works with objects or direct values.
 *
 * @param {"all" | "or"} mode - "all" → all values must be valid,
 *                              "or" → at least one must be valid.
 * @param {...any} values - Values or objects to check.
 * @returns {boolean} True if the check passes, false otherwise.
 */
export function checkNull(mode, ...values) {
    const collected = [];

    // Flatten: turn objects into key/value pairs
    for (const v of values) {
        if (v && typeof v === "object" && !Array.isArray(v)) {
            for (const [, val] of Object.entries(v)) {
                collected.push(val);
            }
        } else {
            collected.push(v);
        }
    }

    const isValid = (v) => v != null && v !== "";

    const failedCount = collected.filter((v) => !isValid(v)).length;

    if (mode === "all") return failedCount === 0;
    if (mode === "or") return failedCount < collected.length;

    throw new Error('Invalid mode. Use "all" or "or".');
}

/**
 * Checks if one or more image URLs belong to allowed domains.
 *
 * @param {...string} urls - One or more image URLs to validate.
 * @returns {boolean} `true` if all provided URLs are from allowed domains, otherwise `false`.
 */
export function isAllowedImageDomain(...urls) {
    const allowedDomains = ["imgur.com", "imgchest.com"];

    try {
        // Filter out any null/undefined/empty values
        const validUrls = urls.filter(Boolean);
        if (validUrls.length === 0) return false;

        // Every URL must belong to an allowed domain
        return validUrls.every((url) => {
            const host = new URL(url).hostname.toLowerCase();
            return allowedDomains.some(
                (domain) => host === domain || host.endsWith(`.${domain}`)
            );
        });
    } catch {
        return false;
    }
}

/**
 * Delays execution for a specified amount of time.
 *
 * @param {number} ms - The number of milliseconds to wait before resolving.
 * @returns {Promise<void>} A promise that resolves after the specified delay.
 */
export function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
