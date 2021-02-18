const Discord = require('discord.js');
const cat = require('@thatcopy/catapi');



const getCat = async(id) => {
    const catpic = id ? await cat.id(id) : await cat.random();

    console.log('cat', catpic);

    if (catpic === undefined) throw new Error('couldn\'t find a 🐱 :(');

    return catpic;
};



exports.getCat = getCat;