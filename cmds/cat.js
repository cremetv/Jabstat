const Discord = require('discord.js');
const cat = require('../apis/cat');

module.exports.run = async(client, message, args, con) => {

    const cmd = args[0];

    /****************
    * Get a random cat
    * >cat | >cat random
    ****************/
    if (!cmd || cmd === 'random') {
        try {
            const catpic = await cat.getCat();
            message.channel.send({
                files: [catpic.webpurl]
            });
        } catch (error) {
            message.channel.send(error.message);
        }
    }



    /****************
    * Get a cat by id
    * >cat <id>
    ****************/
    else if (/^\d+$/.test(cmd)) {
        try {
            const catpic = await cat.getCat(cmd);
            message.channel.send({
                files: [catpic.webpurl]
            });
        } catch (error) {
            message.channel.send('this catpic doesn\'t exist 🐱');
        }
    }



    /****************
    * Help List
    * >cat help
    ****************/
    else if (cmd === 'help' || cmd === 'h') {
        let helplist = [
            'use >cat or >🐱',
            '>cat | >cat random\n===\nget a random cat',
            '>cat <id>\n===\nget a cat by id',
            '>cat help\n===\nget this help box'
        ];

        const embed = new Discord.MessageEmbed()
        .setAuthor('🐱 help')
        .setDescription(`\`\`\`MD\n${helplist.join('\n\n')}\`\`\``)
        .setColor('#3498db')
        .setFooter('beep boop • catapi by Copy#8283', client.user.avatarURL())

        message.channel.send(embed);
    }



    else {
        message.channel.send('🐱 meow');
    }
}

module.exports.help = {
    name: 'cat',
    alias: '🐱',
    description: 'Get cute pics :3',
    usage: '>cat help',
    admin: false
}