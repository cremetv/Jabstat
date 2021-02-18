const { DiscordAPIError } = require('discord.js');
const Discord = require('discord.js');
const cheese = require('say-cheese-node-wrapper');



const getCheeseOfTheDay = async(client) => {
    const randomCheese = await cheese.today();

    console.log('cheese', randomCheese);

    if (randomCheese.failed == true) return;

    const rc = randomCheese.cheese;

    // const dentist = client.users.cache.find(u => u.username == 'HygienicDentist250
    // ');

    // if (!dentist) return;

    const embed = new Discord.MessageEmbed()
    // .setAuthor(dentist.username, dentist.avatarURL())
    .setAuthor('HygienicDentist250', 'https://cdn.discordapp.com/avatars/445747314326241280/a_81d73c5bf10fd912fd9429f0fc4c0771.gif?size=256')
    .setTitle(`Cheese of the Day: ${rc.cheese_name}`)
    .setThumbnail(rc.image)
    .setDescription(`${rc.description}\n\n${rc.attributes.made}`)
    .setColor('#F0E838')
    .addField('Milks', rc.milks.join('\n'), true)
    .setFooter('beep boop • api: illu\'s say-cheese', client.user.avatarURL());

    for (const attr in rc.attributes) {
        if (rc.attributes[attr] != null && attr != 'made') {
            if (Array.isArray(rc.attributes[attr])) {
                if (rc.attributes[attr].length > 0) {
                    embed.addField(attr, rc.attributes[attr].join('\n'), true);
                }
            } else {
                embed.addField(attr, rc.attributes[attr], true);
            }
        }
    }

    embed.addField('\u200b', '\u200b');

    const shareChannel = client.channels.cache.find(c => c.name == 'log');

    if (shareChannel) {
        shareChannel.send(embed);
    }

}



const getCheese = async(q = 'sviscute') => {
    console.log('q', q);

    const randomCheese = await cheese.random();
    console.log(randomCheese)
}



exports.getCheeseOfTheDay = getCheeseOfTheDay;
exports.getCheese = getCheese;
