const Discord = require('discord.js');
const db = require('./../utility/databaseconnection');
const config = require('./../utility/config');
const logger = require('./../utility/logger');
const logColor = require('./../utility/logcolors');
const getDate = require('./../utility/date');

const botsettings = require('./../botsettings.json');
const serverId = botsettings.serverId;
const contestChat = botsettings.contestChat;
const contestRole = botsettings.contestRole;

let currentDate = new Date();

const formatDate = (rawDate) => {
  let date = new Date(rawDate);
  let dateStr = ('0' + date.getDate()).slice(-2) + '.' + ('0' + (date.getMonth() + 1)).slice(-2) + '.' + date.getFullYear() + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
  return {
    date: date,
    dateStr: dateStr
  }
}

const shuffle = a => {
  let j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

const groupBy = (xs, key) => {
  return xs.reduce((rv, x) => {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
}


let voteEmotes = ['🥞', '🍗', '🌭', '🍕', '🍙', '🍣', '🍤', '🍦', '🍩', '🍪', '🍫', '🍯', '🍬', '🍭', '🦐', '🍥', '🍘', '🍱', '🥗', '🍲'];


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
    db.execute(config, database => database.query(`SELECT * FROM cont_contests ${statement}`)
    .then(rows => {
      callback(rows);
    }))
    .catch(err => {
      logger.error(err, {logType: 'error', time: Date.now()});
    });
  }, // getContest




  checkStarttimes: (client) => {
    const contestChannel = client.channels.get(contestChat);
    let contest;

    db.execute(config, database => database.query(`SELECT * FROM cont_contests WHERE active = 1 AND startdate <= NOW() AND startdate > NOW() - INTERVAL 1 HOUR`)
    .then(rows => {
      if (rows.length < 1) {
        throw new Error('nothing found');
        return null;
      }

      contest = rows[0];
      startdate = formatDate(contest.startdate);
      enddate = formatDate(contest.enddate);

      console.log(`starting contest: ${contest.name}`);

      let contestEmbed = new Discord.RichEmbed()
      .setAuthor('New Contest!', 'https://ice-creme.de/images/jabstat/public-icon.jpg')
      .setTitle(`Contest: ${contest.name}`)
      .setDescription(`${contest.description}\n\nadd \`>contest submit ${contest.id}\` to your submission\n\n24 hour voting will start after the deadline.\n\n*Date: DD.MM.YYYY UTC*`)
      .setColor('#3498db')
      .addBlankField()
      .addField('Start', startdate.dateStr, true)
      .addField('Deadline', enddate.dateStr, true)
      .setFooter(`beep boop • contest ID: ${contest.id}`, client.user.avatarURL);

      contestChannel.send(`<@${contestRole}>`).then(msg => {
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
    const contestChannel = client.channels.get(contestChat);
    let contest, participants = [], userIds = [];

    db.execute(config, database => database.query(`SELECT * FROM cont_contests WHERE active = 1 AND (votelink is NULL or votelink = '') AND enddate >= NOW() - INTERVAL 1 HOUR AND enddate <= NOW()`)
    .then(rows => {
      if (rows.length < 1) {
        throw new Error('nothing found');
        return null;
      }

      contest = rows[0];
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

      voteEmotes = shuffle(voteEmotes);
      let participantString = [];

      let i = 0;
      function asyncFunction(user, callback) {
        setTimeout(() => {
          client.fetchUser(user.id).then(u => {
            userIds.push(user.id);
            console.log('username', u.username);
            participantString.push(`${voteEmotes[i]} [${u.username}](${user.submissionLink})`);
          }).then(() => {
            console.log('done with', user.id);
            i++;
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
        function delay() {
          return new Promise(resolve => setTimeout(resolve, 300));
        }

        async function delayedReact(item) {
          await delay();
        }

        let tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 24);
        tomorrow = ('0' + tomorrow.getDate()).slice(-2) + '.' + ('0' + (tomorrow.getMonth() + 1)).slice(-2) + '.' + tomorrow.getFullYear() + ' ' + ('0' + tomorrow.getHours()).slice(-2) + ':' + ('0' + tomorrow.getMinutes()).slice(-2);

        let embed = new Discord.RichEmbed()
        .setAuthor('Voting!', 'https://ice-creme.de/images/jabstat/voting.jpg')
        .setTitle(`Contest: ${contest.name}`)
        .setDescription(`${contest.description}\n\nyou have 24 hours to vote.\nVoting will end at ${tomorrow}\n*Date: DD.MM.YYYY UTC*`)
        .setColor('#2ecc71')
        .addBlankField()
        .addField('Submissions;', `*use the reactions to vote*\n${participantString.join('\n')}`)
        .setFooter(`beep boop • contest Id: ${contest.id}`, client.user.avatarURL);

        contestChannel.send(`<@${contestRole}>`).then(msg => {
          contestChannel.send({embed: embed}).then(msg => {
            voteLink = `https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;

            async function processReacts(array) {
              for (let i = 0; i < array.length; i++) {
                msg.react(`${voteEmotes[i]}`);

                db.execute(config, database => database.query(`UPDATE cont_submissions SET emote = '${voteEmotes[i]}' WHERE contestId = '${contest.id}' AND userId = '${userIds[i]}'`)
                .then(() => {
                  console.log(`updated ${userIds[i]}'s emote`);
                }))
                .catch(err => {
                  throw err;
                });

                await delayedReact(array[i]);
              }
              db.execute(config, database => database.query(`UPDATE cont_contests SET votelink = '${voteLink}' WHERE id = '${contest.id}'`)
              .then(() => {
                logger.info(`\x1b[93mupdated votelink for contest ${contest.id}\x1b[0m`, {logType: 'log', time: Date.now()});
              }))
              .catch(err => {
                logger.error(err, {logType: 'error', time: Date.now()});
                throw err;
              });
            }
            processReacts(participantString)

          });
        });
      });

      // participants.forEach((p, i) => {
      //   participantString.push(`${voteEmotes[i]} [${p.id}](${p.submissionLink})`);
      // });

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
    const contestChannel = client.channels.get(contestChat);
    let contest, participants = [], y = 0, voteMessageId;

    /****************
    * check for contests to end voting
    ****************/
    db.execute(config, database => database.query(`SELECT * FROM cont_contests WHERE active = 1 AND votelink IS NOT NULL AND (voted IS NULL or voted = 0) AND enddate <= NOW() - INTERVAL 1 DAY`)
    .then(rows => {
      if (rows.length < 1) {
        throw new Error('nothing found');
        return null;
      }

      contest = rows[0];

      contestChannel.send(`<@${contestRole}> Voting for **${contest.name}** (${contest.id}) ended!`);

      return database.query(`SELECT * FROM cont_submissions WHERE contestId = '${contest.id}'`);
    })
    .then(rows => {
      let i = 0;

      rows.forEach(row => {
        let user = {};
        user.id = row.userId;
        user.submission = row.submission;
        user.submissionLink = row.submissionLink;
        user.emote = row.emote;
        user.votes = row.votes;
        participants.push(user);
      });

      participants.sort((a, b) => parseFloat(a.count) - parseFloat(b.count));

      let places = ['1st', '2nd', '3rd'];

      let grouped = Object.entries(groupBy(participants, 'votes'));
      grouped.reverse();

      let winners = [];
      let winnerImg;

      let x = 0;

      function delay() {
        return new Promise(resolve => setTimeout(resolve, 300));
      }

      async function delayedReact(item) {
        await delay();
      }

      async function loopGroup(array) {
        for (const [votes, users] of array) {
          let groupedUsers = [];
          function asyncFunction(user, callback) {
            setTimeout(() => {
              groupedUsers.push(`[<@${user.id}>](${user.submission})`);
              if (x === 0) {
                winnerImg = user.submission;
              }
              callback();
            }, 100);
          }

          let req = users.reduce((promiseChain, item) => {
            return promiseChain.then(() => new Promise((resolve) => {
              asyncFunction(item, resolve);
            }));
          }, Promise.resolve());

          req.then(() => {
            winners.push(`${places[x]}: ${groupedUsers.join(', ')} (${parseInt(votes) + 1})`);
          });

          await delayedReact(array[i])
          x++;
        }
      }

      loopGroup(grouped).then(() => {
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
      });

      return database.query(`UPDATE cont_contests SET voted = 1 WHERE id = '${contest.id}'`);
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
    db.execute(config, database => database.query(`SELECT * FROM cont_contests WHERE active = 1 AND votelink IS NOT NULL AND (voted IS NULL or voted = 0)`)
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
              } else {
                console.log('successfully voted');
                db.execute(config, database => database.query(`UPDATE cont_submissions SET votes = '${messageReaction.count}' WHERE contestId = '${contest.id}' AND emote = '${messageReaction.emoji.name}'`)
                .then(() => {
                  console.log('updated vote in db');
                }))
                .catch(err => {
                  throw err;
                });
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
