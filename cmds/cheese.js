const Discord = require('discord.js');
const cheese = require('./../utility/cheese');

module.exports.run = async(client, message, args, con) => {

    cheese.getCheese();

}

module.exports.help = {
    name: 'cheese',
    alias: '🧀',
    description: 'cheesy',
    usage: '',
    admin: false
}