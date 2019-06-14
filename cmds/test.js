const Discord = require('discord.js');
// const Canvas = require('canvas');

module.exports.run = async(client, message, args, con) => {

  const selectedServer = '343771301405786113';
  const contestChannel = client.channels.get(selectedServer);

  contestChannel.fetchMessage('588702161727258636').then(msg => {
    msg.reactions.forEach(reaction => {
      console.log('***************************');
      console.log(reaction.emoji.reaction.count);
      contestChannel.send(`${reaction.emoji.name} (${reaction.emoji.reaction.count})`);
      console.log('***************************');
    });
  })
  .catch(err => {
    logger.error(err, {logType: 'error', time: Date.now()});
    throw err;
  });

}

module.exports.help = {
  name: 'test',
  description: 'test',
  usage: '',
  admin: false
}
