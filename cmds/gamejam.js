const config = module.require('./../utility/config.js');
const Discord = require('discord.js');
const logger = require('./../utility/logger');
const logColor = require('./../utility/logcolors');

module.exports.run = async(client, message, args, db) => {

  const cmd = args[0];

  let startdate, enddate;

  let currentDate = new Date();

  const formatDate = (rawDate) => {
    let date = new Date(rawDate);
    let dateStr = ('0' + date.getDate()).slice(-2) + '.' + ('0' + (date.getMonth() + 1)).slice(-2) + '.' + date.getFullYear() + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
    return {
      date: date,
      dateStr: dateStr
    }
  }


  function delay() {return new Promise(resolve => seTimeout(resolve, 300));}
  async function delayedLog(item) {await delay();}


  if (!cmd) {
    /****************
    *
    * Show current gamejam if available
    * >gj
    *
    ****************/
    let gamejam, entries = [], votelink, voted;

    db.execute(config, database => database.query(`SELECT * FROM jam_jams WHERE NOW() BETWEEN startdate AND enddate`)
    .then(rows => {
      if (rows.length < 1) {
        throw new Error('no gamejam');
      }

      gamejam = rows[0];

      startdate = formatDate(gamejam.startdate);
      enddate = formatDate(gamejam.enddate);

      return database.query(`SELECT * FROM jam_entries WHERE jamId = '${gamejam.id}'`);
    })
    .then(rows => {
      rows.forEach(r => {
        let entry = {};
        entry.id = r.id;
        entry.name = r.name;
        entry.link = r.link;
        entry.team = r.team;
        entries.push(entry);
      });
      console.log('list of entries:');
      console.log(entries);

      let entryString = [];

      /* loop the entries */
      function asyncFunction(entry, callback) {
        setTimeout(() => {
          entryString.push(`[${entry.name}](${entry.link})`);
          callback();
        }, 100);
      }

      let requests = entries.reduce((promiseChain, entry) => {
        return promiseChain.then(() => new Promise((resolve) => {
          asyncFunction(entry, resolve);
        }));
      }, Promise.resolve());

      /* after entries are looped send the embed */
      requests.then(() => {

        // gamejam detail embed
        let embed = new Discord.MessageEmbed()
        .setTitle(gamejam.title)
        .setURL(gamejam.link)
        .setThumbnail(gamejam.image)
        .setColor('#3498db')
        .addField('\u200b', '\u200b')
        .addField('Start', startdate.dateStr, true)
        .addField('Deadline', enddate.dateStr, true)
        .setFooter(`beep boop • gamejam ID: ${gamejam.id}`, client.user.avatarURL);

        let entryEmbed = new Discord.MessageEmbed()
        .setColor('#3498db')
        .addField('Entries:', `- ${entryString.join('\n- ')}`);

        message.channel.send({embed: embed}).then(() => {
          message.channel.send({embed: entryEmbed});
        });
      });

    }))
    .catch(err => {
      if (err.message === 'no gamejam') {
        message.channel.send(`There is currently no gamejam running`);
      } else {
        logger.error(err, {logType: 'error', time: Date.now()});
        throw err;
      }
    });


  } else if (/^\d+$/.test(cmd)) {
    /****************
    *
    * Gamejam lookup command
    * >gj <id>
    *
    ****************/
    let gamejam, entries = [];

    db.execute(config, database => database.query(`SELECT * FROM jam_jams WHERE id = '${cmd}'`)
    .then(rows => {
      if (rows.length < 1) {
        throw new Error('no gamejam');
      }

      gamejam = rows[0];

      startdate = formatDate(gamejam.startdate);
      enddate = formatDate(gamejam.enddate);

      let gamejamStartDate = new Date(gamejam.startdate);
      if (gamejamStartDate > currentDate) {
        throw new Error('not public yet');
      }

      return database.query(`SELECT * FROM jam_entries WHERE jamId = '${gamejam.id}'`);
    })
    .then(rows => {
      rows.forEach(r => {
        let entry = {};
        entry.id = r.id;
        entry.name = r.name;
        entry.link = r.link;
        entry.team = r.team;
        entries.push(entry);
      });
      console.log('list of entries:');
      console.log(entries);

      let entryString = [];

      function asyncFunction(entry, callback) {
        setTimeout(() => {
          entryString.push(`[${entry.name}](${entry.link})`);
          callback();
        }, 100);
      }

      let requests = entries.reduce((promiseChain, entry) => {
        return promiseChain.then(() => new Promise((resolve) => {
          asyncFunction(entry, resolve);
        }));
      }, Promise.resolve());

      requests.then(() => {
        console.log('setup embed');

        // gamejam detail embed
        let embed = new Discord.MessageEmbed()
        .setTitle(gamejam.title)
        .setURL(gamejam.link)
        .setThumbnail(gamejam.image)
        .setColor('#3498db')
        .addField('Start', startdate.dateStr, true)
        .addField('Deadline', enddate.dateStr, true)
        .setFooter(`beep boop • gamejam ID: ${gamejam.id}`, client.user.avatarURL);

        let entryEmbed = new Discord.MessageEmbed()
        .setColor('#3498db')
        .addField('Entries:', `- ${entryString.join('\n- ')}`);

        message.channel.send({embed: embed}).then(() => {
          message.channel.send({embed: entryEmbed});
        });
      });
    }))
    .catch(err => {
      if (err.message === 'no gamejam') {
        message.channel.send(`There is no gamejam with the id \`${cmd}\``);
      } else if (err.message === 'not public yet') {
        message.channel.send(`This gamejam isn't public yet`);
      } else {
        logger.error(err, {logType: 'error', time: Date.now()});
        throw err;
      }
    });


} else if (cmd == 'list' || cmd == 'l') {
  /****************
  *
  * List gamejams
  * >gj list [option]
  *
  * available options:
  * --open --closed --current --voting
  *
  ****************/
  let gamejams = [], option = args[1], statement, title;

  // switch (option) {
  //   case '--open':
  //     statement = 'WHERE active = 1 AND enddate >= NOW()';
  //     title = 'open gamejams\n';
  //     break;
  //   case '--closed':
  //     statement = 'WHERE active = 1 AND enddate <= NOW()';
  //     title = 'already closed gamejams\n';
  //     break;
  //   case '--current':
  //     statement = 'WHERE active = 1 AND NOW() BETWEEN startdate AND enddate';
  //     title = 'currently running gamejams\n';
  //     break;
  //   case '--voting':
  //     statement = 'WHERE active = 1 AND votelink IS NOT NULL AND enddate >= NOW() - INTERVAL 1 DAY AND enddate <= NOW()';
  //     title = 'gamejams where you can vote\n';
  //     break;
  //   default:
  //     statement = 'WHERE active = 1';
  //     title = '';
  //     if (option) {
  //       message.channel.send('option doesn\'t exist. here is the full list:');
  //     }
  // }

  // db.execute(config, database => database.query(`SELECT * FROM jam_jams ${statement} ORDER BY startdate DESC LIMIT 10`)

  db.execute(config, database => database.query(`SELECT * FROM jam_jams ORDER BY startdate DESC LIMIT 10`)
  .then(rows => {
    if (rows.length < 1) {
      throw new Error('no gamejams');
    }

    rows = rows.reverse();

    rows.forEach(gamejam => {
      let gamejamStartDate = new Date(gamejam.startdate);
      let gamejamEndDate = new Date(gamejam.enddate);
      if (gamejamEndDate < currentDate) {
        // ended gamejam
        gamejams.push(`\`${gamejam.id}\` | \t~~${gamejam.title}~~`);
      } else if (gamejamStartDate <= currentDate && gamejamEndDate >= currentDate) {
        // current gamejam
        gamejams.push(`\`${gamejam.id}\` | \t__**${gamejam.title}**__`);
      } else {
        // future gamejam
        // gamejams.push(`\`${gamejam.id}\` | \t${gamejam.title}`);
        gamejams.push(`\`${gamejam.id}\` | \t||secret 👀||`);
      }
    });
  })
  .then(() => {
    let embed = new Discord.MessageEmbed()
    .setAuthor('Gamejam list')
    .setDescription(`type \`>gamejam <id>\` to get more informations`)
    .addField('All gamejams:', `${gamejams.join('\n')}`)
    .setColor('#3498db')
    .setFooter(`beep boop`, client.user.avatarURL);
    message.channel.send({embed: embed});
  }))
  .catch(err => {
    if (err.message === 'no gamejams') {
      message.channel.send(`Couldn't find any gamejams`);
    } else {
      logger.error(err, {logType: 'error', time: Date.now()});
      throw err;
    }
  });


  } else if (cmd == 'help' || cmd == 'h') {
    /****************
    *
    * Help List
    * >gj help
    *
    ****************/
    let embed = new Discord.MessageEmbed()
    .setAuthor('Gamejam help')
    .setDescription('```MD\nuse >gamejam or >gj\n\n>gamejam\n===\nshow the active gamejam\n\n>gamejam list [option]\n===\nget a list of all gamejams\noptions:--open --closed --current --voting\n\n>gamejam <id>\n===\nget detailed information about that gamejam```')
    .setColor('#3498db')
    .setFooter(`beep boop`, client.user.avatarURL);
    message.channel.send({embed: embed});

  } else {
    message.channel.send('type `>gamejam help` for more informations');
    message.delete();
  }

}

module.exports.help = {
  name: 'gamejam',
  alias: 'gj',
  description: 'use >gamejam help for all gamejam commands',
  usage: '',
  admin: false
}
