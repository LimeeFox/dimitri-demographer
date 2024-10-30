const { ChannelType, PermissionsBitField } = require('discord.js');
const PlayerUtils = require('./PlayerUtils');
const path = require('path');
const fs = require('fs');
const config = require('../../config.json');

/**
 * The purpose of ChannelFactory is to provide an easy way to create new channels
 */

/**
 * Create a locked voice channel
 * @param {string} ip server host
 * @param {boolean} isVisible visibility of the discord channel
 */
async function create(client, ip, isVisible) {
    const guildId = config.guildId;

    let guild;
    try {
        guild = await client.guilds.fetch(guildId);
    } catch (error) {
        console.log('Could not find the guild', error);
    }

    // Create a voice channel
    return channel = await guild.channels.create({
        name: `Players Online: ${await PlayerUtils.getPlayers(ip)}`, // Set initial name with player count
        type: ChannelType.GuildVoice,
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: [PermissionsBitField.Flags.Connect,
                    ... (isVisible ? [] : [PermissionsBitField.Flags.ViewChannel])] // Show the channel? or hide it?
            },
        ]
    });
}

/**
 * Add a channel to the json
 * @param {*} node the json node of the server channel list where the channel will be stored
 * @param {string} ip server host
 * @param {string} channelId the ID of the discord channel
 */
async function addChannelToJson(node, ip, channelId) {
    // Create a new entry for the channels list
    const entry = {
        ip: ip,
        channelId: channelId
    }

    node.push(entry);
}

/**
 * Update the json by removing the input channel
 * @param {string} fileData
 * @param {string} ip server host
 * @param {string} channelId the ID of the discord channel
 * @param {string} oldChannelId the ID of the channel to be removed
 */
async function updateChannelInJson(fileData, ip, channelId, oldChannelId) {
    // Parse the existing JSON data
    let jsonData = JSON.parse(fileData);

    // Iterate through each server and filter out the invalid channel
    jsonData.forEach(serverStorage => {
        serverStorage.channels = serverStorage.channels.filter(ch => ch.channelId !== oldChannelId);
    });

    // Add the new channel
    await addChannelToJson(jsonData[0].channels, ip, channelId);

    // Write the updated jsonData back to the file
    const filePath = path.resolve(__dirname, '../../channel-demographics.json');
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');

    console.log("Channel updated successfully.");
}

module.exports = {
    create, addChannelToJson, updateChannelInJson
}