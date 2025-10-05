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

// -------------------- EXPORTS --------------------

export { toCodeBlock, renderXpBarEmoji };

// -------------------- LOGIN --------------------

