const Discord = require('discord.js');
const db = require('./../utility/databaseconnection');
const config = require('./../utility/config');
const logger = require('./../utility/logger');
const logColor = require('./../utility/logcolors');
const getDate = require('./../utility/date');

let currentDate = new Date();

const formatDate = (rawDate) => {
  let date = new Date(rawDate);
  let dateStr = ('0' + date.getDate()).slice(-2) + '.' + ('0' + (date.getMonth() + 1)).slice(-2) + '.' + date.getFullYear() + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
  return {
    date: date,
    dateStr: dateStr
  }
}


const selectedServer = '582622116617125928'; // Cult of Jabrils
// const selectedServer = '588368200304033822'; // Cremes filthy bot testing area

const contestant = '&588687670490824704'; // Cult of jabrils
// const contestant = '&588700001090273295'; // cremes filthy bot testing area


Object.compare = function (obj1, obj2) {
	//Loop through properties in object 1
	for (var p in obj1) {
		//Check property exists on both objects
		if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;

		switch (typeof (obj1[p])) {
			//Deep compare objects
			case 'object':
				if (!Object.compare(obj1[p], obj2[p])) return false;
				break;
			//Compare function code
			case 'function':
				if (typeof (obj2[p]) == 'undefined' || (p != 'compare' && obj1[p].toString() != obj2[p].toString())) return false;
				break;
			//Compare values
			default:
				if (obj1[p] != obj2[p]) return false;
		}
	}

	//Check object 2 for any extra properties
	for (var p in obj2) {
		if (typeof (obj1[p]) == 'undefined') return false;
	}
	return true;
};


