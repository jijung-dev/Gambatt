// -------------------- UTIL FUNCTIONS --------------------

export function toCodeBlock(string) {
    return `\`\`\`${string}\`\`\``;
}

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

export async function getUser(target, mention = null) {
    const id = mention?.replace(/[<@!>]/g, "");
    const metionUser = await target.client.users.fetch(id).catch(() => null);
    return metionUser || target.user || target.author;
}
