const botsettings = require('./botsettings.json');
const Discord = require('discord.js');
const fs = require('fs');
const Database = require('./utility/database');
const config = require('./utility/config');
const winston = require('winston');

const prefix = botsettings.prefix;

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
	if (err) console.log(err);

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
client.on('ready', async () => {
  console.log('\x1b[32m%s\x1b[0m', `Bot is ready! ${client.user.username}`);
  client.user.setActivity(`collecting stats`, "https://ice-creme.de");

  const server = client.guilds.get('343771301405786113');

  // DB general stats
  db.execute(config, database => database.query(`SELECT * FROM jabstats`)
  .then(rows => {

    let query;
    if (rows.length < 1) {
      // insert
      query = database.query(`INSERT INTO jabstats (statName, statValue)
      VALUES
        ('serverID', '${server.id}'),
        ('name', '${server.name}'),
        ('memberCount', '${server.memberCount}'),
        ('available', '${server.available}'),
        ('icon', '${server.icon}'),
        ('region', '${server.region}'),
        ('large', '${server.large}'),
        ('afkTimeout', '${server.afkTimeout}'),
        ('ownerID', '${server.ownerID}')
      `);
    } else {
      // update
      query = database.query(`
        UPDATE jabstats
           SET statValue = CASE statName
                           WHEN 'serverID' THEN '${server.id}'
                           WHEN 'name' THEN '${server.name}'
                           WHEN 'memberCount' THEN '${server.memberCount}'
                           WHEN 'available' THEN '${server.available}'
                           WHEN 'icon' THEN '${server.icon}'
                           WHEN 'region' THEN '${server.region}'
                           WHEN 'large' THEN '${server.large}'
                           WHEN 'afkTimeout' THEN '${server.afkTimeout}'
                           WHEN 'ownerID' THEN '${server.ownerID}'
                           ELSE statValue
                           END
        WHERE statName IN('serverID', 'name', 'memberCount', 'available', 'icon', 'region', 'large', 'afkTimeout', 'ownerID')
      `);
    }
    return query;
  }))
  .catch(err => {
    logger.error(err);
    throw err;
  });


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
      }
      return;
    })
    .then(() => {
      return;
    }))
    .catch(err => {
      logger.error(err);
      throw err;
    });
  });



});



/****************
* Message
****************/
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
    let query;

    if (rows.length < 1) {
      // insert
      query = database.query(`
        INSERT INTO jabmessageCount (date, messageCount, updated)
        VALUES ('${dateSimple}', 1, '${date}')`
      );
    } else {
      // update
      let messageCount = parseInt(rows[0].messageCount) + 1;

      query = database.query(`UPDATE jabmessageCount SET messageCount = ${messageCount}, updated = '${date}' WHERE date = '${rows[0].date}'`);
    }
    return query;
  }))
  .catch(err => {
    logger.error(err);
    throw err;
  });


  // log user messageCount
  const author = message.author;
  db.execute(config, database => database.query(`SELECT * FROM jabusers WHERE userID = '${author.id}'`)
  .then(rows => {

    let query;
    if (rows.length < 1) {
      query = database.query(`
        INSERT INTO jabusers (userID, username, discriminator, avatar, bot, lastMessageID, messageCount, updated)
        VALUES ('${author.id}', '${author.username}', '${author.discriminator}', '${author.avatar}', ${author.bot}, '${author.lastMessageID}', 1, '${date}')
      `);
    } else {
      let messageCount = parseInt(rows[0].messageCount) + 1;
      query = database.query(`
        UPDATE jabusers SET username = '${author.username}', discriminator = '${author.discriminator}', avatar = '${author.avatar}', bot = ${author.bot}, lastMessageID = '${author.lastMessageID}', messageCount = ${messageCount}, updated = '${date}' WHERE userID = ${author.id}
      `);
    }

  }))
  .catch(err => {
    logger.error(err);
    throw err;
  });


});


// login
client.login(botsettings.token);
