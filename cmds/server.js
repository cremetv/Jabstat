const config = module.require('./../utility/config.js');
const Discord = require('discord.js');

module.exports.run = async(client, message, args, db) => {

  let topMembers = [],
      topMembersLastMonth = [],
      topMembersLastWeek = [],
      topMembersToday = [],
      topChannel = [],
      channelName = {},
      totalMessages,
      lastMonthMessages,
      lastWeekMessages,
      lastDayMessages;

  let target = message.member;

  setTimeout(() => {
    db.execute(config, database => database.query(`SELECT * FROM stat_serverInfo WHERE serverId = '${message.guild.id}'`)
    .then(rows => {
      if (rows.length < 1) {
        throw new Error('nothing found');
      }

      // get server info

      return database.query(`SELECT userId, SUM(messageCount) AS messages
                              FROM stat_messages GROUP BY userId`);
    })
    .then(rows => {
      if (rows.length > 0) {
        rows.forEach(row => {
          let user = {};
          user.userId = row.userId;
          user.count = row.messages;
          topMembers.push(user);
        });

        topMembers.sort((a, b) => parseFloat(a.count) - parseFloat(b.count));
        topMembers.reverse();
        topMembers = topMembers.slice(0, 3);
      }

      return database.query(`SELECT userId, SUM(messageCount) AS messages
                              FROM stat_messages WHERE updated >= NOW() - INTERVAL 30 DAY
                              GROUP BY userId`);
    })
    .then(rows => {
      if (rows.length > 0) {
        rows.forEach(row => {
          let user = {};
          user.userId = row.userId;
          user.count = row.messages;
          topMembersLastMonth.push(user);
        });

        topMembersLastMonth.sort((a, b) => parseFloat(a.count) - parseFloat(b.count));
        topMembersLastMonth.reverse();
        topMembersLastMonth = topMembersLastMonth.slice(0, 3);
      }

      return database.query(`SELECT userId, SUM(messageCount) AS messages
                              FROM stat_messages WHERE updated >= NOW() - INTERVAL 7 DAY
                              GROUP BY userId`);
    })
    .then(rows => {
      if (rows.length > 0) {
        rows.forEach(row => {
          let user = {};
          user.userId = row.userId;
          user.count = row.messages;
          topMembersLastWeek.push(user);
        });

        topMembersLastWeek.sort((a, b) => parseFloat(a.count) - parseFloat(b.count));
        topMembersLastWeek.reverse();
        topMembersLastWeek = topMembersLastWeek.slice(0, 3);
      }

      return database.query(`SELECT userId, SUM(messageCount) AS messages
                              FROM stat_messages WHERE updated >= NOW() - INTERVAL 1 DAY
                              GROUP BY userId`);
    })
    .then(rows => {
      if (rows.length > 0) {
        rows.forEach(row => {
          let user = {};
          user.userId = row.userId;
          user.count = row.messages;
          topMembersToday.push(user);
        });

        topMembersToday.sort((a, b) => parseFloat(a.count) - parseFloat(b.count));
        topMembersToday.reverse();
        topMembersToday = topMembersToday.slice(0, 3);
      }

      return database.query(`SELECT SUM(messageCount) AS messages
                              FROM stat_messages`);
    })
    .then(rows => {
      totalMessages = (rows.length < 1) ? 0 : rows[0].messages;

      return database.query(`SELECT SUM(messageCount) AS messages
                              FROM stat_messages
                              WHERE updated >= NOW() - INTERVAL 30 DAY`);
    })
    .then(rows => {
      lastMonthMessages = (rows.lenght < 1) ? 0 : rows[0].messages;

      return database.query(`SELECT SUM(messageCount) AS messages
                              FROM stat_messages
                              WHERE updated >= NOW() - INTERVAL 7 DAY`);
    })
    .then(rows => {
      lastWeekMessages = (rows.length < 1) ? 0 : rows[0].messages;

      return database.query(`SELECT SUM(messageCount) AS messages
                              FROM stat_messages
                              WHERE updated >= NOW() - INTERVAL 1 DAY`);
    })
    .then(rows => {
      lastDayMessages = (rows.length < 1) ? 0 : rows[0].messages;

      return database.query(`SELECT channelId, SUM(messageCount) AS messages
                              FROM stat_messages
                              GROUP BY channelId`);
    })
    .then(rows => {
      if (rows.length < 1) {
        channelName.name = '-';
        topChannel = {count: 0};
      } else {
        rows.forEach(row => {
          let channel = {};
          channel.channelId = row.channelId;
          channel.count = row.messages;
          topChannel.push(channel);
        });

        topChannel.sort((a, b) => parseFloat(a.count) - parseFloat(b.count));
        topChannel.reverse();

        channelName = client.channels.find(c => c.id === topChannel[0].channelId);
      }

      return;
    })
    .then(() => {
      let createdAt = new Date(message.guild.createdTimestamp);
      createdAt = `${('0' + createdAt.getDate()).slice(-2)}.${('0' + (createdAt.getMonth() + 1)).slice(-2)}.${createdAt.getFullYear()}`;

      let embed = new Discord.RichEmbed()
      .setAuthor(message.guild.name)
      .setDescription(`stats for ${message.guild.name}`)
      .setThumbnail(message.guild.iconURL)
      .setColor('#EF3340')
      .addField('Members', `Users: \`${message.guild.memberCount}\``)
      .addField('Top Channel', `<#${topChannel[0].channelId}> \`${topChannel[0].count} messages\``)
      .addField('Messages', `__total__: **${totalMessages}**\n30 days: **${lastMonthMessages}**\n7 days: **${lastWeekMessages}**\n24 hours: **${lastDayMessages}**`, true)
      .addField('Emotes', '...', true)
      .addField('Server Info', `Server created on: \`${createdAt}\`\n\nServer owner: <@${message.guild.ownerID}>`)
      // .addField('Links', `[View Profile](https://jabstats.com/) | [General Server stats](https://jabstats.com/)`)
      .setFooter(`beep boop • server ID: ${message.guild.id} • Dates: dd.mm.yyyy UTC`, client.user.avatarURL);

      message.channel.send({embed: embed});

    }))
    .catch(err => {
      if (err.message == 'nothing found') {
        message.channel.send(`No records found`)
      } else {
        // logger.error(err, {logType: 'error', time: Date.now()});
        throw err;
      }
    });
  }, 100);
}

module.exports.help = {
  name: 'server',
  alias: 's',
  description: 'show stats for the server',
  usage: '',
  admin: false
}
