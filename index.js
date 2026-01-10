import "#utils/console_logger.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { initDatabase } from "#data";
import { resetAllGames } from "#utils/roomdata_handler.js";

/* -------------------- ESM __dirname -------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------- Config -------------------- */
const { clientId, token } = JSON.parse(
    fs.readFileSync(path.join(__dirname, "config.json"), "utf8")
);

/* -------------------- Client -------------------- */
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

/* -------------------- Storage -------------------- */
client.commands = new Map();
client.buttons = new Map();
client.selects = new Map();
client.games = new Map();
client.gameStates = new Map(); 

/* -------------------- Helper -------------------- */
function getFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((e) =>
            e.isDirectory()
                ? getFiles(path.join(dir, e.name))
                : e.name.endsWith(".js")
                ? path.join(dir, e.name)
                : []
        );
}

/* -------------------- Commands -------------------- */
const slashJSON = [];
for (const file of getFiles(path.join(__dirname, "interactive/commands"))) {
    const mod = await import(pathToFileURL(file).href);
    const cmd = mod.default;
    if (!cmd?.name) continue;

    client.commands.set(cmd.name, mod);
    cmd.aliases?.forEach((a) => client.commands.set(a, mod));
    if (cmd.data) slashJSON.push(cmd.data.toJSON());
}

/* -------------------- Buttons -------------------- */
for (const file of getFiles(path.join(__dirname, "interactive/buttons"))) {
    const mod = await import(pathToFileURL(file).href);
    if (mod.default?.id) client.buttons.set(mod.default.id, mod);
}

/* -------------------- Games -------------------- */
for (const file of getFiles(path.join(__dirname, "interactive/game"))) {
    const mod = await import(pathToFileURL(file).href);
    if (mod.default?.id) {
        client.games.set(mod.default.id, mod.default);
        console.log(`🎮 Loaded game: ${mod.default.id}`);
    }
}

/* -------------------- Events -------------------- */
for (const file of fs
    .readdirSync(path.join(__dirname, "events"))
    .filter((f) => f.endsWith(".js"))) {
    const { default: event } = await import(
        pathToFileURL(path.join(__dirname, "events", file)).href
    );
    event.once
        ? client.once(event.name, (...a) => event.execute(client, ...a))
        : client.on(event.name, (...a) => event.execute(client, ...a));
}

/* -------------------- Slash Deploy -------------------- */
async function deploy() {
    await new REST({ version: "10" })
        .setToken(token)
        .put(Routes.applicationCommands(clientId), { body: slashJSON });
}

/* -------------------- Startup -------------------- */
(async () => {
    await initDatabase();
    await resetAllGames();
    await deploy();
    await client.login(token);
})();
