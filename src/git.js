const exec = require('child_process').exec;
const axios = require('axios');

const readline = require("readline");
const input = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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

function init() {
  input.question('Enter a repo name: ', name => {
    input.question('Enter a remote url: ', url => {
      runCommand(`mkdir ${name} && cd ${name} && git init && git remote add origin ${url} && git pull && git pull origin master`)
    })
  })
}

function clone(secondaryArgs) {
  let doClone = async path => {
    let response = await axios.get(`https://api.github.com/repos/${path}`).catch(error => {
        console.log('Error: Repo not found.');
        process.exit();
      });
      let name = response.data.name;
      let url = response.data.git_url;
      runCommand(`git clone ${url} && cd ${name} && [ -f ./package.json ] && npm install`)
  }

  if (secondaryArgs.length <= 0) {
    input.question('Enter the repo path (<username>/<repo>): ', async path => {
      doClone(path);
    });
  } else if (secondaryArgs.length == 1) {
    let path = secondaryArgs[0];
      doClone(path);
  } else {
    console.log('Error: Too many arguments')
    process.exit();
  }

}

function runCommand(command) {
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(err)
    } else {
      console.log(`${stdout}`);
      console.log(`${stderr}`);
    }
    process.exit();
  });

}