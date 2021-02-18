const botsettings = require('./botsettings.json');
const config = require('./utility/config');

const Discord = require('discord.js');
const fs = require('fs');
const db = require('./utility/databaseconnection');
const logger = require('./utility/logger');
const logColor = require('./utility/logcolors');
const getDate = require('./utility/date');

// const bcrypt = require('bcryptjs');
// const password = botsettings.password;
// const salt = botsettings.salt;
// const hash = bcrypt.hashSync(password, salt);

const functions = require('./utility/functions');
const contestFunctions = require('./utility/contest');

const cheese = require('./apis/cheese');

const prefix = botsettings.prefix;

// get id's
const serverId = botsettings.serverId;
const contestChat = botsettings.contestChat;

const client = new Discord.Client({disableMentions: 'everyone'});
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
    // get aliases for commands
    if (props.help.alias) client.commands.set(props.help.alias, props);
	});
});





let server;

client.on('ready', async () => {
  server = client.guilds.cache.get(serverId);

  // fetch old messages in contest chat
  const contestChannel = client.channels.cache.get(contestChat);
  contestChannel.messages.fetch().then(msg => console.log('fetched old messages')).catch(err => {
    logger.error(err, {logType: 'error', time: Date.now()});
    throw err;
  });

  functions.logServerInfo(server);
  functions.logChannels(server);
  functions.logMemberCount(server);
  functions.logMembers(server);

  // log daily userCount at 23:59
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

  const dailyCheese = () => {
    let now = new Date();
    let millisTill10 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 00, 00, 0) - now;
    if (millisTill10 < 0) millisTill10 += 86400000;
    setTimeout(() => {
      logger.info(`it\'s 10:00`);
      cheese.postCheeseOfTheDay(client);
    }, millisTill10);
  }
  dailyCheese();

  /****************
  * Check for contest Deadlines
  ****************/
  const checkContests = () => {
    let now = new Date();
    let hour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 01, 0) - now;
    // let hour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 01, 0) - now; // minutes (for testing)

    if (hour < 0) hour += 3600000; // every hour
    // if (hour < 0) hour += 60000; // every minute (for testing)

    setTimeout(() => {
      console.log('check contest stuff');
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
  // don't do anything in dm's
  if (message.guild === null || message.channel.type === 'dm') return;

  // search for emotes in the message
  let found = message.content.match(/<a?:([^:]*):([^>]*)>/g);
  if (found != null) {
    let emotesInMessage = [];

    // if the message contains multiple of one emote log all of them
    for (let i = 0; i < found.length; i++) {
      let emote = found[i].match(/<a?:([^:]*):([^>]*)>/i);
      emotesInMessage.push(emote);
      // emote[0].startsWith('<a') ? functions.logEmote(message, emote, true) : functions.logEmote(message, emote);
    }

    const uniqueEmotesInMessage = emotesInMessage.reduce((acc, current) => {
    	const x = acc.find(item => item.input === current.input);
    	if (!x) {
    		return acc.concat([current]);
    	} else {
    		return acc
    	};
    }, []);

    uniqueEmotesInMessage.forEach(e => {
      functions.logEmote(message, e);
    });
  }

  functions.logMembers(server, message.member);
  functions.logMessages(message);

  // check for agree's and log them
  if (message.channel.name.toLowerCase() === 'rules' && message.member.roles.find(r => r.name === 'newcomer')) functions.checkAgree(server, message);
  // check for introduction messages
  if (message.channel.name.toLowerCase() === 'introduce-yourself') functions.checkIntroduction(server, message);

  let messageArray = message.content.split(/\s+/g);
  let command = messageArray[0];
  let args = messageArray.slice(1);

  // log the pruning by TOS Bot
  if (command === '!pruneNewcomers') functions.insertPrune();

  // manual commands for contest testing
  if (command === 'checkStarttimes') contestFunctions.checkStarttimes(client);
  if (command === 'checkDeadlines') contestFunctions.checkDeadlines(client);
  if (command === 'checkEndVoting') contestFunctions.checkEndVoting(client);

  // only run commands if the prefix is right
  if (!command.startsWith(prefix)) return;

  // search for the given command and run it
  let cmd = client.commands.get(command.slice(prefix.length));
  if (cmd) cmd.run(client, message, args, db);
});


// log new members
client.on('guildMemberAdd', member => {
  functions.logMembers(server, member, false);
  functions.logMemberCount(server);
});
// log leaving members
client.on('guildMemberRemove', member => {
  functions.logMembers(server, member, true);
  functions.logMemberCount(server);
});
// log members if something updates
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

// log new channels
client.on('channelCreate', channel => {
  functions.logChannels(server, channel);
});
// log deleted channels
client.on('channelDelete', channel => {
  functions.logChannels(server, channel, true);
});
// log updated channels
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
