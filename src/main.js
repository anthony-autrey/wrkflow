const axios = require('axios');
const fs = require('fs');
const input = require('inquirer');
const exec = require('child_process').exec;

export function cli(systemArgs) {
    try {
        let args = systemArgs.slice(2);
        let secondaryArgs = systemArgs.slice(3);
        let command = args[0];
        if (command == 'cdnew')
          cdnew(secondaryArgs)
        else if (command == 'http')
          http(secondaryArgs)
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

async function http(args) {
  if (args.length > 3) {
    console.log('Error: Too many arguments.')
    process.exit();
  }

  let validMethods = ['get', 'post', 'patch', 'put', 'delete']
  let method = args[0];
  if (!method || !validMethods.includes(method) )
    method = await getInputFromList('Choose a method:', validMethods)

  let url = args[1];
  if (!url || !validURL(url) )
    url = await getInput('Please enter a valid request URL:')

  let payload = args[2];
  if (method == 'post' && !payload)
    payload = await getInput('Type a request payload in JSON format')

  let options = {
    url: url,
    method: method
  }

  if (payload) {
    try {
      payload = payload.replace(/\'/g, "\"");
      options = JSON.parse(payload);
      options.url = url;
      options.method = method;
    } catch (error) {
      console.log('Error: Couldn\'t parse JSON')
      console.log(error)
      process.exit();
    }
  }

  let request = await axios.request(options).catch(error => {
    if (error.response)
      console.log(`Error: (${error.response.status}: ${error.response.statText})`)
    else {
      console.log("Error: No Response");
    }
    process.exit();
  })

  console.log(request.data);
}

function validURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return !!pattern.test(str);
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