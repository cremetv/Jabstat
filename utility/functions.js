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
    db.execute(config, database => database.query(`INSERT INTO stat_memberCount (memberCount, date, updated) VALUES(${server.memberCount}, '${date.dateSimple}', '${date.date}')
                                                    ON DUPLICATE KEY UPDATE memberCount = ${server.memberCount}, updated = '${date.date}'`)
    .then(rows => {
      logger.info(`${logColor.logUpdate} updated memberCount ${date.dateSimple} @${date.date}`, {logType: 'updateRow', time: Date.now()});
    }))
    .catch(err => {
      logger.error(err, {logType: 'error', time: Date.now()});
      throw err;
    });
  },




  /*************
  * Member
  *************/
  logMembers: (server, member, status) => {
    const date = getDate();
    let targets = member ? [member] : server.members;
    if (!status) status = false;

    targets.forEach(target => {
      let roles = [];
      target.roles.forEach(role => {
        roles.push(role.name);
      });

      let game;
      if (target.user.presence.game === null) {
        game = '';
      } else {
        game = mysql_real_escape_string(target.user.presence.game.name);
      }

      db.execute(config, database => database.query(`INSERT INTO stat_members (userId, username, discriminator, nick, avatar, avatarURL, displayColor, displayHexColor, status, bot, deleted, createdAt, createdTimestamp, joinedAt, joinedTimestamp, updated)
                                                      VALUES ('${target.user.id}', '${mysql_real_escape_string(target.user.username)}', '${target.user.discriminator}', '${mysql_real_escape_string(target.nickname)}', '${target.user.avatar}', '${target.user.avatarURL}', ${target.displayColor}, '${target.displayHexColor}', '${target.user.presence.status}', ${target.user.bot}, ${status}, '${target.user.createdAt}', '${target.user.createdTimestamp}', '${target.joinedAt}', '${target.joinedTimestamp}', '${date.date}')
                                                    ON DUPLICATE KEY UPDATE username = '${mysql_real_escape_string(target.user.username)}', discriminator = '${target.user.discriminator}', nick = '${mysql_real_escape_string(target.nickname)}', avatar = '${target.user.avatar}', avatarURL = '${target.user.avatarURL}', displayColor = ${target.displayColor}, displayHexColor = '${target.displayHexColor}', status = '${target.user.presence.status}', bot = ${target.user.bot}, deleted = ${status}, createdAt = '${target.user.createdAt}', createdTimestamp = '${target.user.createdTimestamp}', joinedAt = '${target.joinedAt}', joinedTimestamp = '${target.joinedTimestamp}', updated = '${date.date}'`)
      .then(rows => {
        logger.info(`${logColor.logUpdate} Updated ${target.user.username}`, {logType: 'updateRow', time: Date.now()});
      }))
      .catch(err => {
        logger.error(err, {logType: 'error', time: Date.now()});
        throw err;
      });
    });
  },




  /*************
  * general server info
  *************/
  logServerInfo: (server) => {
      db.execute(config, database => database.query(`INSERT INTO stat_serverInfo (serverId, name, acronym, greeting, memberCount, available, iconURL, defaultRole, afkTimeout, explicitContentFilter, splash, splashURL, createdAt, createdTimestamp, large, ownerID, region)
                                                      VALUES ('${server.id}', '${mysql_real_escape_string(server.name)}', '${server.nameAcronym}', '${server.greeting}', ${server.memberCount}, ${server.available}, '${server.iconURL}', '${server.defaultRole}', ${server.afkTimeout}, ${server.explicitContentFilter}, '${server.splash}', '${server.splashURL}', '${server.createdAt}', '${server.createdTimestamp}', ${server.large}, '${server.ownerID}', '${server.region}')
                                                      ON DUPLICATE KEY UPDATE name = '${mysql_real_escape_string(server.name)}', acronym = '${server.nameAcronym}', greeting = '${server.greeting}', memberCount = ${server.memberCount}, available = ${server.available}, iconURL = '${server.iconURL}', defaultRole = '${server.defaultRole}', afkTimeout = ${server.afkTimeout}, explicitContentFilter = ${server.explicitContentFilter}, splash = '${server.splash}', splashURL = '${server.splashURL}', createdAt = '${server.createdAt}', createdTimestamp = '${server.createdTimestamp}', large = ${server.large}, ownerID = '${server.ownerID}', region = '${server.region}'`)
      .then(rows => {
        logger.info(`${logColor.logUpdate} Updated serverStats`, {logType: 'updateRow', time: Date.now()});
      }))
      .catch(err => {
        logger.error(err, {logType: 'error', time: Date.now()});
        throw err;
      });
  },




  /*************
  * Channels
  *************/
  logChannels: (server, channel, status) => {
    const date = getDate();
    let targets = channel ? [channel] : server.channels;
    if (!status) status = false;

    targets.forEach(target => {
      let topic = target.topic || '';
      let nsfw = target.nsfw || '0';
      let lastMessageID = target.lastMessageID || '';

      db.execute(config, database => database.query(`INSERT INTO stat_channels (channelID, name, topic, position, type, nsfw, lastMessageID, deleted, updated)
                                                      VALUES ('${target.id}', '${mysql_real_escape_string(target.name)}', '${mysql_real_escape_string(topic)}', ${target.position}, '${target.type}', ${nsfw}, '${lastMessageID}', ${status}, '${date.date}')
                                                      ON DUPLICATE KEY UPDATE name = '${mysql_real_escape_string(target.name)}', topic = '${mysql_real_escape_string(topic)}', position = ${target.position}, type = '${target.type}', nsfw = ${nsfw}, lastMessageID = '${lastMessageID}', deleted = ${status}, updated = '${date.date}'`)
      .then(rows => {
        logger.info(`${logColor.logUpdate} Updated ${target.name} in stat_channels`, {logType: 'updateRow', time: Date.now()});
      }))
      .catch(err => {
        logger.error(err, {logType: 'error', time: Date.now()});
        throw err;
      });
    });
  },




  /*************
  * change users ban status
  *************/
  logMemberBan: (user, ban) => {
    const date = getDate();

    db.execute(config, database => database.query(`UPDATE stat_members SET banned = ${ban} WHERE userId = '${user.id}'`)
    .then(rows => {
      logger.info(`${logColor.logUpdate} Updated ${user.username}'s ban status`, {logType: 'updateRow', time: Date.now()});
    }))
    .catch(err => {
      logger.error(err, {logType: 'error', time: Date.now()});
      throw err;
    });
  },




  /*************
  * message count
  *************/
  logMessages: message => {
    if (message.guild === null) return;
    const date = getDate();

    db.execute(config, database => database.query(`SELECT * FROM stat_messages WHERE userId = '${message.author.id}' AND channelId = '${message.channel.id}' AND date = '${date.dateSimple}'`)
    .then(rows => {
      if (rows.length < 1) {
        database.query(`INSERT INTO stat_messages (userId, channelId, messageCount, date, updated) VALUES ('${message.author.id}', '${message.channel.id}', 1, '${date.dateSimple}', '${date.date}')`);
      } else {
        database.query(`UPDATE stat_messages SET messageCount = messageCount + 1, updated = '${date.date}' WHERE userId = '${message.author.id}' AND channelId = '${message.channel.id}' AND date = '${date.dateSimple}'`);
      }
      return;
    }))
    .catch(err => {
      logger.error(err, {logType: 'error', time: Date.now()});
      throw err;
    });
  },




  /*************
  * emotes
  *************/
  logEmote: (message, emote) => {
    const date = getDate();
    // if (!animated) animated = false;

    db.execute(config, database => database.query(`SELECT * FROM stat_emotes WHERE emoteId = '${emote[2]}' AND userId = '${message.author.id}' AND date = '${date.dateSimple}'`)
    .then(rows => {
      if (rows.length < 1) {
        database.query(`INSERT INTO stat_emotes (emoteId, name, userId, count, date, updated) VALUES ('${emote[2]}', '${emote[1]}', '${message.author.id}', 1, '${date.dateSimple}', '${date.date}')`);
        console.log('inserted emote count');
      } else {
        database.query(`UPDATE stat_emotes SET name = '${emote[1]}', count = count + 1, updated = '${date.date}' WHERE emoteId = '${emote[2]}' AND userId = '${message.author.id}' AND date = '${date.dateSimple}'`);
        console.log('updated emote count');
      }
      return;
    }))
    .catch(err => {
      logger.error(err, {logType: 'error', time: Date.now()});
      throw err;
    });
  },




  /*************
  * check agree
  *************/
  checkAgree: (server, message) => {
    if (message.content.toLowerCase() != '!agree') return;
    const date = getDate();

    console.log('update agree');

    db.execute(config, database => database.query(`INSERT INTO stat_members (userId, username, discriminator, nick, nicknames, avatar, avatarURL, displayColor, displayHexColor, status, bot, deleted, createdAt, createdTimestamp, joinedAt, joinedTimestamp, agreedAt, updated)
                                                    VALUES ('${message.member.user.id}', '${mysql_real_escape_string(message.member.user.username)}', '${message.member.user.discriminator}', '${mysql_real_escape_string(message.member.nickname)}', 'NICKNAMES', '${message.member.user.avatar}', '${message.member.user.avatarURL}', ${message.member.displayColor}, '${message.member.displayHexColor}', '${message.member.user.presence.status}', ${message.member.user.bot}, false, '${message.member.user.createdAt}', '${message.member.user.createdTimestamp}', '${message.member.joinedAt}', '${message.member.joinedTimestamp}', '${date.date}', '${date.date}')
                                                  ON DUPLICATE KEY UPDATE agreedAt = '${date.date}', updated = '${date.date}'`))
    .catch(err => {
      logger.error(err, {logType: 'error', time: Date.now()});
      throw err;
    });
  },




  /*************
  * introductions    -> newcomer -> agree -> no role -> introduce -> I've introduced myself
  *************/
  checkIntroduction: (server, message) => {
    const date = getDate();
    let keywords = ['hello', 'hi', 'hey', 'my name is', 'i am', 'i\'m', 'years old', 'yo', 'new to programming', 'new to coding', 'i want to learn', 'currently learning', 'self taught', 'learning', 'teaching myself'];

    // let roles = [];
    // message.member.roles.forEach(role => {
    //   roles.push(role.name);
    // });

    if (message.member.roles.size <= 1) {
      console.log('check Introduction');
      let prob = 0.0;

      keywords.forEach(word => {
        let regex = new RegExp(`\\b${word}\\b`, 'g');
        if (message.content.toLowerCase().match(regex)) prob += 0.25;
      });

      console.log('Intro prob:', prob);
      if (prob >= 0.5) {
        console.log('is an introduction');
        console.log('message id', message.id);

        db.execute(config, database => database.query(`INSERT INTO stat_introductions (userId, text, messageId, probability, date) VALUES ('${message.author.id}', '${mysql_real_escape_string(message.content)}', '${message.id}', ${prob}, '${date.dateSimple}')`))
        .catch(err => {
          logger.error(err, {logType: 'error', time: Date.now()});
          throw err;
        });
      }
    }
  },




  /*************
  * check if introduced role gets applied
  *************/
  logRolechange: (server, oldMember, newMember) => {
    const date = getDate();
    if (!oldMember.roles.find(r => r.name.toLowerCase() === `i've introduced myself`) && newMember.roles.find(r => r.name.toLowerCase() === `i've introduced myself`)) {
      console.log('user got introduced role!');

      db.execute(config, database => database.query(`INSERT INTO stat_members (userId, username, discriminator, nick, nicknames, avatar, avatarURL, displayColor, displayHexColor, status, bot, deleted, createdAt, createdTimestamp, joinedAt, joinedTimestamp, agreedAt, introducedAt, updated)
                                                      VALUES ('${newMember.user.id}', '${mysql_real_escape_string(newMember.user.username)}', '${newMember.user.discriminator}', '${mysql_real_escape_string(newMember.nickname)}', 'NICKNAMES', '${newMember.user.avatar}', '${newMember.user.avatarURL}', ${newMember.displayColor}, '${newMember.displayHexColor}', '${newMember.user.presence.status}', ${newMember.user.bot}, false, '${newMember.user.createdAt}', '${newMember.user.createdTimestamp}', '${newMember.joinedAt}', '${newMember.joinedTimestamp}', '${date.date}', '${date.date}', '${date.date}')
                                                    ON DUPLICATE KEY UPDATE introducedAt = '${date.date}', updated = '${date.date}'`))
      .catch(err => {
        logger.error(err, {logType: 'error', time: Date.now()});
        throw err;
      });
    }
  },




  /*************
  * insert prune record
  *************/
  insertPrune: () => {
    const date = getDate();
    db.execute(config, database => database.query(`INSERT INTO stat_prunes (date) VALUES ('${date.dateSimple}')`))
    .catch(err => {
      logger.error(err, {logType: 'error', time: Date.now()});
      throw err;
    });
  },

}
