require('dotenv').config();

const { Client, IntentsBitField, BaseInteraction, Collection, Events, GatewayIntentBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config.json');
const TaskManager = require('./TaskManager');


const client = new Client({
    intents: [
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildChannelUpdates
    ]
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

/**
 * Commands
 */

// Command Handler
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);

		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Command event listener
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Check if command exists
    const command = interaction.client.commands.get(interaction.commandName);
	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

    // Execute the command
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}

	console.log(interaction);
});

/**
 * On Ready
 */

client.on('ready', async interaction => {
	console.log(`Launching task...`);
	await TaskManager.startMonitoringServer(client);
	//console.log(`Task launched. Monitoring server`);

	// if (fs.existsSync('channel-demographics.json')) {
	// 	const rawData = fs.readFileSync('channel-demographics.json', 'utf8');

	// 	if (!rawData.trim()) {
	// 		console.log('The JSON file is empty.');
	// 		return;
	// 	}

	// 	var jsonData = JSON.parse(rawData);
		
	// 	if (!Array.isArray(jsonData)) {
	// 		console.log("The json has incorrect data format");
	// 		return;
	// 	}

	// 	// Accessing the saved data
	// 	for (const entry of jsonData) {
	// 		const serverIp = entry.ip;
	// 		const channelId = entry.channelId;

	// 		console.log(`Found entry:`)
	// 		console.log(`Server IP: ${serverIp}`);
	// 		console.log(`Channel ID: ${channelId}`);
	// 		console.log(` `);

	// 		try {
	// 			const channel = await client.channels.fetch(channelId);
	
	// 			// if (!channel) {
	// 			// 	console.log(`Channel with id ${channelId} no longer exists. Removing it from the JSON...`);
	// 			// 	jsonData = jsonData.filter(ent => ent.channelId !== channelId);
	// 			// 	continue;
	// 			// }

	// 			// All checks have passed, channel is valid
	// 			// Start the task of updating the name of the channel
	// 			TaskManager.startMonitoringServer(serverIp, channel);

	// 		} catch (error) {
	// 			if (error.code === 10003) { // 10003: Unknown Channel (channel no longer exists)
	// 				console.log(`Channel with id ${channelId} no longer exists. Removing it from the JSON...`);
	// 				jsonData = jsonData.filter(ent => ent.channelId !== channelId);
	// 				const filePath = path.resolve(__dirname, '../channel-demographics.json');
	// 				fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
	// 			} else {
	// 				console.error(`Error fetching channel with id ${channelId}: ${error.message}`);
	// 			}
	// 		}
	// 	}
	// } else {
	// 	console.log("File not found, no data stored.");
	// }
});

client.login(config.token)

module.exports = client;