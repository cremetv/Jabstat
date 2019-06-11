const config = module.require('./../utility/config.js');
const Discord = require('discord.js');

module.exports.run = async(client, message, args, db) => {
  let target = message.mentions.users.first() || message.guild.members.get(args[0]) || message.author;

  if (!target.user) target = message.guild.members.get(target.id);

  if (args[0] != undefined && args[0] != message.author.username && message.mentions.users.first() == undefined) {
    let matches = message.guild.members.filter(u => u.user.username.toLowerCase().includes(args[0].toLowerCase()));
    target = matches.first();
  }

  let totalMessages,
      lastMonthMessages,
      lastUpdated,
      emoteCount;

  if (target == null || target == undefined) return message.channel.send('no user found');

  db.execute(config, database => database.query(`SELECT * FROM jabusers WHERE userID = '${target.id}'`)
  .then(rows => {
    if (rows.length < 1) return message.channel.send(`No records for ${target.user.username} found`);
      totalMessages = rows[0].messageCount;
      lastUpdated = new Date(rows[0].updated);
    return;
  })
  .then(() => {
    database.query(`
      SELECT SUM(messageCount) AS mMessages
      FROM jabuserMessageCount
      WHERE userID = '${target.id}'
      AND updated >= NOW() - INTERVAL 30 DAY`)
    .then(rows => {
      lastMonthMessages = rows[0].mMessages;
      return;
    })
    .then(() => {
      // database.query(`
      //   SELECT SUM(count) AS emotecount
      //   FROM jabmotesCount
      //   WHERE userID = '${target.id}'
      //   AND updated >= NOW() - INTERVAL 30 DAY`)
      // .then(rows => {
      //   emoteCount = rows[0].emotecount;
      // })
      // .then(() => {
      //   let joinedAt = new Date(target.joinedTimestamp);
      //   let createdAt = new Date(target.user.createdTimestamp);
      //
      //   const embed = {
      //     'description': `statistics for **${target.user.username}**#**${target.user.discriminator}**`,
      //     'url': `https://ice-creme.de/jabstats/${target.id}`,
      //     'color': 15277667,
      //     'footer': {
      //       'icon_url': client.user.avatarURL,
      //       'text': `beep boop | last updated: ${lastUpdated.getFullYear()}-${('0' + (lastUpdated.getMonth() + 1)).slice(-2)}-${('0' + lastUpdated.getDate()).slice(-2)} ${('0' + lastUpdated.getHours()).slice(-2)}:${('0' + lastUpdated.getMinutes()).slice(-2)}:${('0' + lastUpdated.getSeconds()).slice(-2)}`
      //     },
      //     'thumbnail': {
      //       'url': target.user.avatarURL
      //     },
      //     'author': {
      //       'name': `stats for ${target.displayName} (WIP)`,
      //       'url': `https://ice-creme.de/jabstats/${target.id}`,
      //       'icon_url': target.user.avatarURL
      //     },
      //     'fields': [
      //       {
      //         'name': 'Messages',
      //         'value': `• **${totalMessages}** total\n• **${lastMonthMessages}** last 30 days`
      //       },
      //       {
      //         'name': 'Emote usage',
      //         'value': `• **${emoteCount}** emotes used in the last 30 days`
      //       },
      //       {
      //         'name': 'Misc',
      //         'value': `• Joined Server on:  **${('0' + (joinedAt.getMonth() + 1)).slice(-2)}.${('0' + joinedAt.getDate()).slice(-2)}.${joinedAt.getFullYear()}**\n• Account created: **${('0' + (createdAt.getMonth() + 1)).slice(-2)}.${('0' + createdAt.getDate()).slice(-2)}.${createdAt.getFullYear()}**`
      //       },
      //       {
      //         'name': 'Links',
      //         'value': `[View Profile](https://ice-creme.de/jabstats/${target.id}) | [General Server statistics](https://ice-creme.de/jabstats)`
      //       }
      //     ]
      //   };
      //   message.channel.send({ embed });
      // });
      let joinedAt = new Date(target.joinedTimestamp);
      let createdAt = new Date(target.user.createdTimestamp);

      const embed = {
        'description': `statistics for **${target.user.username}**#**${target.user.discriminator}**`,
        // 'url': `https://ice-creme.de/jabstats/${target.id}`,
        'url': 'https://jabstats.com/',
        'color': 15277667,
        'footer': {
          'icon_url': client.user.avatarURL,
          'text': `beep boop | last updated: ${lastUpdated.getFullYear()}-${('0' + (lastUpdated.getMonth() + 1)).slice(-2)}-${('0' + lastUpdated.getDate()).slice(-2)} ${('0' + lastUpdated.getHours()).slice(-2)}:${('0' + lastUpdated.getMinutes()).slice(-2)}:${('0' + lastUpdated.getSeconds()).slice(-2)}`
        },
        'thumbnail': {
          'url': target.user.avatarURL
        },
        'author': {
          'name': `stats for ${target.displayName} (WIP)`,
          // 'url': `https://ice-creme.de/jabstats/${target.id}`,
          'url': 'https://jabstats.com/',
          'icon_url': target.user.avatarURL
        },
        'fields': [
          {
            'name': 'Messages',
            'value': `• **${totalMessages}** total\n• **${lastMonthMessages}** last 30 days`
          },
          // {
          //   'name': 'Emote usage',
          //   'value': `• **${emoteCount}** emotes used in the last 30 days`
          // },
          {
            'name': 'Misc',
            'value': `• Joined Server on:  **${('0' + (joinedAt.getMonth() + 1)).slice(-2)}.${('0' + joinedAt.getDate()).slice(-2)}.${joinedAt.getFullYear()}**\n• Account created: **${('0' + (createdAt.getMonth() + 1)).slice(-2)}.${('0' + createdAt.getDate()).slice(-2)}.${createdAt.getFullYear()}**`
          },
          {
            'name': 'Links',
            'value': `[View Profile](https://jabstats.com/) | [General Server statistics](https://jabstats.com/)`
          }
        ]
      };
      message.channel.send({ embed });

    });
    return;
  }))
  .catch(err => {
    throw err;
  });
}

module.exports.help = {
  name: 'user',
  alias: 'u',
  description: 'show stats for a user',
  usage: '[@user | user | searchterm]',
  admin: false
}
