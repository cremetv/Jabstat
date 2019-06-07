const Discord = require('discord.js');
const logger = require('./../utility/logger');
const logColor = require('./../utility/logcolors');

module.exports = (client) => {
  console.log(logColor.blackBlue, `${client.user.username} is ready to steal your data >:)`);
  logger.info('\x1b[92mBot started\x1b[0m', {logType: 'start', time: Date.now()});

  // let activity = [
  //   'collecting data',
  //   'stealing your data',
  //   'extracting stats',
  //   'collecting stats',
  //   'give me your data',
  //   'stealing your informations',
  //   'borrowing user data',
  //   'stealing user data',
  //   'pretend to be google',
  //   'stealing userdata 101',
  //   'statistics for dummies',
  //   'how to steal data',
  //   'charts'
  // ];
  let activity = ['>c help'];

  client.user.setActivity(`${activity.random()}`, {type: 'PLAYING'});

  setInterval(() => {
    client.user.setActivity(`${activity.random()}`, {type: 'PLAYING'});
  }, 1000 * 60 * 3);
}

Array.prototype.random = function() {
 return this[Math.floor((Math.random()*this.length))];
}
