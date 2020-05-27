const config = module.require('./../utility/config.js');
const Discord = require('discord.js');
const functions = require('./../utility/contest');
const logger = require('./../utility/logger');
const logColor = require('./../utility/logcolors');

const botsettings = require('./../botsettings.json');
const serverId = botsettings.serverId;
const contestChat = botsettings.contestChat;
const contestRole = botsettings.contestRole;

module.exports.run = async(client, message, args, db) => {

  const cmd = args[0];

  let startdate, enddate;

  let currentDate = new Date();

  const formatDate = (rawDate) => {
    let date = new Date(rawDate);
    let dateStr = ('0' + date.getDate()).slice(-2) + '.' + ('0' + (date.getMonth() + 1)).slice(-2) + '.' + date.getFullYear() + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
    return {
      date: date,
      dateStr: dateStr
    }
  }


  function delay() {return new Promise(resolve => seTimeout(resolve, 300));}
  async function delayedLog(item) {await delay();}


  if (!cmd) {
    /****************
    *
    * Show current contest if available
    * >c
    *
    ****************/
    let contest, participants = [], votelink, voted;

    db.execute(config, database => database.query(`SELECT * FROM cont_contests WHERE active = 1 AND NOW() BETWEEN startdate AND enddate`)
    .then(rows => {
      if (rows.length < 1) {
        throw new Error('no contest');
      }

      contest = rows[0];

      voteLink = contest.votelink;
      voted = contest.voted;
      startdate = formatDate(contest.startdate);
      enddate = formatDate(contest.enddate);

      return database.query(`SELECT * FROM cont_submissions WHERE contestId = '${contest.id}'`);
    })
    .then(rows => {
      rows.forEach(r => {
        let participant = {};
        participant.id = r.userId;
        participant.submission = r.submission;
        participant.submissionLink = r.submissionLink;
        participants.push(participant);
      });
      console.log('list of participants:');
      console.log(participants);

      let participantString = [];

      /* loop the submissions */
      function asyncFunction(user, callback) {
        setTimeout(() => {
          client.fetchUser(user.id).then(u => {
            console.log('username', u.username);
            participantString.push(`[${u.username}](${user.submissionLink})`);
          }).then(() => {
            console.log('done with', user.id);
            callback();
          });
        }, 100);
      }

      let requests = participants.reduce((promiseChain, user) => {
        return promiseChain.then(() => new Promise((resolve) => {
          asyncFunction(user, resolve);
        }));
      }, Promise.resolve());

      /* after submissions are looped send the embed */
      requests.then(() => {
        let voteLinkStr = '';
        if (voteLink) voteLinkStr = `\n\n[Vote link](${voteLink})`;

        // contest detail embed
        let embed = new Discord.RichEmbed()
        .setAuthor('Contest!', 'https://ice-creme.de/images/jabstat/public-icon.jpg')
        .setTitle(contest.name)
        .setDescription(`${contest.description}\n\nadd \`>contest submit ${contest.id}\` to your submission\n\n24 hour voting will start after the deadline.${voteLinkStr}`)
        .setColor('#3498db')
        .addField('Start', startdate.dateStr, true)
        .addField('Deadline', enddate.dateStr, true)
        .setFooter(`beep boop • contest ID: ${contest.id} • Dates: dd.mm.yyyy UTC`, client.user.avatarURL);

        let participantEmbed = new Discord.RichEmbed()
        .setDescription('click on the names to see the submission')
        .setColor('#3498db')
        .addField('Submissions:', `- ${participantString.join('\n- ')}`);

        message.channel.send({embed: embed}).then(() => {
          message.channel.send({embed: participantEmbed});
        });
      });

    }))
    .catch(err => {
      if (err.message === 'no contest') {
        message.channel.send(`There is currently no contest running`);
      } else {
        logger.error(err, {logType: 'error', time: Date.now()});
        throw err;
      }
    });


  } else if (/^\d+$/.test(cmd)) {
    /****************
    *
    * Contest lookup command
    * >c <id>
    *
    ****************/
    let contest, participants = [];

    db.execute(config, database => database.query(`SELECT * FROM cont_contests WHERE active = 1 AND id = '${cmd}'`)
    .then(rows => {
      if (rows.length < 1) {
        throw new Error('no contest');
      }

      contest = rows[0];

      voteLink = contest.votelink;
      startdate = formatDate(contest.startdate);
      enddate = formatDate(contest.enddate);

      let contestStartDate = new Date(contest.startdate);
      if (contestStartDate > currentDate) {
        throw new Error('not public yet');
      }

      return database.query(`SELECT * FROM cont_submissions WHERE contestId = '${contest.id}'`);
    })
    .then(rows => {
      rows.forEach(r => {
        let participant = {};
        participant.id = r.userId;
        participant.submission = r.submission;
        participant.submissionLink = r.submissionLink;
        participants.push(participant);
      });
      console.log('list of participants:');
      console.log(participants);

      let participantString = [];

      function asyncFunction(user, callback) {
        setTimeout(() => {
          client.fetchUser(user.id).then(u => {
            console.log('username', u.username);
            participantString.push(`[${u.username}](${user.submissionLink})`);
          }).then(() => {
            console.log('done with', user.id);
            callback();
          });
        }, 100);
      }

      let requests = participants.reduce((promiseChain, user) => {
        return promiseChain.then(() => new Promise((resolve) => {
          asyncFunction(user, resolve);
        }));
      }, Promise.resolve());

      requests.then(() => {
        let voteLinkStr = '';
        if (voteLink) voteLinkStr = `\n\n[Vote link](${voteLink})`;

        // contest detail embed
        let embed = new Discord.RichEmbed()
        .setAuthor('Contest!', 'https://ice-creme.de/images/jabstat/public-icon.jpg')
        .setTitle(contest.name)
        .setDescription(`${contest.description}\n\nadd \`>contest submit ${contest.id}\` to your submission\n\n24 hour voting will start after the deadline.${voteLinkStr}`)
        .setColor('#3498db')
        .addField('Start', startdate.dateStr, true)
        .addField('Deadline', enddate.dateStr, true)
        .setFooter(`beep boop • contest ID: ${contest.id} • Dates: dd.mm.yyyy UTC`, client.user.avatarURL);

        let participantEmbed = new Discord.RichEmbed()
        .setDescription('click on the names to see the submission')
        .setColor('#3498db')
        .addField('Submissions:', `- ${participantString.join('\n- ')}`);

        message.channel.send({embed: embed}).then(() => {
          message.channel.send({embed: participantEmbed});
        });
      });
    }))
    .catch(err => {
      if (err.message === 'no contest') {
        message.channel.send(`There is no contest with the id \`${cmd}\``);
      } else if (err.message === 'not public yet') {
        message.channel.send(`This contest isn't public yet`);
      } else {
        logger.error(err, {logType: 'error', time: Date.now()});
        throw err;
      }
    });


} else if (cmd == 'submit' || cmd == 's') {
  /****************
  *
  * Submit Contest Entry
  * >c submit <id>
  *
  * command has to be executed with an attachment
  *
  ****************/
  let submission, contest, user, contestId = args[1];

  message.attachments.forEach(att => {
    submission = att.url;
  });

  let submissionLink = `https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`;

  if (isNaN(contestId)) {
    message.reply('please provide a proper contest Id');
    return message.delete();
  }

  db.execute(config, database => database.query(`SELECT * FROM cont_contests WHERE active = 1 AND id = '${contestId}'`)
  .then(rows => {
    if (rows.length < 1) {
      throw new Error('no contest');
    }

    contest = rows[0];

    if (contest.startdate > currentDate) {
      throw new Error('did not start');
    } else if (contest.enddate < currentDate) {
      throw new Error('contest over');
    }

    if (!submission) return message.reply('please add an attachment to your submission');

    return database.query(`SELECT * FROM cont_submissions WHERE contestId = '${contest.id}' AND userId = '${message.author.id}'`);
  })
  .then(rows => {
    if (rows.length > 0) {
      throw new Error('already submitted');
    }

    return database.query(`INSERT INTO cont_submissions (contestId, userId, submission, submissionLink) VALUES ('${contestId}', ${message.author.id}, '${submission}', '${submissionLink}')`);
  })
  .then(rows => {
    message.react("👍");
    logger.info(`\x1b[92m${message.author.username} added a submission to contest ${contestId}\x1b[0m`, {logType: 'log', time: Date.now()});
  }))
  .catch(err => {
    if (err.message === 'no contest') {
      message.channel.send('Couldn\'t find this contest');
      message.delete();
    } else if (err.message === 'did not start') {
      message.channel.send('This contest didn\'t even start yet');
      message.delete();
    } else if (err.message === 'contest over') {
      message.channel.send('Too late. This contest is already over');
      message.delete();
    } else if (err.message === 'already submitted') {
      message.reply('you already submitted something to this contest. You can delete it with `>contest submitdelete <id>`');
      message.delete();
    } else {
      logger.error(err, {logType: 'error', time: Date.now()});
      throw err;
    }
  });


} else if (cmd == 'submitdelete' || cmd == 'sd') {
  /****************
  *
  * Delete contest submissions
  * >c submitdelete [id]
  *
  ****************/
  let contestId = args[1], user;

  if (!contestId) return message.channel.send('please provide a contest ID');

  db.execute(config, database => database.query(`SELECT * FROM cont_contests WHERE active = 1 AND id = '${contestId}'`)
  .then(rows => {
    let contestEnd = formatDate(rows[0].enddate);

    if (contestEnd.date <= currentDate) {
      throw new Error('contest ended');
    }

    return database.query(`SELECT * FROM cont_submissions WHERE contestId = '${contestId}' AND userId = '${message.author.id}'`);
  })
  .then(rows => {
    if (rows.length < 1) {
      throw new Error('no submission');
    }
    return database.query(`DELETE FROM cont_submissions WHERE userId = '${message.author.id}' AND contestId = '${contestId}'`);
  })
  .then(() => {
    message.channel.send('submission deleted!');
    logger.info(`\x1b[91m${message.author.username} removed his submission from contest ${contestId}\x1b[0m`, {logType: 'log', time: Date.now()});
  }))
  .catch(err => {
    if (err.message === 'contest ended') {
      message.channel.send('this contest ended already');
    } else if (err.message === 'no submission') {
      message.channel.send('you dont have a submission for this contest');
    } else {
      logger.error(err, {logType: 'error', time: Date.now()});
      throw err;
    }
  });


} else if (cmd == 'list' || cmd == 'l') {
  /****************
  *
  * List contests
  * >c list [option]
  *
  * available options:
  * --open --closed --current --voting
  *
  ****************/
  let contests = [], option = args[1], statement, title;

  switch (option) {
    case '--open':
      statement = 'WHERE active = 1 AND enddate >= NOW()';
      title = 'open contests\n';
      break;
    case '--closed':
      statement = 'WHERE active = 1 AND enddate <= NOW()';
      title = 'already closed contests\n';
      break;
    case '--current':
      statement = 'WHERE active = 1 AND NOW() BETWEEN startdate AND enddate';
      title = 'currently running contests\n';
      break;
    case '--voting':
      statement = 'WHERE active = 1 AND votelink IS NOT NULL AND enddate >= NOW() - INTERVAL 1 DAY AND enddate <= NOW()';
      title = 'contests where you can vote\n';
      break;
    default:
      statement = 'WHERE active = 1';
      title = '';
      if (option) {
        message.channel.send('option doesn\'t exist. here is the full list:');
      }
  }

  db.execute(config, database => database.query(`SELECT * FROM cont_contests ${statement} ORDER BY startdate DESC LIMIT 10`)
  .then(rows => {
    if (rows.length < 1) {
      throw new Error('no contests');
    }

    rows = rows.reverse();

    rows.forEach(contest => {
      let contestStartDate = new Date(contest.startdate);
      let contestEndDate = new Date(contest.enddate);
      if (contestEndDate < currentDate) {
        // ended contest
        contests.push(`\`${contest.id}\` | \t~~${contest.name}~~`);
      } else if (contestStartDate <= currentDate && contestEndDate >= currentDate) {
        // current contest
        contests.push(`\`${contest.id}\` | \t__**${contest.name}**__`);
      } else {
        // future contest
        // contests.push(`\`${contest.id}\` | \t${contest.name}`);
        contests.push(`\`${contest.id}\` | \t||tba 👀||`);
      }
    });
  })
  .then(() => {
    let embed = new Discord.RichEmbed()
    .setAuthor('Contest list')
    .setDescription(`${title}type \`>contest <id>\` to get more informations`)
    .addBlankField()
    .addField('All contests:', `${contests.join('\n')}`)
    .setColor('#3498db')
    .setFooter(`beep boop`, client.user.avatarURL);
    message.channel.send({embed: embed});
  }))
  .catch(err => {
    if (err.message === 'no contests') {
      message.channel.send(`Couldn't find any contests`);
    } else {
      logger.error(err, {logType: 'error', time: Date.now()});
      throw err;
    }
  });


  } else if (cmd == 'startvote' || cmd == 'sv') {
    /****************
    *
    * Start voting
    * >c startvote <id>
    *
    ****************/
    if(!message.member.hasPermission('MANAGE_MESSAGES')) return message.channel.send('You don\'t have permissions to use this');

    let contestId = args[1];
    if (isNaN(contestId)) {
      message.reply('please provide a proper contest Id `>c startvote <id>`');
      return message.delete();
    }

    let contest, participants = [], themes = [];

    db.execute(config, database => database.query(`SELECT * FROM contest WHERE active = 1 AND id = '${contestId}'`)
    .then(rows => {
      if (rows.length < 1) {
        throw new Error('no contest');
      }

      contest = rows[0];

      if (contest.votelink) {
        throw new Error('already voting');
      }

      startdate = formatDate(contest.startdate);
      enddate = formatDate(contest.enddate);

      return database.query(`SELECT * FROM contestThemes WHERE contestId = '${contest.id}' ORDER BY startdate`);
    })
    .then(rows => {
      if (rows.length < 1) {
        themes.push('not set');
      } else {
        for (let i = 0; i < rows.length; i++) {
          let themeStart = formatDate(rows[i].startdate);
          let themeEnd = formatDate(rows[i].enddate);

          // if the startdate of the theme is in the future && its a hidden contest hide the theme
          if (themeStart.date > currentDate && contest.visibility == 'hidden') {
            themes.push('- ' + '\\*'.repeat(rows[i].name.length));
          } else if (themeEnd.date < currentDate) {
            // if the theme is already over => line through
            themes.push(`- ~~${rows[i].name}~~`);
          } else if (themeStart.date <= currentDate && themeEnd.date >= currentDate) {
            // if the theme is right now => bold & underlined
            themes.push(`- __**${rows[i].name}**__`);
          } else {
            themes.push(`- ${rows[i].name}`);
          }
        }
      }

      return database.query(`SELECT * FROM contestUsers WHERE contestID = '${contest.id}'`);
    })
    .then(rows => {
      function delay() {
        return new Promise(resolve => setTimeout(resolve, 300));
      }

      async function delayedLog(item) {
        await delay();
      }

      async function processUsers(array) {
        for (let i = 0; i < array.length; i++) {
          let participantId = array[i].userID;
          let participantSubmissionLink = array[i].submissionLink;
          db.execute(config, database => database.query(`SELECT * FROM jabusers WHERE id = '${participantId}'`)
          .then(rows => {
            participants[rows[0].username] = participantSubmissionLink;
          }))
          .catch(err => {
            logger.error(err, {logType: 'error', time: Date.now()});
            throw err;
          });

          await delayedLog(array[i]);
        }

        let voteEmotesRaw = ['🥞', '🍗', '🌭', '🍕', '🍙', '🍣', '🍤', '🍦', '🍩', '🍪', '🍫', '🍯', '🍬', '🍭', '🦐', '🍥', '🍘', '🍱', '🥗', '🍲'];
        function shuffle(a) {
          var j, x, i;
          for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
          }
          return a;
        }

        let voteEmotes = shuffle(voteEmotesRaw);

        let participantString = [];

        let i = 0;

        for (let key in participants) {
          if (participants.hasOwnProperty(key)) {
            participantString.push(`${voteEmotes[i]} [${key}](${participants[key]})`);
            i++;
          }
        }

        //
        function delay() {
          return new Promise(resolve => setTimeout(resolve, 300));
        }

        async function delayedReact(item) {
          await delay();
        }
        //

        let tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 24);
        tomorrow = ('0' + tomorrow.getDate()).slice(-2) + '.' + ('0' + (tomorrow.getMonth() + 1)).slice(-2) + '.' + tomorrow.getFullYear() + ' ' + ('0' + tomorrow.getHours()).slice(-2) + ':' + ('0' + tomorrow.getMinutes()).slice(-2);

        // contest detail embed
        let embed = new Discord.RichEmbed()
        .setAuthor('Voting!', 'https://ice-creme.de/images/jabstat/voting.jpg')
        .setTitle(`Contest: ${contest.name}`)
        .setDescription(`${contest.description}\n\nyou have 24 hours to vote.\nVoting will end at ${tomorrow}`)
        .setColor('#2ecc71')
        .addBlankField()
        .addField('Themes:', `${themes.join('\n')}`)
        .addBlankField()
        .addField('Submissions:', `*use the reactions to vote*\n${participantString.join('\n')}`)
        .setFooter(`beep boop • contest ID: ${contest.id} • Dates: dd.mm.yyyy UTC`, client.user.avatarURL);

        message.channel.send(`<@${contestRole}>`).then(msg => {
          message.channel.send({embed: embed}).then(msg => {
            voteLink = `https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
            async function processReacts(array) {
              for (let i = 0; i < array.length; i++) {
                msg.react(`${voteEmotes[i]}`);
                await delayedReact(array[i]);
              }
              console.log('done!');
              db.execute(config, database => database.query(`UPDATE contest SET votelink = '${voteLink}' WHERE id = '${contest.id}'`)
              .then(() => {
                logger.info(`\x1b[93mupdated votelink for contest ${contest.id}\x1b[0m`, {logType: 'log', time: Date.now()});
              }))
              .catch(err => {
                logger.error(err, {logType: 'error', time: Date.now()});
                throw err;
              });
            }
            processReacts(participantString);
          });
        });

      } // processContests

      processUsers(rows);
    }))
    .catch(err => {
      if (err.message === 'no contest') {
        message.channel.send(`There is currently no contest running.`);
      } else if (err.message === 'already voting') {
        message.channel.send(`There is already a voting`);
        let embed = new Discord.RichEmbed()
        .setDescription(`[Go vote!](${contest.votelink})`);
        message.channel.send({embed: embed})
      } else {
        logger.error(err, {logType: 'error', time: Date.now()});
        throw err;
      }
    });


  } else if (cmd == 'help' || cmd == 'h') {
    /****************
    *
    * Help List
    * >c help
    *
    ****************/
    let embed = new Discord.RichEmbed()
    .setAuthor('Contest help')
    .setDescription('```MD\n> use >contest or >c\n\n>contest\n===\nshow the active contest\n\n>contest list [option]\n===\nget a list of all contests\noptions:--open --closed --current --voting\n\n>contest <id>\n===\nget detailed information about that contest\n\n>contest submit <id>\n===\nadd this to an attachment to submit something\n\n>contest submitdelete <id>\n===\ndelete your submission```')
    .setColor('#3498db')
    .setFooter(`beep boop`, client.user.avatarURL);
    message.channel.send({embed: embed});

  } else {
    message.channel.send('type `>contest help` for more informations');
    message.delete();
  }

}

module.exports.help = {
  name: 'contest',
  alias: 'c',
  description: 'use >contest help for all contest commands',
  usage: '',
  admin: false
}
