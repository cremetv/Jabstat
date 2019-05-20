const config = module.require('./../utility/config.js');
const Discord = require('discord.js');

module.exports.run = async(client, message, args, db) => {

  let messageID = args[0];

  message.channel.fetchMessage(messageID).then(msg => {
    let msgGuildID = message.guild.id;
    let msgChannelID = message.channel.id;
    let msgID = message.id;

    let embed = new Discord.RichEmbed()
    .setTitle('Contest XY')
    // .setAuthor('link', 'https://ice-creme.de/images/jabstat/hidden-icon.jpg', `https://discordapp.com/channels/${msgGuildID}/${msgChannelID}/${messageID}`)
    .setColor('#bada55')
    // .addField('message', msg.content);
    .addField('Participants', `- [creme](https://discordapp.com/channels/${msgGuildID}/${msgChannelID}/${messageID})\n- [sei](https://discordapp.com/channels/${msgGuildID}/${msgChannelID}/${messageID})\n- [asdf](https://discordapp.com/channels/${msgGuildID}/${msgChannelID}/${messageID})`)

    console.log(msg.reactions);

    message.channel.send({embed: embed});
    return;
  });

}

module.exports.help = {
  name: 'fetch',
  alias: '',
  description: 'more information for current contests',
  usage: '',
  admin: false
}
