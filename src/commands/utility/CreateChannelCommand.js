const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const PlayerUtils = require('../../utils/PlayerUtils');
const TaskManager = require('../../TaskManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createdemographics')
        .setDescription('Creates a Voice channel for Demographic display')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addStringOption(option =>
            option
            .setName('server-ip')
            .setDescription('The IP of the Minecraft server')
            .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.reply(`Creating a demographics channel...`);
            
        try {
            //
            // Create the voice channel
            //
            const ip = interaction.options.getString('server-ip');
            const players = await PlayerUtils.getPlayers(ip);
            
            const channel = await interaction.guild.channels.create({
                name: `Players Online: ${players}`, // Set initial name with player count
                type: ChannelType.GuildVoice,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.Connect],
                    }
                ]
            });
    
            await interaction.editReply({
                content: `A Demographics channel has been created successfully, with IP ${interaction.options.getString('server-ip')}`,
            });

            //
            // Storing the channel in JSON
            //
            const filePath = path.resolve(__dirname, '../../../channel-demographics.json');

            const newEntry = {
                channelId: channel.id,
                ip: interaction.options.getString('server-ip')
            };

            // Check if the file exists
            if (fs.existsSync(filePath)) {
                try {
                    const fileData = fs.readFileSync(filePath, 'utf8');
                    const json = JSON.parse(fileData);

                    if (!Array.isArray(json)) {
                        json = [];
                    }
                    
                    json.push(newEntry);
                    
                    // Write updated JSON back to the file
                    fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
                    console.log('Entry added to existing JSON file');
                } catch (err) {
                    console.error('Error reading or writing file', err);
                }
            } else {
                const initialData = [newEntry];  // Store the new entry as the first element in an array

                try {
                    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
                    console.log('New JSON file created with the first entry');
                } catch (err) {
                    console.error('Error creating new file', err);
                }
            }
    
            // Optional: You might want to store `intervalId` to clear it later if necessary
            // clearInterval(intervalId) when needed, such as when the bot stops or the channel is deleted.
    
            // Start monitoring the server
            TaskManager.startMonitoringServer(ip, channel);

        } catch (error) {
            console.error(error);
    
            await interaction.editReply({
                content: "An error occurred while trying to create a demographics channel."
            });
        }
    },        
};