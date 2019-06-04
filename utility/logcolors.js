const logColors = {
  log: '\x1b[46m\x1b[30m%s\x1b[0m',

  success: '\x1b[92m%s\x1b[0m',
  warning: '\x1b[93m%s\x1b[0m',
  error: '\x1b[91m%s\x1b[0m',

  add: '\x1b[42m\x1b[30m + \x1b[0m %s',
  update: '\x1b[103m\x1b[30m | \x1b[0m %s',
  remove: '\x1b[101m\x1b[30m - \x1b[0m %s',

  logAdd: '\x1b[42m\x1b[30m + \x1b[0m',
  logUpdate: '\x1b[103m\x1b[30m | \x1b[0m',
  logRemove: '\x1b[101m\x1b[30m - \x1b[0m',

  connect: '\x1b[42m\x1b[30m -> \x1b[0m',
  disconnect: '\x1b[101m\x1b[30m <- \x1b[0m',

  blackBlue: '\x1b[46m\x1b[30m%s\x1b[0m',
  green: '\x1b[92m',
  yellow: '\x1b[93m',
  red: '\x1b[91m',
  clear: '\x1b[0m',
};

module.exports = logColors;



// console.log(logColor.log, 'log');
//
// console.log(logColor.success, 'success');
// console.log(logColor.warning, 'warning');
// console.log(logColor.error, 'error');
//
// console.log(logColor.add, 'add');
// console.log(logColor.update, 'update');
// console.log(logColor.remove, 'remove');
//
// logger.info(`${logColor.logAdd} logAdd`);
// logger.info(`${logColor.logUpdate} logUpdate`);
// logger.info(`${logColor.logRemove} logRemove`);
