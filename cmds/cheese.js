const Discord = require('discord.js');
const cheese = require('../apis/cheese');

module.exports.run = async(client, message, args, con) => {

    const cmd = args[0];

    /****************
    * Get a random cheese
    * >cheese | >cheese random
    ****************/
    if (!cmd || cmd === 'random') {
        try {
            const randomCheese = await cheese.getCheese();
            const embed = cheese.makeCheeseEmbed(client, randomCheese);
            embed.setTitle(randomCheese.name);
            message.channel.send(embed);
        } catch (error) {
            message.channel.send(error.message);
        }
    }



    /****************
    * Get the Cheese of the Day
    * >cheese today
    ****************/
    else if (cmd === 'today') {
        try {
            const cheeseOfTheDay = await cheese.getCheeseOfTheDay();
            const embed = cheese.makeCheeseEmbed(client, cheeseOfTheDay);
            embed.setTitle(`Cheese of the Day: ${cheeseOfTheDay.cheese_name}`)
            message.channel.send(embed);
        } catch (error) {
            message.channel.send(error.message);
        }
    }



    /****************
    * Help List
    * >cheese help
    ****************/
    else if (cmd === 'help' || cmd === 'h') {
        let helplist = [
            'use >cheese or >🧀',
            '>cheese | >cheese random\n===\nget a random cheese',
            '>cheese today\n===\nget the cheese of the day',
            '>cheese [query]\n===\nsearch for a cheese',
            '>cheese help\n===\nget this help box'
        ];

        const embed = new Discord.MessageEmbed()
        .setAuthor('🧀 help')
        .setDescription(`\`\`\`MD\n${helplist.join('\n\n')}\`\`\``)
        .setColor('#3498db')
        .setFooter('beep boop', client.user.avatarURL())

        message.channel.send(embed);
    }



    /****************
    * Search for a cheese
    * >cheese [query]
    ****************/
    else {
        try {
            const theCheese = await cheese.getCheese(cmd);
            const embed = cheese.makeCheeseEmbed(client, theCheese);
            embed.setTitle(theCheese.name);
            message.channel.send(embed);
        } catch (error) {
            message.channel.send(error.message);
        }
    }

}

module.exports.help = {
    name: 'cheese',
    alias: '🧀',
    description: 'Get all facts about your favourite cheese!',
    usage: '>cheese help',
    admin: false
}