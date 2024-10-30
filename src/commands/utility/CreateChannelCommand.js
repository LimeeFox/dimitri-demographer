const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const TaskManager = require('../../TaskManager');
const ChannelFactory = require('../../utils/ChannelFactory');

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
        ).addStringOption(option => 
            option
            .setName('server-name')
            .setDescription('The name of the Server')
            .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.reply(`Creating a demographics channel...`);
            
        try {
            //
            // Create 5 voice channels that will be part of a rotation
            // Because Discord limits channel name editing to once every 5 minutes
            // :D thanks discord
            //
            const filePath = path.resolve(__dirname, '../../../channel-demographics.json');

            // Prepare some constants that we will reuse when making channels
            const ip = interaction.options.getString('server-ip');
            const name = interaction.options.getString('server-name');

           // This is where each channel will be stored, a per-server category
           // Created for each IP you decide to track
            const serverGroup = {
                name: name,
                channels: []
            }

            // The loop that creates the 5 channels
            for (var i = 0; i < 5; i++) {
               
                // Create a voice channel
                const channel = await ChannelFactory.create(interaction.client, ip, i !== 0)
        
                const j = i + 1;
                await interaction.editReply({
                    content: `${parseInt(j)}${j === 1 ? `st` : j === 2 ? `nd` : j === 3 ? `rd` : `th`} Demographics channel has been created successfully, with IP ${interaction.options.getString('server-ip')}`,
                });

                // Create and push a new json entry for the channel
                await ChannelFactory.addChannelToJson(serverGroup.channels, ip, channel.id);
            }

            // Launch the periodic task to monitor the servers and update the channel names
            TaskManager.startMonitoringServer(interaction.client);

            // Put everything in the json file.
            // Check if the file exists
            if (fs.existsSync(filePath)) {
                try {
                    const fileData = fs.readFileSync(filePath, 'utf8');
                    const json = JSON.parse(fileData);

                    if (!Array.isArray(json)) {
                        json = [];
                    }
                        
                    json.push(serverGroup);
                        
                    // Write updated JSON back to the file
                    fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
                    console.log('Entry added to existing JSON file');
                } catch (err) {
                    console.error('Error reading or writing file', err);
                }
            // If the file doesn't exist yet, make one
            } else {
                const initialData = [serverGroup];  // Store the new entry as the first element in an array

                try {
                    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
                    console.log('New JSON file created with the first entry');
                } catch (err) {
                    console.error('Error creating new file', err);
                }
            }

        } catch (error) {
            console.error(error);
    
            await interaction.editReply({
                content: "An error occurred while trying to create a demographics channel."
            });
        }
    },        
};