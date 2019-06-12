const Discord = require('discord.js');
// const Canvas = require('canvas');

module.exports.run = async(client, message, args, con) => {

	// const canvas = Canvas.createCanvas(700, 250);
	// const ctx = canvas.getContext('2d');
  //
	// const background = await Canvas.loadImage('./../web/public/images/bot-logo.png');
	// ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
	// const attachment = new Discord.Attachment(canvas.toBuffer(), 'bot.png');
  // message.channel.send(`test`, attachment);
}

module.exports.help = {
  name: 'canvas',
  description: 'canvas test',
  usage: '',
  admin: false
}
