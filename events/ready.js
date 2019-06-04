const Discord = require('discord.js');
const logger = require('./../utility/logger');
const logColor = require('./../utility/logcolors');
// const consoleLog = '\x1b[46m\x1b[30m%s\x1b[0m';

module.exports = (client) => {
  console.log(logColor.blackBlue, `${client.user.username} is ready to steal your data >:)`);
  logger.info(`Bot started | ${Date.now()}`);

  let activity = [
    'collecting data',
    'stealing your data',
    'extracting stats',
    'collecting stats',
    'give me your data',
    'stealing your informations',
    'borrowing user data',
    'stealing user data',
    'pretend to be google',
    'stealing userdata 101',
    'statistics for dummies',
    'how to steal data',
    'charts'
  ];

  client.user.setActivity(`${activity.random()}`, {type: 'WATCHING'});

  setInterval(() => {
    client.user.setActivity(`${activity.random()}`, {type: 'WATCHING'});
  }, 1000 * 60 * 3);
}

Array.prototype.random = function() {
 return this[Math.floor((Math.random()*this.length))];
}
