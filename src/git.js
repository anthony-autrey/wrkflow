const exec = require('child_process').exec;
const axios = require('axios');
const fs = require('fs');
const input = require('inquirer');

export function cli(systemArgs) {
  try {
    let args = systemArgs.slice(2);
    let secondaryArgs = systemArgs.slice(3);
    let command = args[0];
    if (command == 'commitall')
      commitall(secondaryArgs)
    else if (command == 'pushall')
      pushall(secondaryArgs)
    else if (command == 'init')
      init()
    else if (command == 'clone')
      clone(secondaryArgs)
    else
      console.log('Error: Unknown command');
  } catch (error) {
    console.log('Uncaught Error:')
    console.log('_____________________________________')
    console.log(error)
  }
}

function commitall(args) {
  let message = args[0];

  if (args.length !== 1)
    console.log('Error: Too many arguments. Please ensure your commit message is surrounded by quotes.')
  else
    runCommand(`git add -A && git commit -m "${message}"`)
}

function pushall(args) {
  let message = args[0];

  if (args.length !== 1)
    console.log('Error: Too many arguments. Please ensure your commit message is surrounded by quotes.')
    else {
      runCommand(`git add -A && git commit -m "${message}" && git push`)
    }
}

async function init() {
  let name = await getInput('Enter a repo name:');
  let token = await getPersonalAccessToken().catch(error => {
    if (error == 'declined token')
      console.log('You must establish a GitHub Personal Access Token to use the init function')
    else
      console.log('Error: Couldn\'t obtain GitHub Personal Access Token');
    process.exit();
  });
  
  let description = await getInput('Enter a description:');
  let repoIsPublic = await getConfirmation('Should the repo be public?');
  let response = await axios.post(`https://api.github.com/user/repos?access_token=${token}`, {
    "name": `${name}`,
    "description": `${description}`,
    // "homepage": "https://github.com",
    "private": !repoIsPublic,
    validateStatus: function (status) {
      return status >= 200 && status < 300; // default
    },
  }).catch(error => {
    console.log('Error: Couldn\'t create repo')
    process.exit();
  });

  let url = response.data.git_url
  runCommand(`git clone ${url}`)
}

async function clone(secondaryArgs) {
  let token = await getPersonalAccessToken().catch(error => {
    if (error == 'declined token')
      console.log('You must establish a GitHub Personal Access Token to use the init function')
    else
      console.log('Error: Couldn\'t obtain GitHub Personal Access Token');
    process.exit();
  });
  let response = await axios.get(`https://api.github.com/user/repos?access_token=${token}`, {
    validateStatus: function (status) {
      return status >= 200 && status < 300;
    },
  }).catch(error => {
    console.log('Error: Couldn\'t get list of repos')
    process.exit();
  });

  let repos = [];
  let urls = [];
  response.data.forEach(repo => {
    repos.push(repo.name)
    urls.push(repo.git_url)
  })

  if (repos.length > 0) {
    let repo = await getInputFromList('Select a repo to clone:', repos);
    let index = repos.indexOf(repo)
    let url = urls[index];
    if (fs.existsSync(repo)) {
      console.log('Error: That repo already exists here')
      process.exit();
    }
    await runCommand(`git clone ${url}`)
  } else {
    Console.log('Couldn\'t find any repos')
    process.exit();
  }
}

async function writeConfigFile(filename, contents) {
  await fs.mkdirSync(`${process.env.HOME}/.wgit_config`, { recursive: true })
  fs.writeFile(`${process.env.HOME}/.wgit_config/${filename}`, contents, error => {
    console.log(error)

    if (error)
      return Promise.reject('Error: Couldn\'t write to file.');
    else
      return Promise.resolve();
  })
}

function configExists(file) {
  return fs.existsSync(`${process.env.HOME}/.wgit_config/${file}`);
}

function getConfig(file) {
  return fs.readFileSync(`${process.env.HOME}/.wgit_config/${file}`, {encoding: 'ascii'});
}

async function getPersonalAccessToken() {
  let tokenExists = configExists('github_personal_access_token');
  if (tokenExists) {
    let token = getConfig('github_personal_access_token');
    return Promise.resolve(token);
  } else {
    let getToken = await getConfirmation('You haven\'t registered a GitHub Personal Access Token. Do you want to now?')
    if (getToken) {
      console.log('  Go to GitHub.com > User Settings > Developer Settings to create a Personal Access Token');
      let token = await getInput('Enter your Personal Access Token:')
      await writeConfigFile('github_personal_access_token', token).catch(error => console.log(error));
      return Promise.resolve(token);
    } else
      return Promise.reject('declined token')
  }
}

async function getGitHubUsername() {
  let usernameExists = configExists('github_username');
  if (usernameExists) {
    let user = getConfig('github_username');
    return Promise.resolve(username);
  } else {
    let getUsername = await getConfirmation('You haven\'t registered a GitHub username. Do you want to now?')
    if (getUsername) {
      let username = await getInput('Enter your GitHub username:')
      await writeConfigFile('github_username', username).catch(error => console.log(error));
      return Promise.resolve(username);
    } else
      return Promise.resolve(undefined);
  }
}

async function runCommand(command, cancelExit) {
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.log(err)
    } else {
      console.log(`${stdout}`);
      console.log(`${stderr}`);
    }
    if (!cancelExit)
      process.exit();
    else
      return Promise.resolve();
  });
}

async function getInput(message, def) {
  let question = await input.prompt({name: 'answer', type: 'input', message: message, default: def});

  return Promise.resolve(question.answer)
}

async function getInputFromList(message, list) {
  let question = await input.prompt({name: 'answer', type: 'list', message: message, choices: list, default: 0});

  return Promise.resolve(question.answer)
}

async function getConfirmation(message) {
  let question = await input.prompt({name: 'answer', type: 'confirm', message: message, default: 0});

  return Promise.resolve(question.answer)
}