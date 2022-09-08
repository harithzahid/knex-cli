import chalk from 'chalk';
import mysql from 'mysql2';
import fs from 'fs';

import {
  log,
  checkDbConnection,
} from './utils.js';
  import { selectDbEnvConfig, confirmPrompt, selectQuery } from './promptUtils.js';

async function runner(dbConfig, query) {
  const {
    host: host,
    user,
    password
  } = dbConfig;

  try {
    const con = mysql.createConnection({
      host,
      user,
      password
    });

    await checkDbConnection(con);
    await new Promise(async (resolve, reject) => {
      con.query(query, function (err, result) {
        if (err) {
          throw err
        } else {
          const unixTimestamp = Math.floor(new Date().getTime() / 1000);
          fs.writeFile(`./tmp/query/query-${unixTimestamp}.json`, JSON.stringify({ result }, null, '  '), function(err) {
            if(err) {
                return console.log(err);
            }
            log.success('File saved.');
            resolve()
          });
        }
      });
    });
  } catch (error) {
    log.failed(error);
    process.exit()
  }
}

// Run

console.log(chalk.white.bold('-- Db query runner running. -- \n'))

const prompt = {};
prompt.selectDbEnv = 'dbEnv';
prompt.insertQuery = 'query';

await selectDbEnvConfig(
  {},
  prompt.selectDbEnv,
  'Select env for db to run query.'
)

  .then(async (answers) => {
    return await selectQuery(
      answers,
      prompt.insertQuery,
      'Select query'
    )
  })
  .then(async (answers) => {
    if (answers[prompt.insertQuery] === '[New query]') {
      return await confirmPrompt(
        answers,
        prompt.insertQuery,
        'Insert query'
      )
    }
    return { ...answers }
  })
  .then((answers) => {
    fs.appendFile(`./tmp/query-history.txt`, answers[prompt.insertQuery]+'\n', function(err) {
      if(err) {
        return console.log(err);
      }
    });
    return { ...answers }
  })
  .then(async (answers) => {
    await runner(answers.data[prompt.selectDbEnv], answers[prompt.insertQuery])
  })

console.log(chalk.green.bold('\n-- Db query runner close! --\n'))
process.exit()

export {
  runner
}