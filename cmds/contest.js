const config = module.require('./../utility/config.js');
const Discord = require('discord.js');

module.exports.run = async(client, message, args, db) => {

  const cmd = args[0];

  let startdate, enddate, contestName, contestDescription, contestType, contestVisibility, typeImage;
  let themes = [];
  let participants = [];

  let currentDate = new Date();

  // no arg => show current contest Or list if no current contests available
  if (!cmd) {
    message.channel.send('send current contest theme');

  // contest ID => show contest details
  } else if (/^\d+$/.test(cmd)) {
    db.execute(config, database => database.query(`SELECT * FROM contest WHERE id = '${cmd}'`)
    .then(rows => {
      if (rows.length < 1) return message.channel.send(`Couldn't find a contest with id: ${cmd}`);

      startdate = new Date(rows[0].startdate);
      startdateStr = ('0' + (startdate.getMonth() + 1)).slice(-2) + '/' + ('0' + startdate.getDate()).slice(-2) + '/' + startdate.getFullYear() + ' ' + ('0' + startdate.getHours()).slice(-2) + ':' + ('0' + startdate.getMinutes()).slice(-2);
      enddate = new Date(rows[0].enddate);
      enddateStr = ('0' + (enddate.getMonth() + 1)).slice(-2) + '/' + ('0' + enddate.getDate()).slice(-2) + '/' + enddate.getFullYear() + ' ' + ('0' + enddate.getHours()).slice(-2) + ':' + ('0' + enddate.getMinutes()).slice(-2);

      contestName = rows[0].name;
      contestDescription = rows[0].description;
      contestType = rows[0].type;
      contestVisibility = rows[0].visibility;

      db.execute(config, database => database.query(`SELECT * FROM contestThemes WHERE contestId = '${cmd}' ORDER BY startdate`)
      .then(rows => {

        if (rows.length < 1) {
          themes.push('not set')
        } else {

          for (let i = 0; i < rows.length; i++) {
            let themeStart = new Date(rows[i].startdate);
            let themeEnd = new Date(rows[i].enddate);

            // if the startdate of the theme is in the future && its a hidden contest hide the theme
            if (themeStart > currentDate && contestVisibility == 'hidden') {
              themes.push('- ' + '\\*'.repeat(rows[i].name.length));
            } else if (themeEnd < currentDate) {
              // if the theme is already over => line through
              themes.push(`- ~~${rows[i].name}~~`);
            } else if (themeStart <= currentDate && themeEnd >= currentDate) {
              // if the theme is right now => bold & underlined
              themes.push(`- __**${rows[i].name}**__`);
            } else {
              themes.push(`- ${rows[i].name}`);
            }
          }

        }

        db.execute(config, database => database.query(`SELECT * FROM contestUsers WHERE contestID = '${cmd}'`)
        .then(rows => {

          let getParticipants = new Promise((res, rej) => {
            if (rows.length > 0) {
              for (let i = 0; i < rows.length; i++) {
                let participantID = rows[i].userID;
                let participantSubmissionLink = rows[i].submissionLink

                let getUser = new Promise((res1, rej1) => {
                  db.execute(config, database => database.query(`SELECT * FROM jabusers WHERE id = '${participantID}'`)
                  .then(rows => {
                    participants[rows[0].username] = participantSubmissionLink;
                    res1();
                  }))
                  .catch(err => {
                    throw err;
                  });
                });


                getUser.then(() => {
                  res();
                }, (err) => {
                  console.error(err);
                });
              } // loop users
            } else {
              res();
            }
          });


          getParticipants.then(() => {

            // contest detail embed
            let embed = new Discord.RichEmbed()
            .setAuthor('Contest!', (contestVisibility == 'hidden') ? 'https://ice-creme.de/images/jabstat/hidden-icon.jpg' : 'https://ice-creme.de/images/jabstat/public-icon.jpg')
            .setTitle(contestName)
            .setDescription(`${contestDescription}\n\n*This is a ${contestType} contest*`)
            .setColor((contestVisibility == 'hidden') ? '#e74c3c' : '#3498db')
            .addBlankField()
            .addField('Start', startdateStr, true)
            .addField('Deadline', enddateStr, true)
            .addField('Themes:', `${themes.join('\n')}`)
            .setFooter(`beep boop • contest ID: ${cmd}`, client.user.avatarURL);

            let participantString = [];

            for (let key in participants) {
              if (participants.hasOwnProperty(key)) {
                participantString.push(`[${key}](${participants[key]})`);
              }
            }

            // contest submission list
            let participantEmbed = new Discord.RichEmbed()
            .setDescription('click on the names to see the submission')
            .setColor((contestVisibility == 'hidden') ? '#e74c3c' : '#3498db')
            .addField('Submissions:', `- ${participantString.join('\n- ')}`)
            .setFooter(`beep boop`, client.user.avatarURL);

            message.channel.send({embed: embed}).then(() => {
              message.channel.send({embed: participantEmbed});
            });
          });

        }))
        .catch(err => {
          throw err;
        });

        return;
      }))
      .catch(err => {
        throw err;
      });
    }))
    .catch(err => {
      throw err;
    });

  // submit something
} else if (cmd == 'submit') {
  // >contest submit contestID imageLink
  // adds users submission to the contest list
  let contestID = args[1];
  // let submission = args[2];
  let attachments = message.attachments;
  let userDiscordID = message.author.id;
  let submission, contestStart, contestEnd;

  attachments.forEach(att => {
    let url = att.url;
    console.log(url);
    submission = url;
  });

  let msgGuildID = message.guild.id;
  let msgChannelID = message.channel.id;
  let msgID = message.id;
  let submissionLink = `https://discordapp.com/channels/${msgGuildID}/${msgChannelID}/${msgID}`;

  if (isNaN(contestID)) {
    message.reply('please provide a proper contestID');
    message.delete();
    return;
  }

  if (!submission) {
    message.reply('please add an attachment to your submission');
    message.delete();
    return;
  }

  // check if contest is currently active
  let checkContest = new Promise((res, rej) => {
    db.execute(config, database => database.query(`SELECT * FROM contest WHERE id = '${contestID}'`)
    .then(rows => {
      if (rows.length < 1) {
        message.channel.send(`There is no contest with the ID ${contestID}`);
        message.delete();
        return;
      }

      contestStart = rows[0].startdate;
      contestEnd = rows[0].enddate;
      res(contestStart, contestEnd);
    }))
    .catch(err => {
      throw err;
    });
  });

  checkContest.then((contestStart, contestEnd) => {

    console.log(`currentDate: ${currentDate}`);
    console.log(`contestStart: ${contestStart}`);
    console.log(`contestEnd: ${contestEnd}`);

    // if contest starts in the future
    if (contestStart > currentDate) {
      message.channel.send('This contest didn\'t even start yet.');
      message.delete();
      return;
    // if contest is already closed
    } else if (contestEnd < currentDate) {
      message.channel.send('Too late. This contest is already over :sad_cett:');
      message.delete();
      return;
    // go on
    } else {
      db.execute(config, database => database.query(`SELECT * FROM jabusers WHERE userID = '${userDiscordID}'`)
      .then(rows => {
        let userID = rows[0].id;
        let username = rows[0].username;

        db.execute(config, database => database.query(`SELECT * FROM contestUsers WHERE userID = '${userID}' AND contestID = '${contestID}'`)
        .then(rows => {
          if (rows.length > 0) {
            message.reply('you already submitted something to this contest. You can delete it with `>contest submitdelete ID`')
            message.delete(); // lacking permissions
            return;
          }

          database.query(`INSERT INTO contestUsers (contestID, userID, submission, submissionLink) VALUES ('${contestID}', ${userID}, '${submission}', '${submissionLink}')`);
          message.react("👍");
          console.log(`added ${username}'s submission to contest ${cmd}'`);

        }))
        .catch(err => {
          throw err;
        });
      }))
      .catch(err => {
        throw err;
      });
    }
  });

  // remove submit
} else if (cmd == 'submitdelete') {
  // >contest submitdelete contestID
  // removes users submission from contest
  let userDiscordID = message.author.id;
  let contestID = args[1];

  if (!contestID) return message.channel.send('please provide a contest ID');

  db.execute(config, database => database.query(`SELECT * FROM jabusers WHERE userID = '${userDiscordID}'`)
  .then(rows => {
    let userID = rows[0].id;

    db.execute(config, database => database.query(`SELECT * FROM contestUsers WHERE userID = '${userID}' AND contestID = '${contestID}'`)
    .then(rows => {
      if (rows.length < 1) return message.channel.send('you dont have a submission for this contest');
      database.query(`DELETE FROM contestUsers WHERE userID = '${userID}' AND contestID = '${contestID}'`);
      message.channel.send('submission deleted!');
    }))
    .catch(err => {
      throw err;
    });
  }))
  .catch(err => {
    throw err;
  });

  // contest list
} else if (cmd == 'list') {
    let contests = [];
    db.execute(config, database => database.query(`SELECT * FROM contest ORDER BY startdate`)
    .then(rows => {
      if (rows.length < 1) return message.channel.send(`There are no contests :sad_cett:`);

      for (let i = 0; i < rows.length; i++) {
        let contestStartDate = new Date(rows[i].startdate);
        let contestEndDate = new Date(rows[i].enddate);

        // if the contest enddate is in the past -> line through
        if (contestEndDate < currentDate) {
          contests.push(`\`${rows[i].id}\` | \t~~${rows[i].name}~~`);
        } else if (contestStartDate <= currentDate && contestEndDate >= currentDate) {
          contests.push(`\`${rows[i].id}\` | \t__**${rows[i].name}**__`);
        } else {
          contests.push(`\`${rows[i].id}\` | \t${rows[i].name}`);
        }
      }

      let embed = new Discord.RichEmbed()
      .setAuthor('Contest list')
      .setDescription('type `>contest ID` to get more informations')
      .addBlankField()
      // add Field "there are currently X contests" OR "there are no contests at the moment"
      .addField('All contests:', `${contests.join('\n')}`)
      .setColor('#3498db')
      .setFooter(`beep boop`, client.user.avatarURL);
      message.channel.send({embed: embed});

      return;
    }))
    .catch(err => {
      throw err;
    });

  // contest help
  } else if (cmd == 'help') {
    message.channel.send('help command');
  } else {
    message.channel.send('type `>contest help` for more informations');
    message.delete();
  }

}

module.exports.help = {
  name: 'contest',
  alias: 'c',
  description: 'more information for current contests',
  usage: '',
  admin: false
}
