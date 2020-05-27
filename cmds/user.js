const config = module.require('./../utility/config.js');
const Discord = require('discord.js');

module.exports.run = async(client, message, args, db) => {
  let target = message.mentions.users.first() || message.guild.members.get(args[0]) || message.author;

  if (!target.user) target = message.guild.members.get(target.id);

  if (args[0] != undefined && args[0] != message.author.username && message.mentions.users.first() == undefined) {
    let matches = message.guild.members.filter(u => u.user.username.toLowerCase().includes(args[0].toLowerCase()));
    target = matches.first();
  }

  let joinedAt,
      agreedAt = '-',
      introducedAt = '-',
      createdAt,
      mostActiveChannel,
      channelName = {},
      totalMessages = 0,
      lastMonthMessages,
      lastWeekMessages,
      lastDayMessages,
      lastUpdated,
      emoteCount,
      usedChannels = [],
      introLink;

  if (target == null || target == undefined) return message.channel.send('no user found');

  setTimeout(() => {
    db.execute(config, database => database.query(`SELECT * FROM stat_members WHERE userId = '${target.id}'`)
    .then(rows => {
      if (rows.length < 1) {
        throw new Error('nothing found');
      }

      let user = rows[0];

      joinedAt = new Date(target.joinedTimestamp);
      joinedAt = `${('0' + joinedAt.getDate()).slice(-2)}.${('0' + (joinedAt.getMonth() + 1)).slice(-2)}.${joinedAt.getFullYear()}`;

      createdAt = new Date(target.user.createdTimestamp);
      createdAt = `${('0' + createdAt.getDate()).slice(-2)}.${('0' + (createdAt.getMonth() + 1)).slice(-2)}.${createdAt.getFullYear()}`;

      if (user.agreedAt != null) {
        agreedAt = new Date(user.agreedAt);
        agreedAt = `${('0' + agreedAt.getDate()).slice(-2)}.${('0' + (agreedAt.getMonth() + 1)).slice(-2)}.${agreedAt.getFullYear()}`;
      }
      if (user.introducedAt != null) {
        introducedAt = new Date(user.introducedAt);
        introducedAt = `${('0' + introducedAt.getDate()).slice(-2)}.${('0' + (introducedAt.getMonth() + 1)).slice(-2)}.${introducedAt.getFullYear()}`;
      }

      return database.query(`SELECT channelId, SUM(messageCount) AS messages
                              FROM stat_messages WHERE userId = '${target.id}' GROUP BY channelId`);
    })
    .then(rows => {
      if (rows.length < 1) {
        totalMessages = 0;
        channelName.name = '-';
        mostActiveChannel = {count: 0};
      } else {
        rows.forEach(row => {
          totalMessages += parseInt(row.messages);
          let channel = {};
          channel.channelId = row.channelId;
          channel.count = row.messages;
          usedChannels.push(channel);
        });

        usedChannels.sort((a, b) => parseFloat(a.count) - parseFloat(b.count));
        usedChannels.reverse();

        mostActiveChannel = usedChannels[0];

        channelName = client.channels.find(c => c.id === mostActiveChannel.channelId);
      }

      return database.query(`SELECT SUM(messageCount) AS messages
                              FROM stat_messages WHERE userId = '${target.id}'
                              AND updated >= NOW() - INTERVAL 30 DAY`);
    })
    .then(rows => {
      lastMonthMessages = (rows.length < 1) ? 0 : rows[0].messages;

      return database.query(`SELECT SUM(messageCount) AS messages
                              FROM stat_messages WHERE userId = '${target.id}'
                              AND updated >= NOW() - INTERVAL 7 DAY`);
    })
    .then(rows => {
      lastWeekMessages = (rows.length < 1) ? 0 : rows[0].messages;

      return database.query(`SELECT SUM(messageCount) AS messages
                              FROM stat_messages WHERE userId = '${target.id}'
                              AND updated >= NOW() - INTERVAL 1 DAY`);
    })
    .then(rows => {
      lastDayMessages = (rows.length < 1) ? 0 : rows[0].messages;

      return database.query(`SELECT * FROM stat_introductions WHERE userId = '${target.id}'`);
    })
    .then(rows => {
      if (rows.length > 0) {
        let introChannel = client.channels.find(c => c.name.toLowerCase() === 'introduce-yourself');
        introLink = `https://discordapp.com/channels/${message.guild.id}/${introChannel.id}/${rows[0].messageId}`;
      }
      return;
    })
    .then(() => {
      let intro = (introLink) ? `[${introducedAt}](${introLink})` : `${introducedAt}`;

      let embed = new Discord.RichEmbed()
      .setAuthor(`stats for ${target.displayName}`, target.user.avatarURL)
      .setDescription(`statistics for **${target.user.username}**#**${target.user.discriminator}**`)
      .setThumbnail(target.user.avatarURL)
      .setColor('#EF3340')
      .addField('Info', `joined on: **${joinedAt}**\nagreed on: **${agreedAt}**\nintroduced on: **${intro}**\naccount created on: **${createdAt}**`)
      .addBlankField()
      .addField('Most active Channel', `<#${mostActiveChannel.channelId}> \`${mostActiveChannel.count} messages\``)
      .addBlankField()
      .addField('Messages', `__total__: **${totalMessages}**\nlast 30 days: **${lastMonthMessages}**\nlast 7 days: **${lastWeekMessages}**\nlast 24 hours: **${lastDayMessages}**`, true)
      .addField('Emotes', '...', true)
      // .addField('Links', `[View Profile](https://jabstats.com/) | [General Server stats](https://jabstats.com/)`)
      .setFooter(`beep boop • user ID: ${target.id} • Dates: dd.mm.yyyy UTC`, client.user.avatarURL);

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
  name: 'user',
  alias: 'u',
  description: 'show stats for a user',
  usage: '[@user | user | searchterm]',
  admin: false
}
