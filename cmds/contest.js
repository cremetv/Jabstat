const config = module.require('./../utility/config.js');
const Discord = require('discord.js');

module.exports.run = async(client, message, args, db) => {

  let startdate, enddate, contestName, contestDescription, contestType, contestVisibility, typeImage;
  let themes = [];

  if (args[0]) {
    db.execute(config, database => database.query(`SELECT * FROM contest WHERE id = '${args[0]}'`)
    .then(rows => {
      if (rows.length < 1) return message.channel.send(`Couldn't find the contest`);

      startdate = new Date(rows[0].startdate);
      startdateStr = ('0' + (startdate.getMonth() + 1)).slice(-2) + '/' + ('0' + startdate.getDate()).slice(-2) + '/' + startdate.getFullYear() + ' ' + ('0' + startdate.getHours()).slice(-2) + ':' + ('0' + startdate.getMinutes()).slice(-2);
      enddate = new Date(rows[0].enddate);
      enddateStr = ('0' + (enddate.getMonth() + 1)).slice(-2) + '/' + ('0' + enddate.getDate()).slice(-2) + '/' + enddate.getFullYear() + ' ' + ('0' + enddate.getHours()).slice(-2) + ':' + ('0' + enddate.getMinutes()).slice(-2);

      contestName = rows[0].name;
      contestDescription = rows[0].description;
      contestType = rows[0].type;
      contestVisibility = rows[0].visibility;

      db.execute(config, database => database.query(`SELECT * FROM contestThemes WHERE contestId = '${args[0]}' ORDER BY startdate`)
      .then(rows => {

        if (rows.length < 1) {
          themes.push('not set')
        } else {

          for (let i = 0; i < rows.length; i++) {
            let themeStart = new Date(rows[i].startdate);
            // if the startdate of the theme is in the future && its a hidden contest hide the theme
            if (themeStart > startdate && contestVisibility == 'hidden') {
              themes.push('- ' + '\\*'.repeat(rows[i].name.length));
            } else {
              themes.push(`- ${rows[i].name}`);
            }
          }

        }

        let embed = new Discord.RichEmbed()
        .setAuthor('Contest!', (contestVisibility == 'hidden') ? 'https://ice-creme.de/images/jabstat/hidden-icon.jpg' : 'https://ice-creme.de/images/jabstat/public-icon.jpg')
        .setTitle(contestName)
        .setDescription(`${contestDescription}\n\nThis is a ${contestType} contest`)
        .setColor((contestVisibility == 'hidden') ? '#e74c3c' : '#3498db')
        .addBlankField()
        .addField('Start', startdateStr, true)
        .addField('Deadline', enddateStr, true)
        .addField('Themes:', `${themes.join('\n')}`)
        .setFooter(`beep boop • contest ID: ${args[0]}`, client.user.avatarURL);
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
  } else {
    let contests = [];
    db.execute(config, database => database.query(`SELECT * FROM contest`)
    .then(rows => {
      if (rows.length < 1) return message.channel.send(`There are no contests :sad_cett:`);
      for (let i = 0; i < rows.length; i++) {
        contests.push(`[${rows[i].id}] \t${rows[i].name}`);
      }

      let embed = new Discord.RichEmbed()
      .setTitle('Contest list:')
      .setDescription(`${contests.join('\n')}`)
      .setColor('AQUA')
      .setFooter(`beep boop`, client.user.avatarURL);
      message.channel.send({embed: embed});

      return;
    }))
    .catch(err => {
      throw err;
    });
  }

}

module.exports.help = {
  name: 'contest',
  alias: 'c',
  description: 'more information for current contests',
  usage: '',
  admin: false
}
