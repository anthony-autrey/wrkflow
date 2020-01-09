const { exec } = require('child_process');
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
    if (command == 'pushall')
      pushall(secondaryArgs)
    else
      console.log('Error: Unknown command');
  } catch (error) {
    console.log(error)
    console.log('error: invalid arguments')
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
      input.question('Please enter your ssh password', response => {
        runCommand(`git add -A && git commit -m "${message}" && git push`)
      })
    }
}

function runCommand(command) {
  exec(command, (err, stdout, stderr) => {
    if (err) {
      //some err occurred
      console.error(err)
    } else {
    // the *entire* stdout and stderr (buffered)
    console.log(`${stdout}`);
    console.log(`${stderr}`);
    }
  });
}