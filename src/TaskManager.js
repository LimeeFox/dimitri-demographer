const PlayerUtils = require('./utils/PlayerUtils');

async function startMonitoringServer(ip, channel) {

    // Update the channel name every minute
    const intervalId = setInterval(async () => {
        const playersOnline = await PlayerUtils.getPlayers(ip);
        await channel.setName(`Players Online: ${playersOnline}`);
    }, 60 * 1000);
}

module.exports = {
    startMonitoringServer
}