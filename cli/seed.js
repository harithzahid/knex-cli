import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  run,
  log,
  cliChalk,
  sleep
} from './utils.js';
import { selectDbEnvConfig, confirmPrompt, selectFile } from './promptUtils.js';
import dbEnvConfig from '../knexfile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed(dbConfig, dbEnv, seedFiles, isProtectedDb) {
  const {
    database: db,
    host: host,
  } = dbConfig;

  try {
    log.start(
      `Seed will run ${isProtectedDb ? 'in 3 seconds' : ''} ` +
      `for ${cliChalk.info(db)} from ${cliChalk.info(host)}...`
    );
    isProtectedDb && await sleep(3000);
    log.warning('Running. Please do not exit..')
    await Promise.all(seedFiles.map(async (seedFile) => {
      await run(`NODE_ENV=${dbEnv} npx knex seed:run  --specific=${seedFile}`)
      log.success(`Seed ${seedFile} done.`);
    }))
    log.success('Db seed done.');
  } catch (error) {
    log.failed(error);
    process.exit()
  }
}

// Run

console.log(chalk.white.bold('-- Seed db started. -- \n'))

const task = 'seed';
const prompt = {};
prompt.selectDbEnv = 'dbEnv';
prompt.confirmDbEnv = 'dbEnvConfirmation';
prompt.selectSeedFiles = 'seedFiles';

function getDbConfig(answers) {
  const { [prompt.selectDbEnv]: dbConfig } = answers.data;
  return dbConfig
}

await selectDbEnvConfig(
  {},
  prompt.selectDbEnv,
  'Select env for db to seed.'
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

    if (!cliConfig[task].all && (!cliConfig[task].files || cliConfig[task].files.length === 0)) {
      log.failed(`Allowed seed files not specified.`);
      process.exit();
    } 

    return await selectFile(
      answers,
      prompt.selectSeedFiles,
      path.join(__dirname, '../seeds'),
      'js',
      true,
      'Select file for seed.',
      !cliConfig[task].all && cliConfig[task].files
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

    const seedFiles = answers[prompt.selectSeedFiles];
    if (seedFiles.length === 0) {
      log.failed('No seed files selected.')
      process.exit()
    }
    
    if (isProtectedDb && !protectedDbConfirmed) {
      log.failed('Cancelled. Exit')
      process.exit();
    }

    if (!isProtectedDb) {
      return await seed(dbConfig, dbEnv, seedFiles, isProtectedDb)
    }
    
    if (protectedDbConfirmed) {
      return await seed(dbConfig, dbEnv, seedFiles, isProtectedDb)
    }
  })

console.log(chalk.green.bold('\n-- Db seed successfull! --\n'))
process.exit()

export {
  seed
}
