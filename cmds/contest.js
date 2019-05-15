const config = module.require('./../utility/config.js');
const Discord = require('discord.js');

module.exports.run = async(client, message, args, db) => {

  if (args[0]) {
    db.execute(config, database => database.query(`SELECT * FROM contest WHERE id = '${args[0]}'`)
    .then(rows => {
      if (rows.length < 1) return message.channel.send(`Couldn't find the contest`);
      let embed = new Discord.RichEmbed()
      .setTitle(`${rows[0].name} - Contest`)
      .setDescription(`${rows[0].description}`)
      .setColor('AQUA')
      .setFooter(`beep boop`, client.user.avatarURL);
      message.channel.send({embed: embed});
      return;
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
