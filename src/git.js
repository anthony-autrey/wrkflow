const { exec } = require('child_process');

export function handle(args) {
  if (args[1] == 'commit')
    runCommand(`git add -A && git commit -m "${args[2]}"`);  

}

function runCommand(command) {
  exec(command, (err, stdout, stderr) => {
    if (err) {
      //some err occurred
      console.error(err)
    } else {
    // the *entire* stdout and stderr (buffered)
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
    }
  });
}