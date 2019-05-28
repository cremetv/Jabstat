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

    // ignore some Channels
    if (channel.id == '489143518716100629' || channel.id == '489146748720119818' || channel.id == '489146790482935808' || channel.id == '581980094373822484' || channel.id == '581980129182613505' || channel.id == '484167556303683585') return;

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
          INSERT INTO jabusers (userID,
            username,
            discriminator,
            nick,
            nicknames,
            avatar,
            avatarURL,
            displayColor,
            displayHexColor,
            bot,
            createdAt,
            createdTimestamp,
            lastMessageID,
            messageCount,
            updated,
            status,
            game,
            deleted,
            banned)
          VALUES ('${member.user.id}',
          STRING_ESCAPE('${member.user.username}'),
          '${member.user.discriminator}',
          STRING_ESCAPE('${nickname}'),
          STRING_ESCAPE('${nicknames}'),
          '${member.user.avatar}',
          '${member.user.avatarURL}',
          ${member.displayColor},
          '${member.displayHexColor}',
          ${member.user.bot},
          '${member.user.createdAt}',
          '${member.user.createdTimestamp}',
          '${member.user.lastMessageID}',
          ${messageAmount},
          '${date.date}',
          '${member.presence.status}',
          '${member.presence.game}',
          ${member.deleted},
          0)
        `);
        logger.info(`${loggerAdd} Inserted ${member.user.username}'s messageCount & infos into jabusers`);
      } else {
        let messageCount = parseInt(rows[0].messageCount) + messageAmount;
        nicknames = rows[0].nicknames.split(',');

        if (!nicknames.includes(nickname) && nickname != null) nicknames.push(nickname);

        database.query(`
          UPDATE jabusers SET
            username = STRING_ESCAPE('${member.user.username}'),
            discriminator = '${member.user.discriminator}',
            nick = STRING_ESCAPE('${nickname}'),
            nicknames = STRING_ESCAPE('${nicknames}'),
            avatar = '${member.user.avatar}',
            avatarURL = '${member.user.avatarURL}',
            displayColor = ${member.displayColor},
            displayHexColor = '${member.displayHexColor}',
            bot = ${member.user.bot},
            createdAt = '${member.user.createdAt}',
            createdTimestamp = '${member.user.createdTimestamp}',
            lastMessageID = '${member.user.lastMessageID}',
            messageCount = ${messageCount},
            updated = '${date.date}',
            status = '${member.presence.status}',
            game = '${member.presence.game}',
            deleted = ${member.deleted},
            banned = 0
          WHERE userID = ${member.user.id}
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
          INSERT INTO jabusers
          (userID,
            username,
            discriminator,
            nick,
            nicknames,
            avatar,
            avatarURL,
            bot,
            createdAt,
            createdTimestamp,
            lastMessageID,
            messageCount,
            updated,
            status,
            deleted,
            banned)
          VALUES ('${user.id}',
          STRING_ESCAPE('${user.username}'),
          '${user.discriminator}',
          STRING_ESCAPE('${nickname}'),
          STRING_ESCAPE('${nicknames}'),
          '${user.avatar}',
          '${user.avatarURL}',
          ${user.bot},
          '${user.createdAt}',
          '${user.createdTimestamp}',
          '${user.lastMessageID}',
          0,
          '${date.date}',
          'offline',
          1,
          ${banned})
        `);
        logger.info(`${loggerAdd} Inserted banned ${user.username}'s infos into jabusers`);
      } else {
        let messageCount = parseInt(rows[0].messageCount);
        nicknames = rows[0].nicknames.split(',');

        if (!nicknames.includes(nickname) && nickname != null) nicknames.push(nickname);

        database.query(`
          UPDATE jabusers SET
            username = STRING_ESCAPE('${user.username}'),
            discriminator = '${user.discriminator}',
            nick = STRING_ESCAPE('${nickname}'),
            nicknames = STRING_ESCAPE('${nicknames}'),
            avatar = '${user.avatar}',
            avatarURL = '${user.avatarURL}',
            bot = ${user.bot},
            createdAt = '${user.createdAt}',
            createdTimestamp = '${user.createdTimestamp}',
            lastMessageID = '${user.lastMessageID}',
            messageCount = ${messageCount},
            updated = '${date.date}',
            status = 'offline',
            deleted = 1,
            banned = ${banned}
          WHERE userID = ${user.id}
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
  logMessageCount: (message) => {
    const date = getDate();
    const userID = message.member.id;

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


    db.execute(config, database => database.query(`SELECT * FROM jabuserMessageCount WHERE userID = '${userID}' AND date = '${date.dateSimple}'`)
    .then(rows => {

      if (rows.length < 1) {
        database.query(`
          INSERT INTO jabuserMessageCount (date, userID, messageCount, updated)
          VALUES ('${date.dateSimple}', '${userID}', 1, '${date.date}')`
        );
        logger.info(`${loggerAdd} Inserted messageCount ${date.dateSimple} for ${message.member.user.username} into jabuserMessageCount @${date.date}`);
      } else {
        let messageCount = parseInt(rows[0].messageCount) + 1;

        database.query(`UPDATE jabuserMessageCount SET messageCount = ${messageCount}, updated = '${date.date}' WHERE userID = '${userID}' AND date = '${rows[0].date}'`);
        logger.info(`${loggerUpdate} Updated messageCount ${date.dateSimple} for ${message.member.user.username} in jabuserMessageCount @${date.date}`);
      }
      return;
    }))
    .catch(err => {
      logger.error(err);
      throw err;
    });
  },



  logEmote: (message, emote, animated) => {
    const date = getDate();
    (animated === undefined) ? animated = false : null;
    let emoteID;
    const userID = message.member.id;
    console.log('=========================');

    const checkEmote = new Promise(function(res, rej) {
      db.execute(config, database => database.query(`SELECT * FROM jabmotes WHERE emoteID = '${emote[2]}'`)
      .then(rows => {

        if (rows.length < 1) {
          console.log('doesnt exist');
          database.query(`
            INSERT INTO jabmotes (name, emoteID, animated, updated)
            VALUES ('${emote[1]}', '${emote[2]}', ${animated}, '${date.date}')`
          ).then(result => {
            console.log('result: ' + result.insertId);
            emoteID = result.insertId;
            res(emoteID);
          });
          logger.info(`${loggerAdd} Inserted ${emote[1]} emote into jabmotes @${date.date}`);
        } else {
          console.log('already exist');
          emoteID = rows[0].id;
          res(emoteID);
        }
      }))
      .catch(err => {
        logger.error(err);
        throw err;
      });
    });

    checkEmote.then(emoteID => {
      console.log('emoteid: ' + emoteID);

      db.execute(config, database => database.query(`SELECT * FROM jabmotesCount WHERE userID = '${userID}' AND date = '${date.dateSimple}' AND emoteID = ${emoteID}`)
      .then(rows => {

        if (rows.length < 1) {
          database.query(`
            INSERT INTO jabmotesCount (date, userID, emoteID, count, updated)
            VALUES ('${date.dateSimple}', '${userID}', ${emoteID}, 1, '${date.date}')`
          );
          logger.info(`${loggerAdd} Inserted emotecount for emote ${emote[1]} - ${date.dateSimple} for ${message.member.user.username} into jabmotesCount @${date.date}`);
        } else {
          let count = parseInt(rows[0].count) + 1;

          database.query(`UPDATE jabmotesCount SET count = ${count}, updated = '${date.date}' WHERE userID = '${userID}' AND date = '${rows[0].date}' AND emoteID = ${emoteID}`);
          logger.info(`${loggerUpdate} Updated emotecount for emote ${emote[1]} - ${date.dateSimple} for ${message.member.user.username} in jabmotesCount @${date.date}`);
        }
        return;
      }))
      .catch(err => {
        logger.error(err);
        throw err;
      });

      console.log('=========================');
    }, err => {
      logger.error(err);
      console.log(err);
    });
  }



  /*************
  *
  *************/
}
