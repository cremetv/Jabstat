const botsettings = require('./botsettings.json');
const Discord = require('discord.js');
const fs = require('fs');
const Database = require('./utility/database');
const config = require('./utility/config');
const winston = require('winston');

const functions = require('./utility/functions');

const prefix = botsettings.prefix;
const consoleLog = '\x1b[46m\x1b[30m%s\x1b[0m';

const jabrilID = '343771301405786113';

const client = new Discord.Client({disableEveryone: true});
client.commands = new Discord.Collection();

const getDate = () => {
  const d = new Date();
  const dateSimple = `${d.getDate()}.${d.getMonth()}.${d.getFullYear()}`;
  const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  return {
    dateSimple: dateSimple,
    date: date
  }
}

/****************
* Database Connection
****************/
const db = new Database(config);
db.execute = ( config, callback ) => {
    const database = new Database( config );
    return callback( database ).then(
        result => database.close().then( () => result ),
        err => database.close().then( () => { throw err; } )
    );
};


/****************
* Load Events
****************/
fs.readdir("./events/", (err, files) => {
  if (err) return console.error(err);
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
	if (err) return console.log(err);

	let jsfiles = files.filter(f => f.split('.').pop() === 'js');
	if (jsfiles.length <= 0) {
		console.log('No commands to load!');
		return;
	}

	console.log(`Loading ${jsfiles.length} commands!`);

	jsfiles.forEach((f, i) => {
		let props = require(`./cmds/${f}`);
		console.log(`${i + 1}: ${f} loaded!`);
		client.commands.set(props.help.name, props);
	});
});


/****************
* Logger
****************/
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}




let server;

client.on('ready', async () => {
  server = client.guilds.get(jabrilID);

  functions.logServerStats(server);
  server.channels.forEach(c => {
    functions.updateChannel(server, c);
  });
  functions.updateChannelDeleted(server);
  functions.logMemberCount(server);

  // log daily userCount
  let now = new Date();
  let millisTill23 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 0) - now;
  if (millisTill23 < 0) millisTill23 += 86400000;
  setTimeout(() => {
    logger.info(`${consoleLog} it\'s 23:59`);
    functions.logMemberCount(server);
  }, millisTill23);
});


client.on('message', async message => {
  const date = getDate();

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

// client.on('guildBanAdd', (guild, user) => {
//   functions.updateMemberBanned(user, 1);
// });
// client.on('guildBanRemove', (guild, user) => {
//   functions.updateMemberBanned(user, 0);
// });

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

// login
client.login(botsettings.token);
