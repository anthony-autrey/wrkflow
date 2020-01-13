var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from 'axios';
import chalk from 'chalk';
import * as fs from 'fs';
import stringLength from 'string-length';
import { CommandUtil } from './Utilities/CommandUtil';
import { ConsoleUtil } from './Utilities/ConsoleUtil';
export default class Main {
    constructor() {
        this.ls = (args, command) => {
            if (!CommandUtil.validateArguments(args, 0, 1)) {
                ConsoleUtil.logInvalidArgumentsError(command);
                return;
            }
            let path = args[0];
            if (!path) {
                path = '.';
            }
            if (args.length > 1) {
                console.log('Error: Too many arguments.');
            }
            else {
                const tree = [];
                const files = [];
                const contents = fs.readdirSync(path, "ascii");
                contents.forEach(element => {
                    if (this.isDirectory(`${path}/${element}`)) {
                        const directoryContents = fs.readdirSync(`${path}/${element}`, "ascii");
                        tree.push({
                            name: element,
                            contents: directoryContents
                        });
                    }
                    else {
                        files.push(element);
                    }
                });
                tree.forEach(element => {
                    if (element.contents) {
                        let dashString = " ";
                        for (let i = 0; i < 25 - element.name.length; i++) {
                            dashString += "—";
                        }
                        console.log(chalk.blueBright(element.name) + chalk.blueBright(dashString));
                        console.log(chalk.blueBright('    ') + this.getDirContentString(element.contents, `${path}/${element.name}`));
                    }
                    else {
                        console.log(element.name);
                    }
                });
                if (files.length > 0) {
                    console.log(chalk.yellow("——————————————————————————"));
                    console.log(this.getFilesString(files));
                }
            }
        };
        this.http = (args, command) => __awaiter(this, void 0, void 0, function* () {
            if (args.length > 3) {
                console.log('Error: Too many arguments.');
                process.exit();
            }
            const validMethods = ['get', 'post', 'patch', 'put', 'delete'];
            let method = args[0];
            if (!method || !validMethods.includes(method)) {
                method = yield ConsoleUtil.getInputFromList('Choose a method:', validMethods);
            }
            let url = args[1];
            if (!url || !this.urlIsValid(url)) {
                url = yield ConsoleUtil.getInput('Please enter a valid request URL:');
            }
            let payload = args[2];
            if (method === 'post' && !payload) {
                payload = yield ConsoleUtil.getInput('Type a request payload in JSON format');
            }
            let options = { url, method };
            if (payload) {
                try {
                    payload = payload.replace(/\'/g, "\"");
                    options = JSON.parse(payload);
                    options.url = url;
                    options.method = method;
                }
                catch (error) {
                    console.log('Error: Couldn\'t parse JSON');
                    console.log(error);
                    process.exit();
                }
            }
            const request = yield axios.request(options).catch((error) => {
                if (error.response) {
                    console.log(`Error: (${error.response.status}: ${error.response.statText})`);
                }
                else {
                    console.log("Error: No Response");
                }
                process.exit();
            });
            console.log(request.data);
        });
        this.commands = [
            {
                string: 'ls',
                function: this.ls,
                usage: `wk ls '<directory path (optional)>'`,
                description: `Shows the files and directories in the path given. If a path is not given, the current directory is shown.`
            },
            {
                string: 'http',
                function: this.http,
                usage: `wk http '<HTTP method (optional)> <url (optional)> '<payload in JSON format (optional)>'`,
                description: `Makes http requests and prints the results.`
            },
        ];
    }
    handleSystemArguments(systemArguments) {
        const args = systemArguments.slice(2);
        const secondaryArgs = systemArguments.slice(3);
        const command = CommandUtil.getClosestMatch(args[0], this.commands);
        command.function(secondaryArgs, command);
    }
    commitAll(args, command) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!CommandUtil.validateArguments(args, 0, 1)) {
                ConsoleUtil.logInvalidArgumentsError(command);
                return;
            }
            let message = args[0];
            if (args.length <= 0) {
                message = yield ConsoleUtil.getInput('Please enter a commit message:');
            }
            else if (args.length > 1) {
                message = yield ConsoleUtil.getInput('Too many arguments. Please enter a commit message:');
            }
            CommandUtil.runShell(`git add -A && git commit -m "${message}"`);
        });
    }
    getDirContentString(contents, parent) {
        const directories = [];
        const files = [];
        contents.forEach(element => {
            if (this.isDirectory(`${parent}/${element}`)) {
                directories.push(chalk.blueBright(element));
            }
            else {
                files.push(element);
            }
        });
        contents = directories.concat(files);
        const formattedArray = [];
        let currentLineLength = 0;
        contents.forEach((element, index) => {
            currentLineLength += stringLength(element);
            if (currentLineLength > 80) {
                formattedArray.push('\n  ');
                currentLineLength = 0;
            }
            formattedArray.push(element);
        });
        const dirContentString = formattedArray.toString().replace(/,/g, '  ');
        return dirContentString;
    }
    getFilesString(files) {
        const formattedArray = [];
        let currentLineLength = 0;
        files.forEach((element, index) => {
            currentLineLength += stringLength(element);
            if (currentLineLength > 80) {
                formattedArray.push('\n');
                currentLineLength = 0;
            }
            formattedArray.push(element);
        });
        let filesString = formattedArray.toString().replace(/\n,/g, '\n');
        filesString = filesString.replace(/,/g, '  ');
        return filesString;
    }
    isDirectory(path) {
        return fs.lstatSync(path).isDirectory();
    }
    urlIsValid(url) {
        const pattern = new RegExp('^(https?:\\/\\/)?' +
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
            '((\\d{1,3}\\.){3}\\d{1,3}))' +
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
            '(\\?[;&a-z\\d%_.~+=-]*)?' +
            '(\\#[-a-z\\d_]*)?$', 'i');
        return !!pattern.test(url);
    }
}
//# sourceMappingURL=Main.js.map