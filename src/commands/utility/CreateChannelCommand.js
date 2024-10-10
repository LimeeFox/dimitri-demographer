const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, PermissionsBitField } = require('discord.js');
const mcs = require('node-mcstatus');

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
            const players = await getPlayers(interaction);
            
            // Create the voice channel
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
    
            // Update the channel name every minute
            const intervalId = setInterval(async () => {
                const playersOnline = await getPlayers(interaction); // Await to get the player count
                await channel.setName(`Players Online: ${playersOnline}`); // Set the name correctly
            }, 60 * 1000);
    
            // Optional: You might want to store `intervalId` to clear it later if necessary
            // clearInterval(intervalId) when needed, such as when the bot stops or the channel is deleted.
    
        } catch (error) {
            console.error(error);
    
            await interaction.editReply({
                content: "An error occurred while trying to create a demographics channel."
            });
        }
    },        
};

// Get players online from the server
async function getPlayers(interaction) {
    const host = interaction.options.getString('server-ip');
    var players = 5;

    try {
        const result = await mcs.statusJava(host);

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

// Function to periodically check player count
async function checkPlayerCount() {
    const host = 'your.minecraft.server.ip'; // Replace with your server's IP
    const playerCount = await getPlayers(host); // Get the player count

    // Optionally, you can send a message to a specific channel
    const channelId = 'your_channel_id'; // Replace with your channel ID
    const channel = client.channels.cache.get(channelId);
    if (channel) {
        await channel.send(`Current player count: ${playerCount}`);
    }
}
