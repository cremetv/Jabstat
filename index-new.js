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

const client = new Discord.Client({disableEveryone: true});
client.commands = new Discord.Collection();

const web = require('./utility/web');


/****************
* Load Events
****************/
fs.readdir('./events', (err, files) => {
  if (err) {
    logger.error(err, {logType: 'error', time: Date.now()});
    console.error(err);
    return;
  }

  files.forEach(file => {
    const event = requre(`./events/${file}`);
    let eventName = file.split('.')[0];
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
    if (props.help.alias) {
      client.commands.set(props.help.alias, props);
    }
  });
});



let server;

client.on('ready', async () => {
  server = client.guilds.get(jabrilID);

  const contestChannel = client.channels.get(selectedServer);
  contestChannel.fetchMessages()
    .then(msg => console.log('fetched old messages'))
    .catch(err => {
      logger.error(err, {logType: 'error', time: Date.now()});
      throw err;
    });

  functions.logServerStats(server);
  server.channels.forEach(c => {
    functions.updateChannel(server, c);
  });
  functions.updateChannelDeleted(server);
  functions.logMemberCount(server);

  // log daily userCount
  const dailyLog = () => {
    let now = new Date();
    let millisTill23 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 0) - now;
    if (millisTill23 < 0) millisTill23 += 86400000;
    setTimeout(() => {
      logger.info(`it\'s 23:59`);
      functions.logMemberCount(server);
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
    if (hour < 0) hour += 3600000;

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


  // store passwords
  db.execute(config, database => database.query(`SELECT * FROM passwords`)
  .then(rows => {
    if (rows.length < 1) {

      db.execute(config, database => database.query(`INSERT INTO passwords (hash) VALUES ('${hash}')`)
      .then(rows => {
        logger.info(`${logColor.green}stored password hash in database${logColor.clear}`, {logType: 'log', time: Date.now()});
      }))
      .catch(err => {
        throw err;
      });
    } else {
      logger.info(`${logColor.yellow}hash already stored${logColor.clear}`, {logType: 'warning', time: Date.now()});
      let dbHash = rows[0].hash;

      if (dbHash != hash) {
        logger.info(`${logColor.yellow}hash not the same${logColor.clear}`, {logType: 'warning', time: Date.now()});
        db.execute(config, database => database.query(`UPDATE passwords SET hash = '${hash}' WHERE id = 1`)
        .then(rows => {
          logger.info(`${logColor.green}updated password hash in database${logColor.clear}`, {logType: 'log', time: Date.now()});
        }))
        .catch(err => {
          throw err;
        });
      }
    }
  }))
  .catch(err => {
    throw err;
  });
});



client.on('messageReactionAdd', async (messageReaction, user) => {
  if (user.bot) return;
  contestFunctions.manageReactions(client, messageReaction, user);
});



client.on('message', async message => {
  if (message.guild === null || message.channel.type === 'dm') return;
  // check for emotes in message
  let found = message.content.match(/<a?:([^:]*):([^>]*)>/g);

  if (found != null) {
    for (let i = 0; i < found.length; i++) {
      let emote = found[i].match(/<a?:([^:]*):([^>]*)>/i);
      emote[0].startsWith('<a') ? functions.logEmote(message, emote, true) : functions.logEmote(message, emote);
    }
  }


  // check newcomers
  // let keywords = ['hello', 'hi', 'hey', 'i am', 'i\'m', 'years old', 'yo', 'new to programming', 'i want to learn', 'currently learning', 'self taught', 'learning', 'teaching myself'];
  // const checkInput = () => {
  // 	let str = input.value;
  //
  // 	console.log(`message: ${str}`);
  //
  // 	let prob = 0.0;
  //
  // 	keywords.forEach(word => {
  // 		var regex = new RegExp(`\\b${word}\\b`, 'g');
  // 		if (str.toLowerCase().match(regex)) prob += 0.25;
  // 	});
  //
  // 	console.log(`Intro prob:`, prob);
  // 	if (prob >= 0.5) {
  // 		console.log('is an introduction');
  // 	}
  // }


  functions.logMessageCount(message);
  functions.logMember(message.member, 1);

  let messageArray = message.content.split(/\s+/g);
  let command = messageArray[0];
  let args = messageArray.slice(1);

  if (!command.startsWith(prefix)) return;

  let cmd = client.commands.get(command.slice(prefix.length));
  if (cmd) cmd.run(client, message, args, db);
});



client.on('channelCreate', channel => {
  functions.updateChannel(server, channel, 'create');
});
client.on('channelDelete', channel => {
  functions.updateChannel(server, channel, 'remove');
});
client.on('channelUpdate', channel => {
  functions.updateChannel(server, channel, 'update');
});


client.on('guildMemberAdd', member => {
  functions.logMember(member);
  functions.logMemberCount(server);
});


client.on('guildMemberRemove', member => {
  functions.logMember(member);
  functions.logMemberCount(server);
});


client.on('guildMemberUpdate', (oldMember, newMember) => {
  functions.logMember(newMember);
  functions.logMemberCount(server);
});

client.on('error', err => {
  logger.error(err, {logType: 'error', time: Date.now()});
  console.error(err);
});

// login
client.login(botsettings.token);
