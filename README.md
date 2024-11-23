# Dimitri the Demographer
A Discord Bot written in JavaScript, intended to display the number of online players on a Minecraft server in a voice channel's name.

### Description:
Using Node.js and the mcstatus library, the bot fetches the online players of a given server every minute, and displays them in a voice channel's name.

Due to the fact that Discord limits the number of times a bot can edit a channel's name to once every 5 minutes, I decided to have the bot create 5 channels which are looped through, displaying the number of players on one and hiding all of the other channels from view.

This is a very hacky approach but suitable for those who are determined to display the player number in a voice channel's name.

The channels in a 'standby' status (channels that are not currently used to display real time information) are moved into a separate "Demographics standby" category at the absolute bottom of the Discord server, out of sight (non-admins can't see the category, but admins can) and the active channel currently in use is moved to the absolute top of the channel list.

### Required Permissions:
When creating the bot, in the OAuth2 URL generator, youn need to specify the following permissions:
- bot
- applications.commands

additionally, here is the list of necessary bot permissions:
- Send Messages
- Manage Channels
- View Channels
- Connect

Connect permission is mandatory, because discord decided that in order to be able to edit the voice channel's name, you need the connect permissions. Learned that here: https://www.answeroverflow.com/m/1133620605070086206