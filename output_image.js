const mysql = require('mysql');
const fs = require('fs');

const host = 'localhost';
const port = 3306;
const user  = 'isucon';
const password = 'isucon';
const database = 'isubata';

const STATIC_FOLDER = path.join(__dirname, '..', 'public')
const ICONS_FOLDER = path.join(STATIC_FOLDER, 'icons')

const connection = mysql.createConnection({
host: host,
port: port,
user: user,
password: password,
database: database,
});

connection.connect();

try {
  if(fs.statSync(rootDir)) {
    connection.query('SELECT * FROM image;', function (err, rows, fields) {
      if (err) {
        console.log('err: ' + err);
      }

      rows.forEach(row => {
        console.log(`create: ${ICONS_FOLDER}/${row.name}`);
        fs.writeFileSync(`${rootDir}/${row.name}`, row.data);
      });
    });
  }
} catch(e) {
  console.log(e);
}

connection.end();

