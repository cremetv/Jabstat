/****************
* Web
****************/
const logger = require('./logger');
const logColor = require('./logcolors');

const socket = require('socket.io');
const express = require('express');
const http = require('http');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.engine('hbs', hbs({
  extname: 'hbs',
  helpers: require("./helpers.js").helpers,
  defaultLayout: 'layout',
  layoutsDir: `${__dirname}/../web/layouts`
}));
app.set('views', path.join(__dirname, '../web/views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, '..//web/public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const webServer = http.createServer(app).listen(3000, () => {
  logger.info(`${logColor.green}Jabstats web interface on port 3000${logColor.clear}`, {logType: 'log', time: Date.now()});
});
const io = socket.listen(webServer);




/****************
* Routes
****************/
app.get('/', (req, res) => {
  // res.send('index');
  res.render('index', {
    title: 'index'
  });

  let url = "http://localhost:3000/pruned?data=abcde";
  let request = http.request(url, res => {
    res.on('data', (chunk) => {
      console.log(`BODY: ${chunk}`);
    });
  });
  request.end();
});


app.get('/pruned', (req, res) => {
  let response = req.query;
  console.log('response', response);
  res.send(response);
});



app.get('/contest', (req, res) => {
  // get contests
  res.render('contest', {
    title: 'contest'
  });
});



app.get('/emotes', (req, res) => {
  let emotes = [], emoteCount = {};

  db.execute(config, database => database.query(`SELECT * FROM jabmotes`)
  .then(rows => {
    rows.forEach(row => {
      emotes.push(row);
      // emoteCount[row.id] = row.name + 'YEET';
    });

    // return database.query(`SELECT * FROM jabmotesCount`);
  })
  .then(() => {

    function delay() {
      return new Promise(resolve => setTimeout(resolve, 300));
    }

    async function delayedLog(item) {
      await delay();

      let count = 0;

      db.execute(config, database => database.query(`SELECT * FROM jabmotesCount WHERE emoteid = '${item.id}'`)
      .then(rows => {
        if (rows.length < 0) return;

        rows.forEach(row => {
          console.log('one count');
          console.log(row.count);
          count += parseInt(row.count);
          console.log(`current count: ${count}`);
        });
      })
      .then(() => {
        emoteCount[item.id] = count;
        console.log(`count: ${count}`);
      }));
    }

    async function processEmotes(array) {
      array.forEach(async (item) => {
        await delayedLog(item);
      });

      console.log(emoteCount);
      console.log('done!');
      res.render('emotes', {
        title: 'emotes',
        emotes: emotes,
        emoteCount: emoteCount
      });
    }

    processEmotes(emotes);

  }))
  // .then(() => {
  //   console.log(emotes);
  //   res.render('emotes', {
  //     title: 'emotes',
  //     emotes: emotes,
  //     emoteCount: emoteCount
  //   });
  // }))
  .catch(err => {
    throw err;
  });

  // res.render('emotes', {
  //   title: 'emotes',
  //   emotes: emotes
  // });
});



app.get('/log', (req, res) => {
  let infoPath = path.join(__dirname, 'info.log'),
      errorPath = path.join(__dirname, 'error.log'),
      // infoLog = [],
      infoLog = {},
      errorLog = '';

  const getInfoLog = () => {
    fs.readFile(infoPath, {encoding: 'utf-8'}, (err, data) => {
      if (err) throw err;
      let lines = data.split('\n');
      for (let i = 0; i < lines.length; i++) {
        // let el = {};
        // el.log = lines[i];

        // infoLog.push(el);
        infoLog[i] = lines[i];
      }
      // infoLog[0] = infoLogArray;
      // infoLog = data;
      getErrorLog();
    });
  }

  const getErrorLog = () => {
    fs.readFile(errorPath, {encoding: 'utf-8'}, (err, data) => {
      if (err) throw err;
      errorLog = data;
      renderLog();
    });
  }

  const renderLog = () => {
    // infoLog = `{"log": [${infoLog.replace(/\r?\n|\r/g, '').replace(/}{/g, '},{')}]}`;
    // infoLog = JSON.stringify(infoLog);
    // infoLog = infoLog.replace(/\r?\n|\r/g, '').replace(/}{/g, '},{');
    res.render('log', {
      title: 'log',
      infoLog: infoLog,
      errorLog: errorLog,
    });
  }
  getInfoLog();
});




/****************
* Sockets
****************/
io.sockets.on('connection', (socket) => {
  logger.info(`${logColor.connect} user connected to webinterface`, {logType: 'connect', time: Date.now()});

  socket.on('verify', (data) => {

    if (bcrypt.compareSync(data.pw, hash)) {
      console.log('logged in!');
    } else {
      console.log('wrong pw!');
    }
  });
});
