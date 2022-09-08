import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2';

import {
  run,
  log,
  cliChalk,
  checkDbConnection,
  dropDatabase,
  createDatabase,
  getDbBuildFromFileCommand
} from './utils.js';
import { selectDbEnvConfig, confirmPrompt, selectFile } from './promptUtils.js';
import dbEnvConfig from '../knexfile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function replicate(dbConfig, replicateFile) {
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

    log.start(
      `Run ${cliChalk.info(replicateFile)} script ` +
      `into ${cliChalk.info(db)} ` +
      `from ${cliChalk.info(host)}. ` +
      `This gonna take some time....`
    );
    const filePath = path.join(__dirname, '../tmp/dump/' + replicateFile)
    await run(getDbBuildFromFileCommand(dbConfig, filePath));
    log.success('Replicate from sql file done.');
  } catch (error) {
    log.failed(error);
    process.exit()
  }
}

// Run

console.log(chalk.white.bold('-- Db replicate from sql file started. -- \n'))

const task = 'replicate';
const prompt = {};
prompt.selectDbEnv = 'dbEnv';
prompt.confirmDbEnv = 'dbEnvConfirmation';
prompt.replicateFile = 'replicateFile';

function getDbConfig(answers) {
  const { [prompt.selectDbEnv]: dbConfig } = answers.data;
  return dbConfig
}

await selectDbEnvConfig(
  {},
  prompt.selectDbEnv,
  'Select env for db to replicate into.'
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
    return await selectFile(
      answers,
      prompt.replicateFile,
      path.join(__dirname, '../tmp/dump/'),
      'sql',
      false,
      'Select file for replicate.'
    )
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
    
    const replicateFile = answers[prompt.replicateFile][0];
    
    if (isProtectedDb && !protectedDbConfirmed) {
      log.failed('Cancelled. Exit')
      process.exit();
    }

    if (!isProtectedDb) {
      return await replicate(dbConfig, replicateFile)
    }
    
    if (protectedDbConfirmed) {
      return await replicate(dbConfig, replicateFile)
    }
  })

console.log(chalk.green.bold('\n-- Db replicate from sql file done.! --\n'))
process.exit()

export {
  replicate
}

