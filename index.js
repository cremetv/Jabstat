const botsettings = require('./botsettings.json');
const Discord = require('discord.js');
const fs = require('fs');
const config = require('./utility/config');
const db = require('./utility/databaseconnection');
const logger = require('./utility/logger');
const logColor = require('./utility/logcolors');
const getDate = require('./utility/date');

const bcrypt = require('bcryptjs');
const password = botsettings.password;
const salt = botsettings.salt;
const hash = bcrypt.hashSync(password, salt);

const functions = require('./utility/functions');
const contestFunctions = require('./utility/contest');

const prefix = botsettings.prefix;

const serverId = botsettings.serverId;
const contestChat = botsettings.contestChat;

const client = new Discord.Client({disableEveryone: true});
client.commands = new Discord.Collection();

/****************
* Web
****************/
const web = require('./utility/web');



/****************
* Load Events
****************/
fs.readdir("./events/", (err, files) => {
  if (err) {
    logger.error(err, {logType: 'error', time: Date.now()});
    console.error(err);
    return;
  }
  files.forEach(file => {
    const event = require(`./events/${file}`);
    let eventName = file.split(".")[0];
    client.on(eventName, event.bind(null, client));
  });
});


/****************
* Load Commands
****************/
fs.readdir('./cmds/', (err, files) => {
  if (err) {
    logger.error(err, {logType: 'error', time: Date.now()});
    console.error(err);
    return;
  }

	let jsfiles = files.filter(f => f.split('.').pop() === 'js');
	if (jsfiles.length <= 0) {
    logger.info('No commands to load!', {logType: 'warning', time: Date.now()});
		return;
	}

  logger.info(`Loading ${jsfiles.length} commands!`, {logType: 'log', time: Date.now()});

	jsfiles.forEach((f, i) => {
		let props = require(`./cmds/${f}`);
    logger.info(`${i + 1}: ${f} loaded!`, {logType: 'log', time: Date.now()});
		client.commands.set(props.help.name, props);
    if (props.help.alias) client.commands.set(props.help.alias, props);
	});
});





let server;

client.on('ready', async () => {
  server = client.guilds.get(serverId);

  const contestChannel = client.channels.get(contestChat);
  contestChannel.fetchMessages().then(msg => console.log('fetched old messages')).catch(err => {
    logger.error(err, {logType: 'error', time: Date.now()});
    throw err;
  });

  functions.logServerInfo(server);
  functions.logChannels(server); // if no channel is given as argument => update all
                                    // for example functions.logChannels(server, channel);
  functions.logMemberCount(server);

  functions.logMembers(server); // functions.logMembers(server, member);

  // log daily userCount
  const dailyLog = () => {
    let now = new Date();
    let millisTill23 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 0) - now;
    if (millisTill23 < 0) millisTill23 += 86400000;
    setTimeout(() => {
      logger.info(`it\'s 23:59`);
      functions.logMemberCount(server);
      // functions.logMembers(server);
      dailyLog();
    }, millisTill23);
  }
  dailyLog();

  /****************
  * Check for contest Deadlines
  ****************/
  const checkContests = () => {
    let now = new Date();
    let hour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 01, 0) - now;
    // let hour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 01, 0) - now; // minutes
    if (hour < 0) hour += 3600000;
    // if (hour < 0) hour += 60000; // minutes
    setTimeout(() => {
      contestFunctions.checkStarttimes(client);
      contestFunctions.checkDeadlines(client);
      setTimeout(() => {
        contestFunctions.checkEndVoting(client);
      }, 5000);
      checkContests();
    }, hour);
  }
  checkContests();
});




client.on('messageReactionAdd', async (messageReaction, user) => {
  if (user.bot) return;
  console.log('manage reactions');
  contestFunctions.manageReactions(client, messageReaction, user);
});




client.on('message', async message => {
  if (message.guild === null || message.channel.type === 'dm') return;

  let found = message.content.match(/<a?:([^:]*):([^>]*)>/g);
  if (found != null) {
    for (let i = 0; i < found.length; i++) {
      let emote = found[i].match(/<a?:([^:]*):([^>]*)>/i);
      functions.logEmote(message, emote);
      // emote[0].startsWith('<a') ? functions.logEmote(message, emote, true) : functions.logEmote(message, emote);
    }
  }

  functions.logMembers(server, message.member);
  functions.logMessages(message);

  if (message.channel.name.toLowerCase() === 'rules' && message.member.roles.find(r => r.name === 'newcomer')) functions.checkAgree(server, message);
  if (message.channel.name.toLowerCase() === 'introduce-yourself') functions.checkIntroduction(server, message);

  let messageArray = message.content.split(/\s+/g);
  let command = messageArray[0];
  let args = messageArray.slice(1);

  if (command === '!pruneNewcomers') functions.insertPrune();

  if (command === 'checkStarttimes') contestFunctions.checkStarttimes(client);
  if (command === 'checkDeadlines') contestFunctions.checkDeadlines(client);
  if (command === 'checkEndVoting') contestFunctions.checkEndVoting(client);

  if (!command.startsWith(prefix)) return;

  let cmd = client.commands.get(command.slice(prefix.length));
  if (cmd) cmd.run(client, message, args, db);
});


client.on('guildMemberAdd', member => {
  functions.logMembers(server, member, false);
  functions.logMemberCount(server);
});
client.on('guildMemberRemove', member => {
  functions.logMembers(server, member, true);
  functions.logMemberCount(server);
});
client.on('guildMemberUpdate', (oldMember, newMember) => {
  functions.logMembers(server, newMember, false);
  functions.logRolechange(server, oldMember, newMember);
});
client.on('guildBanAdd', (guild, user) => {
  functions.logMemberBan(user, true);
});
client.on('guildBanRemove', (guild, user) => {
  functions.logMemberBan(user, false);
});

client.on('channelCreate', channel => {
  functions.logChannels(server, channel);
});
client.on('channelDelete', channel => {
  functions.logChannels(server, channel, true);
});
client.on('channelUpdate', (oldChannel, newChannel) => {
  if (newChannel.id === '581980129182613505' || newChannel.id === '581980094373822484' || newChannel.id === '598887260607217675' || newChannel.id === '581980156244131856') return;
  functions.logChannels(server, newChannel);
});

client.on('error', err => {
  logger.error(err, {logType: 'error', time: Date.now()});
  console.error(err);
});

// login
client.login(botsettings.token);
