const config = require('./../utility/config');
const db = require('./../utility/databaseconnection');
const logger = require('./../utility/logger');
const logColor = require('./../utility/logcolors');
const getDate = require('./../utility/date');

function mysql_real_escape_string (str) {
  if (!str) str = '';
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
        }
    });
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
        logger.info(`${logColor.logAdd} Inserted memberCount ${date.dateSimple} into jabmemberCount @${date.date}`, {logType: 'addRow', time: Date.now()});
      } else {
        database.query(`UPDATE jabmemberCount SET memberCount = ${server.memberCount}, updated = '${date.date}' WHERE date = '${rows[0].date}'`);
        logger.info(`${logColor.logUpdate} Updated memberCount ${date.dateSimple} in jabmemberCount @${date.date}`, {logType: 'updateRow', time: Date.now()});
      }
      return;
    }))
    .catch(err => {
      logger.error(err, {logType: 'error', time: Date.now()});
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
          VALUES ('${server.id}', '${mysql_real_escape_string(server.name)}', '${server.nameAcronym}', ${server.memberCount}, ${server.available}, '${server.icon}', '${server.iconURL}', '${server.region}', ${server.large}, ${server.afkTimeout}, '${server.ownerID}', '${server.createdAt}', '${server.createdTimestamp}', ${server.explicitContentFilter}, '${server.splash}', '${server.splashURL}', ${server.verified})
        `);
        logger.info(`${logColor.logAdd} Inserted serverStats`, {logType: 'addRow', time: Date.now()});
      } else {
        database.query(`
          UPDATE jabstats SET
            serverID = '${server.id}',
            name = '${mysql_real_escape_string(server.name)}',
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
        logger.info(`${logColor.logUpdate} Updated serverStats`, {logType: 'updateRow', time: Date.now()});
      }
      return;
    }))
    .catch(err => {
      logger.error(err, {logType: 'error', time: Date.now()});
      throw err;
    });
  },


  /*************
  * Channels
  *************/
  updateChannel: (server, channel, status) => {
    const date = getDate();

    if (channel.type === 'dm') return;

    // ignore some Channels
    if (channel.id == '489143518716100629' || channel.id == '489146748720119818' || channel.id == '489146790482935808' || channel.id == '581980094373822484' || channel.id == '581980129182613505' || channel.id == '484167556303683585' || channel.id == '581980156244131856') return;

    db.execute(config, database => database.query(`SELECT * FROM jabchannels WHERE channelID = '${channel.id}'`)
    .then(rows => {
      if (channel.topic == undefined) channel.topic = '';
      if (channel.nsfw == undefined) channel.nsfw = false;
      if (channel.lastMessageID == undefined) channel.lastMessageID = '';
      if (rows.length < 1) {
        database.query(`
          INSERT INTO jabchannels (channelID, name, position, type, topic, nsfw, lastMessageID, updated)
          VALUES ('${channel.id}', '${mysql_real_escape_string(channel.name)}', ${channel.position}, '${channel.type}', '${mysql_real_escape_string(channel.topic)}', ${channel.nsfw}, '${channel.lastMessageID}', '${date.date}')
        `);
        logger.info(`${logColor.logAdd} Inserted ${channel.name} into jabchannels`, {logType: 'addRow', time: Date.now()});
      } else {
        database.query(`
          UPDATE jabchannels SET
            channelID = '${channel.id}',
            name = '${mysql_real_escape_string(channel.name)}',
            position = ${channel.position},
            type = '${channel.type}',
            topic = '${mysql_real_escape_string(channel.topic)}',
            nsfw = ${channel.nsfw},
            lastMessageID = '${channel.lastMessageID}',
            updated = '${date.date}'
          WHERE id = ${rows[0].id}
        `);
        logger.info(`${logColor.logUpdate} Updated ${channel.name} in jabchannels`, {logType: 'updateRow', time: Date.now()});
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
        logger.info(`${logColor.logUpdate}${logColor.logRemove} Updated channel ${channel.name} to deleted`, {logType: 'updateRow', time: Date.now()});
      }
      return;
    }))
    .catch(err => {
      logger.error(err, {logType: 'error', time: Date.now()});
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
          logger.info(`${logColor.logUpdate}${logColor.logRemove} Updated channel ${id} to deleted`, {logType: 'updateRow', time: Date.now()});
        }
      });
    }))
    .catch(err => {
      logger.error(err, {logType: 'error', time: Date.now()});
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
          '${mysql_real_escape_string(member.user.username)}',
          '${member.user.discriminator}',
          '${mysql_real_escape_string(nickname)}',
          '${nicknames}',
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
        logger.info(`${logColor.logAdd} Inserted ${member.user.username}'s messageCount & infos into jabusers`, {logType: 'addRow', time: Date.now()});
      } else {
        let messageCount = parseInt(rows[0].messageCount) + messageAmount;
        nicknames = rows[0].nicknames.split(',');

        if (!nicknames.includes(nickname) && nickname != null) nicknames.push(nickname);

        database.query(`
          UPDATE jabusers SET
            username = '${mysql_real_escape_string(member.user.username)}',
            discriminator = '${member.user.discriminator}',
            nick = '${mysql_real_escape_string(nickname)}',
            nicknames = '${nicknames}',
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
        logger.info(`${logColor.logUpdate} Updated ${member.user.username}'s messageCount & infos in jabusers`, {logType: 'updateRow', time: Date.now()});
      }
    }))
    .catch(err => {
      logger.error(err, {logType: 'error', time: Date.now()});
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
          '${mysql_real_escape_string(user.username)}',
          '${user.discriminator}',
          '${mysql_real_escape_string(nickname)}',
          '${nicknames}',
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
        logger.info(`${logColor.logAdd} Inserted banned ${user.username}'s infos into jabusers`, {logType: 'addRow', time: Date.now()});
      } else {
        let messageCount = parseInt(rows[0].messageCount);
        nicknames = rows[0].nicknames.split(',');

        if (!nicknames.includes(nickname) && nickname != null) nicknames.push(nickname);

        database.query(`
          UPDATE jabusers SET
            username = '${mysql_real_escape_string(user.username)}',
            discriminator = '${user.discriminator}',
            nick = '${mysql_real_escape_string(nickname)}',
            nicknames = '${nicknames}',
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
        logger.info(`${logColor.logUpdate} Updated banned ${user.username}'s infos in jabusers`, {logType: 'updateRow', time: Date.now()});
      }
    }))
    .catch(err => {
      logger.error(err, {logType: 'error', time: Date.now()});
      throw err;
    });
  },


  /*************
  * total message count
  *************/
  logMessageCount: (message) => {
    if (message.guild === null) return;

    const date = getDate();
    const userID = message.member.id;

    db.execute(config, database => database.query(`SELECT * FROM jabmessageCount WHERE date = '${date.dateSimple}'`)
    .then(rows => {

      if (rows.length < 1) {
        database.query(`
          INSERT INTO jabmessageCount (date, messageCount, updated)
          VALUES ('${date.dateSimple}', 1, '${date.date}')`
        );
        logger.info(`${logColor.logAdd} Inserted total messageCount ${date.dateSimple} into jabmesageCount @${date.date}`, {logType: 'addRow', time: Date.now()});
      } else {
        let messageCount = parseInt(rows[0].messageCount) + 1;

        database.query(`UPDATE jabmessageCount SET messageCount = ${messageCount}, updated = '${date.date}' WHERE date = '${rows[0].date}'`);
        logger.info(`${logColor.logUpdate} Updated total messageCount ${date.dateSimple} in jabmesageCount @${date.date}`, {logType: 'updateRow', time: Date.now()});
      }
      return;
    }))
    .catch(err => {
      logger.error(err, {logType: 'error', time: Date.now()});
      throw err;
    });


    db.execute(config, database => database.query(`SELECT * FROM jabuserMessageCount WHERE userID = '${userID}' AND date = '${date.dateSimple}'`)
    .then(rows => {

      if (rows.length < 1) {
        database.query(`
          INSERT INTO jabuserMessageCount (date, userID, messageCount, updated)
          VALUES ('${date.dateSimple}', '${userID}', 1, '${date.date}')`
        );
        logger.info(`${logColor.logAdd} Inserted messageCount ${date.dateSimple} for ${message.member.user.username} into jabuserMessageCount @${date.date}`, {logType: 'addRow', time: Date.now()});
      } else {
        let messageCount = parseInt(rows[0].messageCount) + 1;

        database.query(`UPDATE jabuserMessageCount SET messageCount = ${messageCount}, updated = '${date.date}' WHERE userID = '${userID}' AND date = '${rows[0].date}'`);
        logger.info(`${logColor.logUpdate} Updated messageCount ${date.dateSimple} for ${message.member.user.username} in jabuserMessageCount @${date.date}`, {logType: 'updateRow', time: Date.now()});
      }
      return;
    }))
    .catch(err => {
      logger.error(err, {logType: 'error', time: Date.now()});
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
          logger.info(`${logColor.logAdd} Inserted ${emote[1]} emote into jabmotes @${date.date}`, {logType: 'addRow', time: Date.now()});
        } else {
          console.log('already exist');
          emoteID = rows[0].id;
          res(emoteID);
        }
      }))
      .catch(err => {
        logger.error(err, {logType: 'error', time: Date.now()});
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
          logger.info(`${logColor.logAdd} Inserted emotecount for emote ${emote[1]} - ${date.dateSimple} for ${message.member.user.username} into jabmotesCount @${date.date}`, {logType: 'addRow', time: Date.now()});
        } else {
          let count = parseInt(rows[0].count) + 1;

          database.query(`UPDATE jabmotesCount SET count = ${count}, updated = '${date.date}' WHERE userID = '${userID}' AND date = '${rows[0].date}' AND emoteID = ${emoteID}`);
          logger.info(`${logColor.logUpdate} Updated emotecount for emote ${emote[1]} - ${date.dateSimple} for ${message.member.user.username} in jabmotesCount @${date.date}`, {logType: 'updateRow', time: Date.now()});
        }
        return;
      }))
      .catch(err => {
        logger.error(err, {logType: 'error', time: Date.now()});
        throw err;
      });

      console.log('=========================');
    }, err => {
      logger.error(err, {logType: 'error', time: Date.now()});
      console.log(err);
    });
  }



  /*************
  *
  *************/
}
