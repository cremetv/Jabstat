const fs = require('fs');
const Discord = require('discord.js');

module.exports.run = async(client, message, args, con) => {
  console.log('help command');
  message.channel.send('test');
}

module.exports.help = {
  name: 'help',
  description: 'show all commands',
  usage: '',
  admin: false
}
