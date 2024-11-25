const PlayerUtils = require('./utils/PlayerUtils');
const fs = require('fs');
const path = require('path');
const ChannelFactory = require('./utils/ChannelFactory');
const ChannelType = require('discord.js');

let intervalId = null;
let index = 0; // Will be used to loop through the channels
let isDepleated = false;
let previousChannelId;

async function startMonitoringServer(client) {
    if (intervalId) {
        clearInterval(intervalId);
        console.log(`Cleared last task`);
    }

    // Retrieve the json file
    try {
        const filePath = path.resolve(__dirname, '../channel-demographics.json');

        if (fs.existsSync(filePath)) {
            try {
                const fileData = fs.readFileSync(filePath, 'utf8');
                
                // If the filepath is correct, start monitoring servers
                console.log(`Filepath correct...`);
                startProcess(fileData, client);

            } catch (err) {
                console.error('Error reading or writing file', err);
            }
        } else {
            console.log(`No servers to track. Start tracking a server using the '/createdemographics' command.`);
        }
    } catch (error) {
        console.error(`Something went wrong with File path reading I think`, error);
    }
}

async function startProcess(fileData, client) {
    const json = JSON.parse(fileData);
    const entries = json.map(server => server.channels);

    // Validate the json structure
    if (!entries || typeof entries !== 'object') {
        throw new Error('Invalid structure: channels list is missing or its not an object.');
    }
    
    // Start the process
    intervalId = setInterval(() => processEntry(fileData, entries, client), 60 * 1000);
}

async function processEntry(fileData, entries, client) {
    const entry = entries[0][index];
    console.log(``);
    console.log(`working on entry ${entry.channelId}, ${new Date()}`);

    // // Check if entries is not empty
    // if (entries.length === 0) {
    //     console.log(`${n} channels are missing. Creating them anew`)
    // }

    // Start looping through the entries
    const serverIp = entry.ip;
	const channelId = entry.channelId;

    // Get the standby channel category for inactive channels
    const standbyCategory = await JSON.parse(fileData)[0].standby;

    // Find the channel for this entry
    try {
        const channel = await client.channels.fetch(channelId);

        // Update the channel name
        const playersOnline = await PlayerUtils.getPlayers(serverIp);
        await channel.setName(`Currently Playing: ${playersOnline}`);

        // Move the channel to the top of the channels list
        await channel.setParent(null)
        .then(() => console.log(`Moved the new channel to the top`))
        .catch(console.error);
        await channel.setPosition(0)
        .catch(console.error);

        console.log(`players: ${playersOnline}, ${new Date()}`);

        console.log(`Modifying channel with ID ${channelId}`);

        // Show the channel to everyone
        await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
            ViewChannel: true
        }).then(() => console.log('Show the channel to all'))
        .catch(console.error);

        // Index incrementation logic
        if (isDepleated) {
            // console.log(`entries length: ${entries[0].length}`);
            // console.log(`updating index: ${index}`);
            // Switch to the next channel in queue (next index)
            index = (index + 1) % entries[0].length;
            // console.log(`updated index: ${index}`);
        } else {
            // Hide the previous channel
            try {
                // Only hide the previous channel if it's  not the same one as we're currentl viewing
                if (!previousChannelId) {
                    previousChannelId = channelId;
                } 
                
                if (previousChannelId !== channelId) {
                    const previousChannel = await client.channels.fetch(previousChannelId);

                    // Hiding logic
                    previousChannel.permissionOverwrites.edit(channel.guild.roles.everyone, {
                        ViewChannel: false
                    }).then(() => console.log(`Hiding the previous channel`))
                    .catch(console.error);

                    // Move the channel to the bottom of the discord channels list
                    await previousChannel.setParent(standbyCategory)
                    .then(() => console.log(`Moved the previous channel to the bottom`))
                    .catch(console.error);
                }
            } catch (e) {
                console.error(`Error while looking for PREVIOUS channel`, e);
            }
        }

        isDepleated = !isDepleated;
        // console.log(`index: ${index}`);
        // console.log(`isDepleated: ${isDepleated}`);

        previousChannelId = !isDepleated ? channelId : entries[0][(index + 4) % entries[0].length].channelId; // Fetch the previous channels ID
        console.log(`previous channel id: ${previousChannelId}`);
    } catch (error) {
        // It is possible that at some point in time, a channel gets deleted
        // (i.e: a server admin decided to remove it)
        if (error.code === 10003) { // 10003: Unknown Channel (channel no longer exists)
            console.log(`Channel with id ${channelId} no longer exists. Removing it from the JSON...`);

            const category = channel.guild.channels.cache.find(
                ch => ch.type === 'GUILD_CATEGORY' &&
                (ch.name === "How many players online?")
            );

            // Create a new channel in its stead
            const newChannel = await ChannelFactory.create(client, serverIp, true, category);
            const newChannelId = newChannel.id;
            console.log('===');
            console.log(`Added a new channel with id ${newChannelId} to replace a removed one.`);
            console.log('===');

            // Remove old channel and insert new channel in the json
            ChannelFactory.updateChannelInJson(fileData, serverIp, newChannelId, channelId);

            previousChannelId = channelId;
        } else {
            console.log(error);
        }
    }
}

module.exports = {
    startMonitoringServer
}

// what needs TObeDOne is storing the index where we last stopped in the json