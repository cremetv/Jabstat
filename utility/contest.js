const Database = require('./../utility/database');
const config = require('./../utility/config');
const winston = require('winston');

const consoleLog = '\x1b[46m\x1b[30m%s\x1b[0m';
const consoleError = '\x1b[101m\x1b[30m %s \x1b[0m';
const consoleAdd = '\x1b[42m\x1b[30m + \x1b[0m %s';
const consoleUpdate = '\x1b[103m\x1b[30m | \x1b[0m %s';
const consoleRemove = '\x1b[101m\x1b[30m - \x1b[0m %s';

const loggerAdd = '\x1b[42m\x1b[30m + \x1b[0m';
const loggerUpdate = '\x1b[103m\x1b[30m | \x1b[0m';
const loggerRemove = '\x1b[101m\x1b[30m - \x1b[0m';

/****************
* Date
****************/
const getDate = () => {
  const d = new Date();
  const dateSimple = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  return {
    dateSimple: dateSimple,
    date: date
  }
}

/****************
* Database Connection
****************/
const db = new Database(config);
db.execute = ( config, callback ) => {
    const database = new Database( config );
    return callback( database ).then(
        result => database.close().then( () => result ),
        err => database.close().then( () => { throw err; } )
    );
};

/****************
* Logger
****************/
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
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
      throw err;
    });

  }, // getContest


  getThemes: (id, callback) => {

    db.execute(config, database => database.query(`SELECT * FROM contestThemes WHERE contestId = '${id}' ORDER BY startdate`)
    .then(rows => {

      callback(rows);

    }))
    .catch(err => {
      throw err;
    });

  }, // getThemes

}
