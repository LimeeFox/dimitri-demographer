const PlayerUtils = require('./utils/PlayerUtils');
const fs = require('fs');
const path = require('path');

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

    // // Update the channel name every minute
    // intervalId = setInterval(async () => {
    //     console.log(`should be updating... ${new Date()}`);
    //     const playersOnline = await PlayerUtils.getPlayers(ip);
    //     await channel.setName(`Players Online: ${playersOnline}`);
    //     let currentTime = new Date();
    //     console.log(`updating the name... ${playersOnline}, ${currentTime}`);
    // }, 60 * 1000);
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
    console.log(`working on entry ${entry.channelId}, ${new Date()}`);

    // // Check if entries is not empty
    // if (entries.length === 0) {
    //     console.log(`${n} channels are missing. Creating them anew`)
    // }

    // Start looping through the entries
    const serverIp = entry.ip;
	const channelId = entry.channelId;

    // Find the channel for this entry
    try {
        const channel = await client.channels.fetch(channelId);

        // Update the channel name
        const playersOnline = await PlayerUtils.getPlayers(serverIp);
        await channel.setName(`Players Online: ${playersOnline}`);

        console.log(`players: ${playersOnline}, ${new Date()}`);

        console.log(`Modifying channel with ID ${channelId}`);

        // Show the channel to everyone
        channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
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
                if (previousChannel == null) {
                    previousChannel = channelId;
                }
                const previousChannel = await client.channels.fetch(previousChannelId);

                // Hiding logic
                previousChannel.permissionOverwrites.edit(channel.guild.roles.everyone, {
                    ViewChannel: false
                }).then(() => console.log(`Hiding the previous channel`))
                .catch(console.error);
            } catch (e) {
                console.error(`Error while looking for PREVIOUS channel`, e);
            }
        }

        isDepleated = !isDepleated;
        // console.log(`index: ${index}`);
        // console.log(`isDepleated: ${isDepleated}`);

        // Hide this channel 
    } catch (error) {
        // It is possible that at some point in time, a channel gets deleted
        // (i.e: a server admin decided to remove it)
        if (error.code === 10003) { // 10003: Unknown Channel (channel no longer exists)
            console.log(`Channel with id ${channelId} no longer exists. Removing it from the JSON...`);

            // Make a copy of the json data and filter out the invalid channel
            fileData = fileData.filter(serverStorage => {
                for (ch of serverStorage) {
                    if (ch.channelId !== channelId) {
                        return true;
                    }
                }
                return false;
            });

            // Overwrite the json file to erase the no-longer-valid channel
            const filePath = path.resolve(__dirname, '../channel-demographics.json');
            fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), 'utf8');
        } else {
            console.error(`Error fetching channel with id ${channelId}: ${error.message}`);
        }
    }

    previousChannelId = !isDepleated ? channelId : entries[0][(index + 4) % entries[0].length].channelId; // Fetch the previous channels ID
    console.log(`previous channel id: ${previousChannelId}`);
}

module.exports = {
    startMonitoringServer
}

//TODO TODO TODO
//todo
//todo
//todo
//todo
//todo
//todo
//todo
//todo
// what needs TObeDOne is storing the index where we last stopped in the json