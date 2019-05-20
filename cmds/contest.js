const config = module.require('./../utility/config.js');
const Discord = require('discord.js');

module.exports.run = async(client, message, args, db) => {

  const cmd = args[0];

  let startdate, enddate, contestName, contestDescription, contestType, contestVisibility, typeImage;
  let themes = [];

  let currentDate = new Date();

  if (!cmd) {
    message.channel.send('send current contest theme');
  } else if (/^\d+$/.test(cmd)) {
    db.execute(config, database => database.query(`SELECT * FROM contest WHERE id = '${cmd}'`)
    .then(rows => {
      if (rows.length < 1) return message.channel.send(`Couldn't find a contest with id: ${cmd}`);

      startdate = new Date(rows[0].startdate);
      startdateStr = ('0' + (startdate.getMonth() + 1)).slice(-2) + '/' + ('0' + startdate.getDate()).slice(-2) + '/' + startdate.getFullYear() + ' ' + ('0' + startdate.getHours()).slice(-2) + ':' + ('0' + startdate.getMinutes()).slice(-2);
      enddate = new Date(rows[0].enddate);
      enddateStr = ('0' + (enddate.getMonth() + 1)).slice(-2) + '/' + ('0' + enddate.getDate()).slice(-2) + '/' + enddate.getFullYear() + ' ' + ('0' + enddate.getHours()).slice(-2) + ':' + ('0' + enddate.getMinutes()).slice(-2);

      contestName = rows[0].name;
      contestDescription = rows[0].description;
      contestType = rows[0].type;
      contestVisibility = rows[0].visibility;

      db.execute(config, database => database.query(`SELECT * FROM contestThemes WHERE contestId = '${cmd}' ORDER BY startdate`)
      .then(rows => {

        if (rows.length < 1) {
          themes.push('not set')
        } else {

          for (let i = 0; i < rows.length; i++) {
            let themeStart = new Date(rows[i].startdate);
            // if the startdate of the theme is in the future && its a hidden contest hide the theme
            if (themeStart > currentDate && contestVisibility == 'hidden') {
              themes.push('- ' + '\\*'.repeat(rows[i].name.length));
            } else {
              themes.push(`- ${rows[i].name}`);
            }
          }

        }

        let embed = new Discord.RichEmbed()
        .setAuthor('Contest!', (contestVisibility == 'hidden') ? 'https://ice-creme.de/images/jabstat/hidden-icon.jpg' : 'https://ice-creme.de/images/jabstat/public-icon.jpg')
        .setTitle(contestName)
        .setDescription(`${contestDescription}\n\n*This is a ${contestType} contest*`)
        .setColor((contestVisibility == 'hidden') ? '#e74c3c' : '#3498db')
        .addBlankField()
        .addField('Start', startdateStr, true)
        .addField('Deadline', enddateStr, true)
        .addField('Themes:', `${themes.join('\n')}`)
        .setFooter(`beep boop • contest ID: ${cmd}`, client.user.avatarURL);
        message.channel.send({embed: embed});

        return;
      }))
      .catch(err => {
        throw err;
      });
    }))
    .catch(err => {
      throw err;
    });
  } else if (cmd == 'list') {
    let contests = [];
    db.execute(config, database => database.query(`SELECT * FROM contest ORDER BY startdate`)
    .then(rows => {
      if (rows.length < 1) return message.channel.send(`There are no contests :sad_cett:`);

      for (let i = 0; i < rows.length; i++) {
        let contestStartDate = new Date(rows[i].startdate);
        let contestEndDate = new Date(rows[i].enddate);

        // if the contest enddate is in the past -> line through
        if (contestEndDate < currentDate) {
          contests.push(`\`${rows[i].id}\` | \t~~${rows[i].name}~~`);
        } else {
          contests.push(`\`${rows[i].id}\` | \t${rows[i].name}`);
        }
      }

      let embed = new Discord.RichEmbed()
      .setAuthor('Contest list')
      .setDescription('type `>contest ID` to get more informations')
      .addBlankField()
      // add Field "there are currently X contests" OR "there are no contests at the moment"
      .addField('All contests:', `${contests.join('\n')}`)
      .setColor('#3498db')
      .setFooter(`beep boop`, client.user.avatarURL);
      message.channel.send({embed: embed});

      return;
    }))
    .catch(err => {
      throw err;
    });
  } else if (cmd == 'help') {
    message.channel.send('help command');
  } else {
    message.channel.send('type `>contest help` for more informations');
  }

}

module.exports.help = {
  name: 'contest',
  alias: 'c',
  description: 'more information for current contests',
  usage: '',
  admin: false
}
