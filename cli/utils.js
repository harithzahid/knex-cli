import { spawn } from 'node:child_process';
import { promises as fs } from 'fs'
import chalk from 'chalk';
import mysql2 from 'mysql2';
import ssh2 from 'ssh2';

const SSH2Client = ssh2.Client;

const cliChalk = {
  info: chalk.yellow.bold,
  warning: chalk.red.bold,
}

const log = {
  start: (msg) => console.log(chalk.white('\n' + msg)),
  success: (msg) => console.log(chalk.green('\n' + msg)),
  failed: (msg) => console.log(chalk.red.bold('\n' + msg)),
  warning: (msg) => console.log(chalk.red('\n' + msg)),
  code: (msg) => console.log(chalk.grey.bgBlack('\n' + '$ ' + msg))
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function run(command, logOutput) {
  return new Promise(async (resolve, reject) => {
    const child = spawn(`${command}`, [], {shell: true});

    child.on('error', (error) => {
      console.error(`error: ${error.message}`);
      reject()
    });

    child.on('close', (code, signal) => {
      if (code) {
        console.error('Child close with code', code)
        reject('Child close.')
      } else if (signal) {
        console.error('Child was killed with signal', signal);
        reject('Child killed.')
      }
      resolve()
    });

    child.on('exit', (code, signal) => {
      if (code) {
        console.error('Child exited with code', code, signal)
        reject('Child exit.')
      } else if (signal) {
        console.error('Child was killed with signal', signal);
        reject('Child killed.')
      }
    });

    child.stdout.on('data', function(data) {
      logOutput && console.log('' + data);
    });

    child.stderr.on('data', function(data) {
      log.failed('' + data);
    });
    
  });
}

async function readFilenames(pathToFile, ext) {
  const filenames = await fs.readdir(pathToFile)
  const filteredFilenames = [];
  if (ext) {
    filenames.forEach(el => {
      const fileNameArr = el.split('.');
      if (fileNameArr[1] === ext) {
        filteredFilenames.push(el);
      }
    });
    return filteredFilenames
  }
  return filenames
}

async function readFile(pathToFile) {
  const content = await fs.readFile(pathToFile, 'utf-8')
  return content
}

async function checkDbConnection(con) {
  await new Promise(async (resolve, reject) => {
    console.log("Connecting db...");
    con.connect(function(err) {
      if (err) throw err;
      console.log("Db connected.");
      resolve()
    });
  });
}

async function dropDatabase(con, databaseName) {
  await new Promise(async (resolve, reject) => {
    console.log('Dropping database...')
    con.query(`DROP DATABASE ${databaseName}`, function (err, result) {
      if (err && err.code === 'ER_DB_DROP_EXISTS') {
        console.log('Database not exist.')
        resolve()
      } else if (err) {
        throw err
      } else {
        console.log(`Database dropped.`);
        resolve()
      }
    });
  });
}

async function createDatabase(con, databaseName) {
  await new Promise(async (resolve, reject) => {
    console.log("Creating database...");
    con.query(`CREATE DATABASE ${databaseName}`, function (err, result) {
      if (err && err.code === 'ER_DB_CREATE_EXISTS') {
        console.log('Database exist.')
        resolve()
      } else if (err) {
        throw err
      } else {
        console.log(`Database created.`);
        resolve()
      }
    });
  });
}

function getDbDumpToFileCommand(connection, fileName) {
  const { host, user, database: db } = connection;
  const cmd = `mysqldump -h ${host} ${db} -u ${user} -p > ./tmp/dump/${fileName}.sql`
  log.code(cmd + '\n');
  return cmd;
}

function getDbBuildFromFileCommand(connection, fileName) {
  const { user, database: db } = connection;
  const cmd = `mysql ${db} -u ${user} -p < ${fileName}`;
  log.code(cmd + '\n');
  return cmd;
}

async function connectDbSsh(dbConnection) {
  const { host, user, password: pass, database: db } = dbConnection;

  const sshConf = {
    host: host,
    port: 22,
    username: 'USER',
    password: 'PASS',
  };

  const sqlConf = {
    user: user,
    password: pass,
    database: db
  };

  return new Promise(async (resolve, reject) => {
    const ssh = new SSH2Client();
    ssh.on('ready', function() {
      ssh.forwardOut(
        '127.0.0.1',
        24000,
        'ip',
        3306,
        function(err, stream) {
          if (err) throw err;
  
          sqlConf.stream = stream;
          const db = mysql2.createConnection(sqlConf);
          db.query(
            'SELECT * FROM `Table`;',
            function(err, results, fields) {
              console.log(results);
              console.log(fields);
              resolve()
            }
          );
        }
      );
    });
    ssh.connect(sshConf);
  });
}

export {
  run,
  log,
  cliChalk,
  sleep,
  readFilenames,
  readFile,
  checkDbConnection,
  dropDatabase,
  createDatabase,
  getDbDumpToFileCommand,
  getDbBuildFromFileCommand,
  connectDbSsh
}
