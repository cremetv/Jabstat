const Discord = require('discord.js');
// const Canvas = require('canvas');

module.exports.run = async(client, message, args, con) => {

  responses = [
    {wrong: 'Does anybody here have a cat?', right: 'How do I stop my cat from coming on to me?'},
    {wrong: 'Does anybody know a nun?', right: 'How do nuns not melt on hot days?'},
    {wrong: 'Is anybody a doctor?', right: 'What do I do if my erection lasts more than 4 hours?'},
    {wrong: 'Is anybody here a hunter?', right: 'How can i kill bears the most efficient way?'},
  ];

  chosenResponse = responses[Math.floor(Math.random()*responses.length)];

  let embed = new Discord.RichEmbed()
  .setTitle('Don\'t ask to ask, just ask')
  .setDescription(`If someone can help, they will; Simply ask your question from the beginning to save everyone time\n\nInstead of asking:\n\`\`\`${chosenResponse.wrong}\`\`\`ask:\n\`\`\`${chosenResponse.right}\`\`\`\n\nYou get help sooner, and we waste less time - win | win`)
  .setColor('#428ff4')
  .setFooter(`Inspired by Tiny Rick Bot • temporarily stolen from XP-Bot till he's alive again`);

  message.channel.send(embed);

  message.delete();
}

module.exports.help = {
  name: 'justask',
  alias: 'ask',
  description: 'output a "Don\'t ask to ask, just ask" message',
  usage: '',
  admin: false
}
