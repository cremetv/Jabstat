const Database = require('./../utility/database');
const config = require('./../utility/config');
const winston = require('winston');

const consoleLog = '\x1b[46m\x1b[30m%s\x1b[0m';
const consoleError = '\x1b[101m\x1b[30m %s \x1b[0m';
const consoleAdd = '\x1b[42m\x1b[30m + \x1b[0m %s';
const consoleUpdate = '\x1b[103m\x1b[30m | \x1b[0m %s';
const consoleRemove = '\x1b[101m\x1b[30m - \x1b[0m %s';

const loggerAdd = '\x1b[42m\x1b[30m + \x1b[0m';
const loggerUpdate = '\x1b[103m\x1b[30m | \x1b[0m';
const loggerRemove = '\x1b[101m\x1b[30m - \x1b[0m';

const getDate = () => {
  const d = new Date();
  const dateSimple = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
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

module.exports = {

  /*************
  * Member count
  *************/
  logMemberCount: (server) => {
    const date = getDate();
    db.execute(config, database => database.query(`SELECT * FROM jabmemberCount WHERE date = '${date.dateSimple}'`)
    .then(rows => {
      if (rows.length < 1) {
        database.query(`
          INSERT INTO jabmemberCount (date, memberCount, updated)
          VALUES ('${date.dateSimple}', ${server.memberCount}, '${date.date}')`
        );
        logger.info(`${loggerAdd} Inserted memberCount ${date.dateSimple} into jabmemberCount @${date.date}`);
      } else {
        database.query(`UPDATE jabmemberCount SET memberCount = ${server.memberCount}, updated = '${date.date}' WHERE date = '${rows[0].date}'`);
        logger.info(`${loggerUpdate} Updated memberCount ${date.dateSimple} in jabmemberCount @${date.date}`);
      }
      return;
    }))
    .catch(err => {
      logger.error(err);
      throw err;
    });
  },


  /*************
  * general server stats
  *************/
  logServerStats: (server) => {
    db.execute(config, database => database.query(`SELECT * FROM jabstats`)
    .then(rows => {
      if (rows.length < 1) {
        database.query(`
          INSERT INTO jabstats (serverID, name, nameAcronym, memberCount, available, icon, iconURL, region, large, afkTimeout, ownerID, createdAt, createdTimestamp, explicitContentFilter, splash, splashURL, verified)
          VALUES ('${server.id}', '${server.name}', '${server.nameAcronym}', ${server.memberCount}, ${server.available}, '${server.icon}', '${server.iconURL}', '${server.region}', ${server.large}, ${server.afkTimeout}, '${server.ownerID}', '${server.createdAt}', '${server.createdTimestamp}', ${server.explicitContentFilter}, '${server.splash}', '${server.splashURL}', ${server.verified})
        `);
        logger.info(`${loggerAdd} Inserted serverStats`);
      } else {
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
  },


  /*************
  * Channels
  *************/
  updateChannel: (server, channel, status) => {
    const date = getDate();

    db.execute(config, database => database.query(`SELECT * FROM jabchannels WHERE channelID = '${channel.id}'`)
    .then(rows => {
      if (channel.topic == undefined) channel.topic = '';
      if (channel.nsfw == undefined) channel.nsfw = false;
      if (channel.lastMessageID == undefined) channel.lastMessageID = '';
      if (rows.length < 1) {
        database.query(`
          INSERT INTO jabchannels (channelID, name, position, type, topic, nsfw, lastMessageID, updated)
          VALUES ('${channel.id}', '${channel.name}', ${channel.position}, '${channel.type}', '${channel.topic}', ${channel.nsfw}, '${channel.lastMessageID}', '${date.date}')
        `);
        logger.info(`${loggerAdd} Inserted ${channel.name} into jabchannels`);
      } else {
        database.query(`
          UPDATE jabchannels SET
            channelID = '${channel.id}',
            name = '${channel.name}',
            position = ${channel.position},
            type = '${channel.type}',
            topic = '${channel.topic}',
            nsfw = ${channel.nsfw},
            lastMessageID = '${channel.lastMessageID}',
            updated = '${date.date}'
          WHERE id = ${rows[0].id}
        `);
        logger.info(`${loggerUpdate} Updated ${channel.name} in jabchannels`);
      }
      return rows;
    })
    .then((rows) => {
      let serverChannel = server.channels.get(channel.id);
      if (status == 'remove' || !serverChannel) {
        database.query(`
          UPDATE jabchannels SET
            updated = '${date.date}',
            deleted = 1
          WHERE id = ${rows[0].id}
        `);
        logger.info(`${loggerUpdate}${loggerRemove} Updated channel ${channel.name} to deleted`);
      }
      return;
    }))
    .catch(err => {
      logger.error(err);
      throw err;
    });
  },


  /*************
  * update channels to deleted
  *************/
  updateChannelDeleted: (server) => {
    db.execute(config, database => database.query(`SELECT * FROM jabchannels`)
    .then(rows => {
      rows.forEach((c, i) => {
        let id = c.channelID;
        let channel = server.channels.get(id);
        if (!channel && rows[i]['deleted'] != 1) {
          database.query(`UPDATE jabchannels SET deleted = true WHERE channelID = ${id}`);
          logger.info(`${loggerUpdate}${loggerRemove} Updated channel ${id} to deleted`);
        }
      });
    }))
    .catch(err => {
      logger.error(err);
      throw err;
    });
  },


  /*************
  * Member
  *************/
  logMember: (member, messageAmount) => {
    const date = getDate();

    const nickname = member.nickname;

    if (!messageAmount) messageAmount = 0;

    db.execute(config, database => database.query(`SELECT * FROM jabusers WHERE userID = '${member.user.id}'`)
    .then(rows => {

      let nicknames = [];

      if (rows.length < 1) {
        if (nickname != null) nicknames.push(nickname);

        database.query(`
          INSERT INTO jabusers (userID, username, discriminator, nick, nicknames, avatar, bot, lastMessageID, messageCount, updated, status, deleted, banned)
          VALUES ('${member.user.id}', '${member.user.username}', '${member.user.discriminator}', '${nickname}', '${nicknames}', '${member.user.avatar}', ${member.user.bot}, '${member.user.lastMessageID}', ${messageAmount}, '${date.date}', '${member.presence.status}', ${member.deleted}, 0)
        `);
        logger.info(`${loggerAdd} Inserted ${member.user.username}'s messageCount & infos into jabusers`);
      } else {
        let messageCount = parseInt(rows[0].messageCount) + messageAmount;
        nicknames = rows[0].nicknames.split(',');

        if (!nicknames.includes(nickname) && nickname != null) nicknames.push(nickname);

        database.query(`
          UPDATE jabusers SET username = '${member.user.username}', discriminator = '${member.user.discriminator}', nick = '${nickname}', nicknames = '${nicknames}', avatar = '${member.user.avatar}', bot = ${member.user.bot}, lastMessageID = '${member.user.lastMessageID}', messageCount = ${messageCount}, updated = '${date.date}', status = '${member.presence.status}', deleted = ${member.deleted}, banned = 0 WHERE userID = ${member.user.id}
        `);
        logger.info(`${loggerUpdate} Updated ${member.user.username}'s messageCount & infos in jabusers`);
      }
    }))
    .catch(err => {
      logger.error(err);
      throw err;
    });
  },


  updateMemberBanned: (user, banned) => {
    const date = getDate();
    const nickname = null;

    let consoleText = 'unbanned';
    if (banned) consoleText = 'banned';

    db.execute(config, database => database.query(`SELECT * FROM jabusers WHERE userID = '${user.id}'`)
    .then(rows => {
      let nicknames = [];
      if (rows.length < 1) {
        if (nickname != null) nicknames.push(nickname);
        database.query(`
          INSERT INTO jabusers (userID, username, discriminator, nick, nicknames, avatar, bot, lastMessageID, messageCount, updated, status, deleted, banned)
          VALUES ('${user.id}', '${user.username}', '${user.discriminator}', '${nickname}', '${nicknames}', '${user.avatar}', ${user.bot}, '${user.lastMessageID}', 0, '${date.date}', 'offline', 1, ${banned})
        `);
        logger.info(`${loggerAdd} Inserted banned ${user.username}'s infos into jabusers`);
      } else {
        let messageCount = parseInt(rows[0].messageCount);
        nicknames = rows[0].nicknames.split(',');

        if (!nicknames.includes(nickname) && nickname != null) nicknames.push(nickname);

        database.query(`
          UPDATE jabusers SET username = '${user.username}', discriminator = '${user.discriminator}', nick = '${nickname}', nicknames = '${nicknames}', avatar = '${user.avatar}', bot = ${user.bot}, lastMessageID = '${user.lastMessageID}', messageCount = ${messageCount}, updated = '${date.date}', status = 'offline', deleted = 1, banned = ${banned} WHERE userID = ${user.id}
        `);
        logger.info(`${loggerUpdate} Updated banned ${user.username}'s infos in jabusers`);
      }
    }))
    .catch(err => {
      logger.error(err);
      throw err;
    });
  },


  /*************
  * total message count
  *************/
  logMessageCount: () => {
    const date = getDate();

    db.execute(config, database => database.query(`SELECT * FROM jabmessageCount WHERE date = '${date.dateSimple}'`)
    .then(rows => {

      if (rows.length < 1) {
        database.query(`
          INSERT INTO jabmessageCount (date, messageCount, updated)
          VALUES ('${date.dateSimple}', 1, '${date.date}')`
        );
        logger.info(`${loggerAdd} Inserted total messageCount ${date.dateSimple} into jabmesageCount @${date.date}`);
      } else {
        let messageCount = parseInt(rows[0].messageCount) + 1;

        database.query(`UPDATE jabmessageCount SET messageCount = ${messageCount}, updated = '${date.date}' WHERE date = '${rows[0].date}'`);
        logger.info(`${loggerUpdate} Updated total messageCount ${date.dateSimple} in jabmesageCount @${date.date}`);
      }
      return;
    }))
    .catch(err => {
      logger.error(err);
      throw err;
    });
  }



  /*************
  *
  *************/
}
