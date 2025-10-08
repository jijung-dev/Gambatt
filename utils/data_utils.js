// -------------------- UTIL FUNCTIONS --------------------

function toCodeBlock(string) {
    return `\`\`\`${string}\`\`\``;
}

function renderXpBarEmoji(current, total, opts = {}) {
    const { width = 10, filled = "▰", empty = "▱", showNumbers = true } = opts;

    if (total <= 0)
        return filled.repeat(width) + (showNumbers ? ` (${current}/${total})` : "");

    const ratio = Math.max(0, Math.min(1, current / total));
    const filledCount = Math.round(ratio * width);
    const emptyCount = width - filledCount;

    const bar = filled.repeat(filledCount) + empty.repeat(emptyCount);
    return showNumbers ? `${bar}` : bar;
}
/**
 * Force image params and create an embed
 * @param {string} imageUrl - Original image URL
 * @param {string} title - Optional embed title
 * @param {string} description - Optional embed description
 * @returns {EmbedBuilder}
 */
export function ForceResize(imageUrl) {
    if (!imageUrl) {
        throw new Error("Invalid image URL");
    }

    // Ensure URL is safe and append query params correctly
    let url;
    try {
        url = new URL(imageUrl);
    } catch (err) {
        throw new Error("Invalid image URL format");
    }

    // Set forced parameters
    url.searchParams.set("format", "webp");
    url.searchParams.set("quality", "lossless");
    url.searchParams.set("width", "474");
    url.searchParams.set("height", "656");

    return url.toString();
}

// -------------------- EXPORTS --------------------

export { toCodeBlock, renderXpBarEmoji };

// -------------------- LOGIN --------------------

