const Discord = require('discord.js');
const db = require('./../utility/databaseconnection');
const config = require('./../utility/config');
const logger = require('./../utility/logger');
const logColor = require('./../utility/logcolors');
const getDate = require('./../utility/date');

let currentDate = new Date();

const formatDate = (rawDate) => {
  let date = new Date(rawDate);
  let dateStr = ('0' + (date.getMonth() + 1)).slice(-2) + '/' + ('0' + date.getDate()).slice(-2) + '/' + date.getFullYear() + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
  return {
    date: date,
    dateStr: dateStr
  }
}



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
      logger.error(err);
      throw err;
    });

  }, // getContest


  getThemes: (id, callback) => {

    db.execute(config, database => database.query(`SELECT * FROM contestThemes WHERE contestId = '${id}' ORDER BY startdate`)
    .then(rows => {

      callback(rows);

    }))
    .catch(err => {
      logger.error(err);
      throw err;
    });

  }, // getThemes


  checkDeadlines: (client) => {
    console.log('check deadlines ***********');

    let contestChannel = client.channels.get('582622116617125928');
    // let contestChannel = client.channels.get('343771301405786113');
    let proceed = true;
    let contest, participants = [], themes = [];

    db.execute(config, database => database.query(`SELECT * FROM contest WHERE (votelink is NULL or votelink = '') AND enddate >= NOW() - INTERVAL 1 HOUR`)
    .then(rows => {
      if (rows.length < 1) {
        proceed = false;
      } else {
        contest = rows[0];
        return database.query(`SELECT * FROM contest WHERE id = '${contest.id}'`);
      }
    })
    .then(rows => {
      if (proceed) {
        startdate = formatDate(rows[0].startdate);
        enddate = formatDate(rows[0].enddate);

        return database.query(`SELECT * FROM contestThemes WHERE contestId = '${contest.id}' ORDER BY startdate`);
      }
    })
    .then(rows => {
      if (proceed) {
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
      }
    })
    .then(rows => {
      if (proceed) {
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
              logger.error(err);
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

          // contest detail embed
          let embed = new Discord.RichEmbed()
          .setAuthor('Voting!', 'https://ice-creme.de/images/jabstat/voting.jpg')
          .setTitle(`Contest: ${contest.name}`)
          .setDescription(`${contest.description}\n\n*use the reactions to vote*`)
          .setColor('#2ecc71')
          .addBlankField()
          .addField('Themes:', `${themes.join('\n')}`)
          .addBlankField()
          .addField('Submissions:', `*use the reactions to vote*\n${participantString.join('\n')}`)
          .addBlankField()
          .setFooter(`beep boop • contest ID: ${contest.id}`, client.user.avatarURL);

          contestChannel.send({embed: embed}).then(msg => {
            voteLink = `https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
            async function processReacts(array) {
              for (let i = 0; i < array.length; i++) {
                msg.react(`${voteEmotes[i]}`);
                await delayedReact(array[i]);
              }
              console.log('done!');
              db.execute(config, database => database.query(`UPDATE contest SET votelink = '${voteLink}' WHERE id = '${contest.id}'`)
              .then(() => {
                console.log('inserted voteLink');
              }))
              .catch(err => {
                logger.error(err);
                throw err;
              });
            }
            processReacts(participantString);
          });

        } // processContests

        processUsers(rows);
      }
    }))
    .catch(err => {
      logger.error(err);
      throw err;
    });

  }, // checkDeadlines

}
