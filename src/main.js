const fs = require('fs');

const exec = require('child_process').exec;

export function cli(systemArgs) {
    try {
        let args = systemArgs.slice(2);
        let secondaryArgs = systemArgs.slice(3);
        let command = args[0];
        if (command == 'cdnew')
            cdnew(secondaryArgs)
        else if (command == 'other')
            console.log('')
        else
            console.log('Error: Unknown command');
    } catch (error) {
        console.log('Uncaught Error:')
        console.log('_____________________________________')
        console.log(error)
    }
}

function cdnew(args) {
    let dir = args[0];

    if (args.length !== 1)
        console.log('Error: Too many arguments.')
    else {
      fs.mkdirSync(dir);
      process.chdir(dir);
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