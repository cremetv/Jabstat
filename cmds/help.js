const botsettings = require('./../botsettings.json');
const fs = require('fs');
const Discord = require('discord.js');

module.exports.run = async(client, message, args, con) => {

  const prefix = botsettings.prefix;
  let maxLength = 20;

  fs.readdir('./cmds/', (err, files) => {
    if (err) {
      logger.error(err, {logType: 'error', time: Date.now()});
      console.log(err);
    }

    let jsfiles = files.filter(f => f.split('.').pop() === 'js');
    if (jsfiles.length <= 0) {
      logger.info('Help command: No commands found.', {logType: 'log', time: Date.now()});
      return;
    }

    let helpList = [];

    let result = jsfiles.forEach((f, i) => {
      let props = require(`./${f}`);

      helpList.push(`${props.help.name}\n===\n${props.help.description}\nalias: ${prefix}${props.help.alias}\n${prefix}${props.help.name} ${props.help.usage}\n\n`);
    });

    message.react("✉");

    let outputAmount = helpList.length / maxLength;

    let botEmbed = new Discord.RichEmbed()
    .setAuthor('Jabstat', client.user.avatarURL, 'https://github.com/cremetv/Jabstat')
    .setThumbnail(client.user.avatarURL)
    .setColor(`AQUA`)
    .setDescription(`Statistic & Contest Bot made by <@!149232186929709057>\n\nHere is a list of all of my commands:`);

    message.author.send({embed: botEmbed}).then(() => {
      for (let i = 0; i < Math.ceil(outputAmount); i++) {
        let list = helpList.slice(i * maxLength, (i + 1) * maxLength);
        message.author.send(`\`\`\`MD\n${list.join('')}\`\`\``);
      }
    });
  });


}

module.exports.help = {
  name: 'help',
  alias: 'h',
  description: 'show a list of all commands',
  usage: '',
  admin: false
}
