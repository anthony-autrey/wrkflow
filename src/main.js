const axios = require('axios');
const fs = require('fs');
const input = require('inquirer');
const exec = require('child_process').exec;
const chalk = require('chalk');
chalk.level = 3;
const stringLength = require('string-length');

export function cli(systemArgs) {
    try {
        let args = systemArgs.slice(2);
        let secondaryArgs = systemArgs.slice(3);
        let command = args[0];
        if (command == 'ls')
          ls(secondaryArgs)
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

function ls(args) {
    let path = args[0];
    if (!path)
      path = '.';

    if (args.length > 1)
        console.log('Error: Too many arguments.')
    else {
      let tree = [];
      let files = [];
      let contents = fs.readdirSync(path, "ascii");
      contents.forEach(element => {
        if (isDirectory(`${path}/${element}`)) {
          let contents = fs.readdirSync(`${path}/${element}`, "ascii");
          tree.push({
            name: element,
            contents: contents
          });
        } else {
          files.push(element)
        }
      });

      tree.forEach(element => {
        if (element.contents) {
          let dashString = " "
          for (let i = 0; i < 25 - element.name.length; i ++) {
            dashString += "—"
          }
          console.log(chalk.blue(element.name) + chalk.blue(dashString))
          console.log(chalk.blue('    ') + getDirContentString(element.contents, `${path}/${element.name}`));
        } else {
          console.log(element.name)
        }
      });

      if (files.length > 0) {
          console.log(chalk.yellow("——————————————————————————"))
          console.log(getFilesString(files))
      }
    }
}

function isDirectory(path) {
  return fs.lstatSync(path).isDirectory()
}

function getDirContentString(array, parent) {
  let directories = [];
  let files = [];
  array.forEach(element => {
    if (isDirectory(`${parent}/${element}`))
      directories.push(chalk.blue(element))
    else
      files.push(element)
  })

  array = directories.concat(files);

  let formattedArray = []
  let currentLineLength = 0;
  array.forEach((element, index) => {
    currentLineLength += stringLength(element);
    if (currentLineLength > 80 ) {
      formattedArray.push('\n  ')
      currentLineLength = 0;
    }

    formattedArray.push(element)

  })

  let string = formattedArray.toString().replace(/,/g, '  ');
  return string;
}

function getFilesString(array) {
  let formattedArray = []
  let currentLineLength = 0;
  array.forEach((element, index) => {
    currentLineLength += stringLength(element);
    if (currentLineLength > 80 ) {
      formattedArray.push('\n')
      currentLineLength = 0;
    }

    formattedArray.push(element)
  })

  let string = formattedArray.toString().replace(/\n,/g, '\n');
  string = string.replace(/,/g, '  ');
  return string;
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