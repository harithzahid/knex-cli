import chalk from 'chalk';

import {
  run,
  log,
  cliChalk,
  getDbDumpToFileCommand,
} from './utils.js';
import { selectDbEnvConfig } from './promptUtils.js';
import dbEnvConfig from '../knexfile.js';

async function dump(dbConfig) {
  const {
    database: db,
    host: host,
  } = dbConfig;
  const dumpToFileName = db;

  try {
    log.start(
      `Dump ${cliChalk.info(db)} ` +
      `from ${cliChalk.info(host)} to ` +
      `${cliChalk.info(dumpToFileName + '.sql')} ` +
      `This gonna take some time....`
    );
    await run(getDbDumpToFileCommand(dbConfig, dumpToFileName), true);
    log.success('Dump db to file done.');
  } catch (error) {
    log.failed(error);
    process.exit()
  }
}

// Run

console.log(chalk.white.bold('-- Db dump to sql file started. -- \n'))

const task = 'dump';
const prompt = {};
prompt.selectDbEnv = 'dbEnv';

await selectDbEnvConfig(
  {},
  prompt.selectDbEnv,
  'Select env for db to dump.'
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
    await dump(answers.data[prompt.selectDbEnv])
  })

console.log(chalk.green.bold('\n-- Db dump to sql file done.! --\n'))
process.exit()

export {
  dump
}