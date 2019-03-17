const botsettings = require('./botsettings.json');
const Discord = require('discord.js');
const fs = require('fs');
const Database = require('./utility/database');
const config = require('./utility/config');
const winston = require('winston');

const prefix = botsettings.prefix;
const consoleLog = '\x1b[46m\x1b[30m%s\x1b[0m';
const consoleError = '\x1b[101m\x1b[30m %s \x1b[0m';
const consoleAdd = '\x1b[42m\x1b[30m + \x1b[0m %s';
const consoleUpdate = '\x1b[103m\x1b[30m | \x1b[0m %s';
const consoleRemove = '\x1b[101m\x1b[30m - \x1b[0m %s';

const loggerAdd = '\x1b[42m\x1b[30m + \x1b[0m';
const loggerUpdate = '\x1b[103m\x1b[30m | \x1b[0m';
const loggerRemove = '\x1b[101m\x1b[30m - \x1b[0m';

const client = new Discord.Client({disableEveryone: true});
client.commands = new Discord.Collection();

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
* Load Commands
****************/
fs.readdir('./cmds/', (err, files) => {
	if (err) console.log(consoleError, err);

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



/****************
* Ready
****************/
const logMemberCount = (server) => {
  const d = new Date();
  const dateSimple = `${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`;
  const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  // log global userCount
  db.execute(config, database => database.query(`SELECT * FROM jabmemberCount WHERE date = '${dateSimple}'`)
  .then(rows => {
    if (rows.length < 1) {
      // insert
      database.query(`
        INSERT INTO jabmemberCount (date, memberCount, updated)
        VALUES ('${dateSimple}', ${server.memberCount}, '${date}')`
      );
      logger.info(`${loggerAdd} Inserted memberCount ${dateSimple} into jabmemberCount @${date}`);
    } else {
      // update
      database.query(`UPDATE jabmemberCount SET memberCount = ${server.memberCount}, updated = '${date}' WHERE date = '${rows[0].date}'`);
      logger.info(`${loggerUpdate} Updated memberCount ${dateSimple} in jabmemberCount @${date}`);
    }
    return;
  }))
  .catch(err => {
    logger.error(err);
    throw err;
  });
} // logMemberCount


const logServerStats = (server) => {

  // DB general stats
  db.execute(config, database => database.query(`SELECT * FROM jabstats`)
  .then(rows => {
    if (rows.length < 1) {
      // insert
      database.query(`
        INSERT INTO jabstats (serverID, name, nameAcronym, memberCount, available, icon, iconURL, region, large, afkTimeout, ownerID, createdAt, createdTimestamp, explicitContentFilter, splash, splashURL, verified)
        VALUES ('${server.id}', '${server.name}', '${server.nameAcronym}', ${server.memberCount}, ${server.available}, '${server.icon}', '${server.iconURL}', '${server.region}', ${server.large}, ${server.afkTimeout}, '${server.ownerID}', '${server.createdAt}', '${server.createdTimestamp}', ${server.explicitContentFilter}, '${server.splash}', '${server.splashURL}', ${server.verified})
      `);
      logger.info(`${loggerAdd} Inserted serverStats`);
    } else {
      // update
      database.query(`
        UPDATE jabstats SET
          serverID = '${server.id}',
          name = '${server.name}',
          nameAcronym = '${server.nameAcronym}',
          memberCount = ${server.memberCount},
          available = ${server.available},
          icon = '${server.icon}',
          iconURL = '${server.iconURL}',
          region = '${server.region}',
          large = ${server.large},
          afkTimeout = ${server.afkTimeout},
          ownerID = '${server.ownerID}',
          createdAt = '${server.createdAt}',
          createdTimestamp = '${server.createdTimestamp}',
          explicitContentFilter = ${server.explicitContentFilter},
          splash = '${server.splash}',
          splashURL = '${server.splashURL}',
          verified = ${server.verified}
        WHERE id = ${rows[0].id}
      `);
      logger.info(`${loggerUpdate} Updated serverStats`);
    }
    return;
  }))
  .catch(err => {
    logger.error(err);
    throw err;
  });
} // logServerStats


const logChannels = (server) => {
  server.channels.forEach(c => {
    db.execute(config, database => database.query(`SELECT * FROM jabchannels WHERE channelID = '${c.id}'`)
    .then(rows => {
      if (c.topic == undefined) c.topic = '';
      if (c.nsfw == undefined) c.nsfw = false;
      if (c.lastMessageID == undefined) c.lastMessageID = '';
      if (rows.length < 1) {
        // insert
        database.query(`
          INSERT INTO jabchannels (channelID, name, position, type, topic, nsfw, lastMessageID)
          VALUES ('${c.id}', '${c.name}', ${c.position}, '${c.type}', '${c.topic}', ${c.nsfw}, '${c.lastMessageID}')`
        );
        logger.info(`${loggerAdd} Inserted ${c.name} into jabchannels`);
      } else {
        // update
        database.query(`
          UPDATE jabchannels SET
            channelID = '${c.id}',
            name = '${c.name}',
            position = ${c.position},
            type = '${c.type}',
            topic = '${c.topic}',
            nsfw = ${c.nsfw},
            lastMessageID = '${c.lastMessageID}'
          WHERE id = ${rows[0].id}
        `);
        logger.info(`${loggerUpdate} Updated ${c.name} in jabchannels`);
      }
      return;
    }))
    .catch(err => {
      logger.error(err);
      throw err;
    });
  });
} // logChannels

//
client.on('ready', async () => {
  console.log(consoleLog, `Bot is ready! ${client.user.username}`);
  logger.info(`Bot started | ${Date.now()}`);

  client.user.setActivity(`collecting stats`, "https://ice-creme.de");
  const server = client.guilds.get('343771301405786113');

  logServerStats(server);
  logChannels(server);

  // *********************
  db.execute(config, database => database.query(`SELECT * FROM jabchannels`)
  .then(rows => {

    rows.forEach(c => {
      let id = c.channelID;
      let channel = server.channels.get(id);
      if (!channel) {
        // set channel to deleted
        database.query(`
          UPDATE jabchannels SET deleted = true WHERE channelID = ${id}
        `);
        logger.info(`${loggerUpdate} Updated channel ${id} to deleted`);
      }
    });

  }))
  .catch(err => {
    logger.error(err);
    throw err;
  });
  // *********************

  // log daily userCount
  let now = new Date();
  let millisTill23 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 0) - now;
  if (millisTill23 < 0) {
       millisTill23 += 86400000; // it's after 23:59, try 23:59 tomorrow.
  }
  setTimeout(() => {
    console.log(consoleLog, 'it\'s 23:59');
    logger.info('it\'s 23:59');
    logMemberCount(server);
  }, millisTill23);
});



/****************
* Message
****************/
const logMember = (member, messageAmount) => {
  const d = new Date();
  const dateSimple = `${d.getDate()}.${d.getMonth()}.${d.getFullYear()}`;
  const date = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const nickname = member.nickname;

  if (!messageAmount) messageAmount = 0;

  db.execute(config, database => database.query(`SELECT * FROM jabusers WHERE userID = '${member.user.id}'`)
  .then(rows => {

    let nicknames = [];

    if (rows.length < 1) {
      if (nickname != null) nicknames.push(nickname);

      database.query(`
        INSERT INTO jabusers (userID, username, discriminator, nick, nicknames, avatar, bot, lastMessageID, messageCount, updated, status, deleted)
        VALUES ('${member.user.id}', '${member.user.username}', '${member.user.discriminator}', '${nickname}', '${nicknames}', '${member.user.avatar}', ${member.user.bot}, '${member.user.lastMessageID}', ${messageAmount}, '${date}', '${member.presence.status}', ${member.deleted})
      `);
      logger.info(`${loggerAdd} Inserted ${member.user.username}'s messageCount & infos into jabusers`);
    } else {
      let messageCount = parseInt(rows[0].messageCount) + messageAmount;
      nicknames = rows[0].nicknames.split(',');

      if (!nicknames.includes(nickname) && nickname != null) nicknames.push(nickname);

      database.query(`
        UPDATE jabusers SET username = '${member.user.username}', discriminator = '${member.user.discriminator}', nick = '${nickname}', nicknames = '${nicknames}', avatar = '${member.user.avatar}', bot = ${member.user.bot}, lastMessageID = '${member.user.lastMessageID}', messageCount = ${messageCount}, updated = '${date}', status = '${member.presence.status}', deleted = ${member.deleted} WHERE userID = ${member.user.id}
      `);
      logger.info(`${loggerUpdate} Updated ${member.user.username}'s messageCount & infos in jabusers`);
    }
  }))
  .catch(err => {
    logger.error(err);
    throw err;
  });

} // logMember


client.on('message', async message => {
  let messageArray = message.content.split(/\s+/g);
  let command = messageArray[0];
  let args = messageArray.slice(1);

  if (!command.startsWith(prefix)) return;

  let cmd = client.commands.get(command.slice(prefix.length));
  if (cmd) cmd.run(client, message, args, db);
});


client.on('message', async message => {
  // Database
  const server = client.guilds.get('343771301405786113');

  const d = new Date();
  const dateSimple = `${d.getDate()}.${d.getMonth()}.${d.getFullYear()}`;

  const date = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // log global messageCount
  db.execute(config, database => database.query(`SELECT * FROM jabmessageCount WHERE date = '${dateSimple}'`)
  .then(rows => {

    if (rows.length < 1) {
      // insert
      database.query(`
        INSERT INTO jabmessageCount (date, messageCount, updated)
        VALUES ('${dateSimple}', 1, '${date}')`
      );
      logger.info(`${loggerAdd} Inserted total messageCount ${dateSimple} into jabmesageCount @${date}`);
    } else {
      // update
      let messageCount = parseInt(rows[0].messageCount) + 1;

      database.query(`UPDATE jabmessageCount SET messageCount = ${messageCount}, updated = '${date}' WHERE date = '${rows[0].date}'`);
      logger.info(`${loggerUpdate} Updated total messageCount ${dateSimple} in jabmesageCount @${date}`);
    }
    return;
  }))
  .catch(err => {
    logger.error(err);
    throw err;
  });

  logMember(message.member, 1);
});



/****************
* Guild add/remove Member
****************/
client.on('guildMemberAdd', member => {
  const server = client.guilds.get('343771301405786113');
  console.log(consoleAdd, 'GUILD MEMBER ADD');

  logMember(member);
  logMemberCount(server);
});


client.on('guildMemberRemove', member => {
  const server = client.guilds.get('343771301405786113');
  console.log(consoleRemove, 'GUILD MEMBER REMOVE');
  console.log(member.user.username);

  // const nickname = member.nickname;
  // logMember(nickname, member.user, 0, false, 'left');
  logMember(member);
  logMemberCount(server);
});


/****************
* Guild Member update
****************/
client.on('guildMemberUpdate', (oldMember, newMember) => {
  const server = client.guilds.get('343771301405786113');
  // logMember(newMember.nickname, newMember.user, 0, true);
  logMember(newMember);
  logMemberCount(server);
});

// login
client.login(botsettings.token);
