import chalk from 'chalk';
import mysql from 'mysql2';

import {
  log,
  checkDbConnection,
  dropDatabase,
  createDatabase,
  cliChalk,
} from './utils.js';
import { selectDbEnvConfig, confirmPrompt } from './promptUtils.js';
import dbEnvConfig from '../knexfile.js';

async function recreate(dbConfig) {
  const {
    database: db,
    host: host,
    user,
    password
  } = dbConfig;

  try {
    const dbConnect = mysql.createConnection({
      host,
      user,
      password
    });

    await checkDbConnection(dbConnect);
    await dropDatabase(dbConnect, db);
    await createDatabase(dbConnect, db);

    log.success('Db destroy & recreate done.');
  } catch (error) {
    log.failed(error);
    process.exit()
  }
}

// Run

console.log(chalk.white.bold('-- Db recreate started. -- \n'))

const task = 'recreate';
const prompt = {};
prompt.selectDbEnv = 'dbEnv';
prompt.confirmDbEnv = 'dbEnvConfirmation';

await selectDbEnvConfig(
  {},
  prompt.selectDbEnv,
  `Select env for db to ${cliChalk.warning('destroy')} and recreate.`
)
  .then(async (answers) => {
    const dbEnv = answers[prompt.selectDbEnv];
    const cliConfig = dbEnvConfig[dbEnv].cli;
    if (!cliConfig[task]) {
      log.failed(`${task} task not allowed for env:${dbEnv}.`);
      process.exit();
    }
    return { ...answers }
  })
  .then(async (answers) => {
    return await confirmPrompt(
      answers,
      prompt.confirmDbEnv
    )
  })
  .then(async (answers) => {
    const dbConfig = answers.data[prompt.selectDbEnv];
    const isConfirmed = answers[prompt.confirmDbEnv] === 'yes';
    if (!isConfirmed) {
      log.failed('Cancelled. Exit')
      process.exit();
    }
    return await recreate(dbConfig)
  })

console.log(chalk.green.bold('\n-- Db destroy & recreate successfull.! --\n'))
process.exit()

export {
  recreate
}

