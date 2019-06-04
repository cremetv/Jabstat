const Database = require('./../utility/database');
const config = require('./../utility/config');
const logger = require('./../utility/logger');

const db = new Database(config);
db.execute = ( config, callback ) => {
    const database = new Database( config );
    return callback( database ).then(
        result => database.close().then( () => result ),
        err => database.close().then( () => {
          logger.error(err);
          throw err;
        } )
    );
};

module.exports = db;