module.exports = {

  /****************
  * get Contest
  ****************/
  getContest: (statement, callback) => {

    db.execute(config, database => database.query(`SELECT * FROM contest ${statement}`)
    .then(rows => {

      callback(rows);

    }))
    .catch(err => {
      logger.error(err, {logType: 'error', time: Date.now()});
      throw err;
    });

  }, // getContest


  getThemes: (id, callback) => {

    db.execute(config, database => database.query(`SELECT * FROM contestThemes WHERE contestId = '${id}' ORDER BY startdate`)
    .then(rows => {

      callback(rows);

    }))
    .catch(err => {
      logger.error(err, {logType: 'error', time: Date.now()});
      throw err;
    });

  }, // getThemes


  checkStarttimes: (client) => {
    let contest, themes = [];

    db.execute(config, database => database.query(`SELECT * FROM contest WHERE active = 1 AND startdate <= NOW() AND startdate > NOW() - INTERVAL 1 HOUR`)
    .then(rows => {
      if (rows.length < 1) {
        throw new Error('nothing found');
        return null;
      }

      contest = rows[0];
      startdate = formatDate(contest.startdate);
      enddate = formatDate(contest.enddate);

      console.log('***************');
      console.log(`starting contest: ${contest.name}`);
      console.log('***************');

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

      let contestTypeStr = '';
      if (themes.length > 1) {
        contestTypeStr = `\n\n*This is a ${contest.type} contest*`;
      }

      let contestEmbed = new Discord.RichEmbed()
      .setAuthor('New Contest!', (contest.visibility == 'hidden') ? 'https://ice-creme.de/images/jabstat/hidden-icon.jpg' : 'https://ice-creme.de/images/jabstat/public-icon.jpg')
      .setTitle(`Contest: ${contest.name}`)
      .setDescription(`${contest.description}${contestTypeStr}\n\nadd \`>contest submit ${contest.id}\` to your submission\n\n24 hour voting will start after the deadline.${voteLinkStr}\n\n*Date: DD.MM.YYYY UTC*`)
      .setColor((contest.visibility == 'hidden') ? '#e74c3c' : '#3498db')
      .addBlankField()
      .addField('Start', startdate.dateStr, true)
      .addField('Deadline', enddate.dateStr, true)
      .addField('Themes:', `${themes.join('\n')}`)
      .setFooter(`beep boop • contest ID: ${contest.id}`, client.user.avatarURL);

      contestChannel.send(`<@${contestant}>`).then(msg => {
        contestChannel.send({embed: contestEmbed});
      });
    }))
    .catch(err => {
      if (err.message == 'nothing found') {
        console.log('no contest found to start');
      } else {
        logger.error(err, {logType: 'error', time: Date.now()});
        throw err;
      }
    });
  }, // checkStarttimes


  checkDeadlines: (client) => {
    const contestChannel = client.channels.get(selectedServer);

    let contest, participants = [], themes = [];

    db.execute(config, database => database.query(`SELECT * FROM contest WHERE active = 1 AND (votelink is NULL or votelink = '') AND enddate >= NOW() - INTERVAL 1 HOUR AND enddate <= NOW()`)
    .then(rows => {
      if (rows.length < 1) {
        throw new Error('nothing found');
        return null;
      }

      contest = rows[0];
      return database.query(`SELECT * FROM contest WHERE active = 1 AND id = '${contest.id}'`);
    })
    .then(rows => {
      startdate = formatDate(rows[0].startdate);
      enddate = formatDate(rows[0].enddate);

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
            if (rows.length < 1) {
              throw new Error('no submissions');
              return null;
            }
            participants[rows[0].username] = participantSubmissionLink;
          }))
          .catch(err => {
            if (err.message == 'no submissions') {
              console.log(`no submissions for contest: ${contest.name} found`);
            } else {
              logger.error(err, {logType: 'error', time: Date.now()});
              throw err;
            }
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
        .setDescription(`${contest.description}\n\nyou have 24 hours to vote.\nVoting will end at ${tomorrow}\n*Date: DD.MM.YYYY UTC*`)
        .setColor('#2ecc71')
        .addBlankField()
        .addField('Themes:', `${themes.join('\n')}`)
        .addBlankField()
        .addField('Submissions:', `*use the reactions to vote*\n${participantString.join('\n')}`)
        .setFooter(`beep boop • contest ID: ${contest.id}`, client.user.avatarURL);

        contestChannel.send(`<@${contestant}>`).then(msg => {
          contestChannel.send({embed: embed}).then(msg => {
            voteLink = `https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
            async function processReacts(array) {
              for (let i = 0; i < array.length; i++) {
                msg.react(`${voteEmotes[i]}`);
                await delayedReact(array[i]);
              }
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
      if (err.message == 'nothing found') {
        console.log('no contest found to start voting');
      } else {
        logger.error(err, {logType: 'error', time: Date.now()});
        throw err;
      }
    });
  }, // checkDeadlines


  checkEndVoting: (client) => {
    const contestChannel = client.channels.get(selectedServer);

    let contest, participants = [], themes = [];

    /****************
    * check for contests to end voting
    ****************/
    db.execute(config, database => database.query(`SELECT * FROM contest WHERE active = 1 AND votelink IS NOT NULL AND voted IS NULL AND enddate <= NOW() - INTERVAL 1 DAY`)
    .then(rows => {
      if (rows.length < 1) {
        throw new Error('nothing found');
        return null;
      }
      rows.forEach(contest => {

        let voteMessageId = contest.votelink.split('/');
        voteMessageId = voteMessageId[voteMessageId.length - 1];

        contestChannel.send(`<@${contestant}> Voting for **${contest.name}** (${contest.id}) ended!`).then(msg => {
          contestChannel.fetchMessage(voteMessageId).then(msg => {

            msg.reactions.forEach(reaction => {
              let user = {};
              user.emote = reaction.emoji.name;
              user.count = reaction.emoji.reaction.count;

              participants.push(user);
            });
          })
          .then(() => {

            db.execute(config, database => database.query(`SELECT * FROM contestUsers WHERE contestID = '${contest.id}'`)
            .then(rows => {
              for (let i = 0; i < rows.length; i++) {
                let userDiscordId = rows[i].discordId;

                participants[i].id = userDiscordId;
                participants[i].submission = rows[i].submission;
              }
            })
            .then(() => {
              // sort for count of emotes
              participants.sort((a, b) => parseFloat(a.count) - parseFloat(b.count));

              // participants.reverse();
              let places = ['1st', '2nd', '3rd'];

              var groupBy = function(xs, key) {
                return xs.reduce(function(rv, x) {
                  (rv[x[key]] = rv[x[key]] || []).push(x);
                  return rv;
                }, {});
              };

              const grouped = Object.entries(groupBy(participants, 'count'));
              grouped.reverse();

              let i = 0;
              let winners = [];
              let winnerImg;

              for (const [count, users] of grouped) {
              	let groupedUsers = [];
              	users.forEach(user => {
              		groupedUsers.push(`[<@${user.id}>](${user.submission})`);
                  if (i = 0) {
                    winnerImg = user.submission;
                  }
              	});
              	// console.log(`${places[i]}: ${groupedUsers.join(', ')} (${count})`);
              	winners.push(`${places[i]}: ${groupedUsers.join(', ')} (${count})`);
              	i++;
              }

              winners = winners.slice(0, 3);


              let embed = new Discord.RichEmbed()
              .setAuthor(`We have a winner!`, 'https://ice-creme.de/images/jabstat/winner.jpg')
              .setTitle(`Contest: ${contest.name}`)
              .setDescription(`${contest.description}`)
              .setThumbnail(winnerImg)
              .setColor('#f1c40f')
              .addBlankField()
              .addField('Result:', `${winners.join('\n')}`)
              .addBlankField()
              .setFooter(`beep boop • contest ID: ${contest.id}`, client.user.avatarURL);

              contestChannel.send({embed: embed});

              switch (winners.length) {
                case 3:
                  database.query(`INSERT INTO contestResults (contestId, winner, winnerCount, second, secondCount, third, thirdCount) VALUES (${contest.id}, '${winners[0].id}', '${winners[0].count}', '${winners[1].id}', '${winners[1].count}', '${winners[2].id}', '${winners[2].count}')`);
                  break;
                case 2:
                  database.query(`INSERT INTO contestResults (contestId, winner, winnerCount, second, secondCount) VALUES (${contest.id}, '${winners[0].id}', '${winners[0].count}', '${winners[1].id}', '${winners[1].count}')`);
                  break;
                case 1:
                  database.query(`INSERT INTO contestResults (contestId, winner, winnerCount) VALUES (${contest.id}, '${winners[0].id}', '${winners[0].count}')`);
                  break;
                default:
                  database.query(`INSERT INTO contestResults (contestId) VALUES (${contest.id})`);
              }
            }))
            .catch(err => {
              logger.error(err, {logType: 'error', time: Date.now()});
              throw err;
            });

          })
          .catch(err => {
            logger.error(err, {logType: 'error', time: Date.now()});
            throw err;
          });
        });

        database.query(`UPDATE contest SET voted = 1 WHERE id = '${contest.id}'`);
      });
    }))
    .catch(err => {
      if (err.message == 'nothing found') {
        console.log('no contest found to end voting');
      } else {
        logger.error(err, {logType: 'error', time: Date.now()});
        throw err;
      }
    });
  }, // checkEndVoting


  manageReactions: (client, messageReaction, user) => {
    db.execute(config, database => database.query(`SELECT * FROM contest WHERE active = 1 AND votelink IS NOT NULL AND voted IS NULL`)
    .then(rows => {
      if (rows.length < 1) {
        throw new Error('nothing found');
        return null;
      }

      rows.forEach(contest => {
        let votelink = contest.votelink;
        let votelinkArr = votelink.split('/');
        let votelinkId = votelinkArr[votelinkArr.length - 1];

        if (messageReaction.message.id == votelinkId) {

          messageReaction.message.channel.fetchMessage(messageReaction.message.id).then(msg => {
            // get all users that reacted already
            let reactionUsers = [], i = 0;

            const reactionHandling = new Promise((resolve, reject) => {
              msg.reactions.forEach(reaction => {
                reaction.fetchUsers().then(users => {
                  users.forEach(user => {
                    reactionUsers.push(user.username);
                  });
                }).then(() => {
                  i++;
                  if (i == msg.reactions.size) resolve();
                });
              });
            });

            reactionHandling.then(() => {
              // check if a user is duplicated in the array
              let sortedReactionUsers = reactionUsers.slice().sort();
              let reactionResults = [];
              for (let i = 0; i < sortedReactionUsers.length - 1; i++) {
                if (sortedReactionUsers[i + 1] == sortedReactionUsers[i]) {
                  reactionResults.push(sortedReactionUsers[i]);
                }
              }

              if (reactionResults.length >= 1 && reactionResults.includes(user.username)) {
                console.log(`${user.username} already voted! Removed it.`);
                messageReaction.message.channel.send(`<@${user.id}> you voted already!`).then(msg => {
                  setTimeout(() => {
                    msg.delete();
                  }, 2000);
                });
                messageReaction.remove(user);
                return;
              }
            });
          });
        }
      });
    }))
    .catch(err => {
      if (err.message == 'nothing found') {
        console.log('no voting contest found to manage reactions');
      } else {
        logger.error(err, {logType: 'error', time: Date.now()});
        throw err;
      }
    });
  }, // manageReactions

}
