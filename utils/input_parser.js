export function parseArgs(args) {
    const tokens = args.join(" ").split(/\s+/).filter(Boolean);

    const parts = {
        channel: parseChannel(tokens),
    };

    return parts;
}

function parseChannel(tokens) {
    const result = {
        mode: false,
    };

    const prefixMap = {
        "mode:": "mode",
    };

    const parsed = parseWithPrefixes(tokens, result, prefixMap);

    if (typeof parsed.mode === "string") {
        parsed.mode = parsed.mode.toLowerCase() === "true";
    }

    return parsed;
}

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
