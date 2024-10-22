const mcs = require('node-mcstatus');

// Get players online from the server
async function getPlayers(ip) {
    var players = 5;

    try {
        const result = await mcs.statusJava(ip);

        if (result && result.players) {
            players = result.players.online;
        } else {
            console.log('No player information available.');
            players = 0;
        }

    } catch (error) {
        console.error(error);
    }
   
    return players;
}

// @DEPRECATED, MARKED FOR REMOVAL
// // Function to periodically check player count
// async function checkPlayerCount() {
//     const host = 'your.minecraft.server.ip'; // Replace with your server's IP
//     const playerCount = await getPlayers(host); // Get the player count

//     // Optionally, you can send a message to a specific channel
//     const channelId = 'your_channel_id'; // Replace with your channel ID
//     const channel = client.channels.cache.get(channelId);
//     if (channel) {
//         await channel.send(`Current player count: ${playerCount}`);
//     }
// }

module.exports = {
    getPlayers
};