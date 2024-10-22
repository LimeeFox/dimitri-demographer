# Dimitri the Demographer
A Discord Bot written in JavaScript, intended to display the number of online players on a Minecraft server in a voice channel's name.

### Description:
Using Node.js and the mcstatus library, the bot fetches the online players of a given server every minute, and displays them in a voice channel's name.

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