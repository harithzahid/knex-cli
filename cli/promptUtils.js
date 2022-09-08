import inquirer from 'inquirer';

import dbEnvConfig from '../knexfile.js';
import { readFilenames, readFile } from './utils.js';

async function confirmPrompt(prev, name, message) {
  const result = await inquirer.prompt([
    {
      name,
      message: message || `Please confirm. Type 'yes' to confirm.`,
    },
  ])

  return {
    ...prev,
    ...result,
    data: {
      ...(prev.data || {})
    }
  }
}

async function selectDbEnvConfig(prev={}, name, msg) {
  const envConfigs = Object.keys(dbEnvConfig);

  const result = await inquirer.prompt([
    {
      name,
      type: 'list',
      message: msg || 'Select env configs.',
      choices: envConfigs,
    },
  ])

  const dbConnection = dbEnvConfig[result[name]].connection;
  return {
    ...prev,
    ...result,
    data: {
      ...(prev.data || {}),
      [name]: dbConnection
    }
  }
}

async function selectFile(prev={}, name, filePath, ext, isCheckbox, msg, filesAllowed) {
  const files = await readFilenames(filePath, ext);
  const choices = filesAllowed ? files.filter((item) => filesAllowed.includes(item)) : files;
  const result = await inquirer.prompt([
    {
      name,
      type: isCheckbox ? 'checkbox' : 'list',
      message: msg || 'Select file.',
      choices,
    },
  ])

  return {
    ...prev,
    [name]: isCheckbox ? result[name] : [result[name]],
    data: {
      ...(prev.data || {})
    }
  }
}

async function selectQuery(prev={}, name, msg) {
    const content = await readFile('./tmp/query-history.txt');
    const choices = content.split(`\n`).filter((item) => item !== '');;
    const result = await inquirer.prompt([
      {
        name,
        type: 'list',
        message: msg || 'Enter query.',
        choices: ['[New query]', ...choices],
      },
    ])
  
    return {
      ...prev,
      ...result,
      data: {
        ...(prev.data || {})
      }
    }
}

export {
  confirmPrompt,
  selectDbEnvConfig,
  selectFile,
  selectQuery
}
