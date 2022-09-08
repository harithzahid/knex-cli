import chalk from 'chalk';

import {
  run,
  log,
  cliChalk,
  sleep
} from './utils.js';
import { selectDbEnvConfig, confirmPrompt } from './promptUtils.js';
import dbEnvConfig from '../knexfile.js';

async function migrate(dbConfig, dbEnv, isProtectedDb) {
  const {
    database: db,
    host: host,
  } = dbConfig;

  try {
    log.start(
      `Migration will run ${isProtectedDb ? 'in 3 seconds' : ''} ` +
      `for ${cliChalk.info(db)} from ${cliChalk.info(host)}...`
    );
    isProtectedDb && await sleep(3000);
    log.warning('Running. Please do not exit..\n')
    await run(`NODE_ENV=${dbEnv} npx knex migrate:latest`, true);

    log.success('Knex migration complete.');
  } catch (error) {
    log.failed(error);
    process.exit()
  }
}

// Run

console.log(chalk.white.bold('-- Db migration started. -- \n'))

const task = 'migrate';
const prompt = {};
prompt.selectDbEnv = 'dbEnv';
prompt.confirmDbEnv = 'dbEnvConfirmation';

function getDbConfig(answers) {
  const { [prompt.selectDbEnv]: dbConfig } = answers.data;
  return dbConfig
}

await selectDbEnvConfig(
  {},
  prompt.selectDbEnv,
  'Select db env to run knex migration script.'
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
    const dbEnv = answers[prompt.selectDbEnv];
    const cliConfig = dbEnvConfig[dbEnv].cli;
    if (cliConfig.secure) {
      return await confirmPrompt(
        answers,
        prompt.confirmDbEnv
      )
    }
    return { ...answers };
  })
  .then(async (answers) => {
    const dbConfig = getDbConfig(answers);
    const dbEnv = answers[prompt.selectDbEnv];
    const cliConfig = dbEnvConfig[dbEnv].cli;
    const isProtectedDb = cliConfig.secure;
    const protectedDbConfirmed = isProtectedDb
      && answers[prompt.confirmDbEnv] === 'yes';
    
    if (isProtectedDb && !protectedDbConfirmed) {
      log.failed('Cancelled. Exit')
      process.exit();
    }

    if (!isProtectedDb) {
      return await migrate(dbConfig, dbEnv, isProtectedDb)
    }
    
    if (protectedDbConfirmed) {
      return await migrate(dbConfig, dbEnv, isProtectedDb)
    }
  })

console.log(chalk.green.bold('\n-- Db migration successfull.! --\n'))
process.exit()

export {
  migrate
}
