const Discord = require('discord.js');
const cheese = require('say-cheese-node-wrapper');



const makeCheeseEmbed = (client, theCheese) => {
    console.log('make embed', theCheese);
    const embed = new Discord.MessageEmbed()
    .setThumbnail(theCheese.image)
    .setDescription(`${theCheese.description}\n\n${theCheese.attributes.made}`)
    .setColor('#F0E838')
    .addField('Milks', theCheese.milks.join('\n'), true)
    .setFooter('beep boop • api: illu\'s say-cheese', client.user.avatarURL());

    for (const attr in theCheese.attributes) {
        if (theCheese.attributes[attr] != null && attr != 'made') {
            if (Array.isArray(theCheese.attributes[attr])) {
                if (theCheese.attributes[attr].length > 0) {
                    embed.addField(attr, theCheese.attributes[attr].join('\n'), true);
                }
            } else {
                embed.addField(attr, theCheese.attributes[attr], true);
            }
        }
    }
    embed.addField('\u200b', '\u200b');

    return embed;
}



const getCheeseOfTheDay = async() => {
    const cheeseOfTheDay = await cheese.today();
    
    console.log('cheese', cheeseOfTheDay);

    // if api failed
    if (cheeseOfTheDay.failed === true) throw new Error('There\'s something wrong with all my 🧀. Try it later.');

    return cheeseOfTheDay.cheese;
}



const postCheeseOfTheDay = async(client) => {
    const cheeseOfTheDay = await getCheeseOfTheDay();

    // if api failed
    if (cheeseOfTheDay.failed === true) throw new Error('There\'s something wrong with all my 🧀. Try it later.');

    // const dentist = client.users.cache.find(u => u.username == 'HygienicDentist250');
    // if (!dentist) throw new Error('Couldn\'t find the 🧀 Master 😢');

    const embed = makeCheeseEmbed(client, cheeseOfTheDay);
    embed.setTitle(`Cheese of the Day: ${cheeseOfTheDay.cheese_name}`)
    .setAuthor('HygienicDentist250', 'https://cdn.discordapp.com/avatars/445747314326241280/a_81d73c5bf10fd912fd9429f0fc4c0771.gif?size=256');
    // .setAuthor(dentist.username, dentist.avatarURL())

    const shareChannel = client.channels.cache.find(c => c.name == 'log');

    if (!shareChannel) throw new Error('Couldn\'t find the share-stuff channel');
        
    shareChannel.send(embed);
}



const getCheese = async(query) => {
    let theCheese = query ? await cheese.search(query) : await cheese.random();

    // if api failed
    if (theCheese.failed === true) throw new Error('There\'s something wrong with all my 🧀. Try it later.');

    // if theCheese is an array from the query get the first result
    if (Array.isArray(theCheese.cheeses)) theCheese = theCheese.cheeses[0];

    if (theCheese === undefined) throw new Error('couldn\'t find the 🧀 :(');

    return theCheese.cheese || theCheese;   
}



exports.makeCheeseEmbed = makeCheeseEmbed;
exports.getCheeseOfTheDay = getCheeseOfTheDay;
exports.postCheeseOfTheDay = postCheeseOfTheDay;
exports.getCheese = getCheese;
