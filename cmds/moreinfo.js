const Discord = require('discord.js');

module.exports.run = async(client, message, args, con) => {

  responses = [
    {wrong: 'I get Syntax Error please help', right: 'I got the following error in C#, can someone please help?\nSyntax Error, \':\' expected\n\nThis is my code:\n(code here)'},
    {wrong: 'I need help with code it doesn\'t work', right: 'I have the following Python code but when I run it it doesn\'t work nor does it give an error:\n(code here)'}
  ];

  chosenResponse = responses[Math.floor(Math.random()*responses.length)];

  let embed = new Discord.RichEmbed()
  .setTitle("Please provide more information!")
  .setDescription(`We want to help you but to do that we need more information.\n For example, instead of asking: \n\`\`\`\n${chosenResponse.wrong}\n\`\`\`\nInstead ask: \n\`\`\`\n${chosenResponse.right}\n\`\`\``)
  .addBlankField()
  .addField('Please make sure your question contains the following:', '- A code snippet\n\n- The programming language of that snippet\n\n- A good and in-depth explanation what you want to achieve with that code and what went wrong')
  .setColor('#428ff4')
  .addBlankField()
  .setFooter('Thank you - Your mod team • temporarily stolen from XP-Bot till he\'s alive again');

  message.channel.send(embed);

  message.delete();
}

module.exports.help = {
  name: 'moreinfo',
  alias: 'info',
  description: 'output a "Please provide more information!" message',
  usage: '',
  admin: false
}
