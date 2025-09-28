const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const { token } = require("../config.json");

async function getUser(userID) {
	return await client.users.fetch(userID);
}

module.exports = { getUser };
client.login(token);
