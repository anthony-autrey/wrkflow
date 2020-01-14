import axios from 'axios';
import chalk from 'chalk';
import * as fs from 'fs';
import stringLength from 'string-length';
import { Command, CommandUtil } from './Utilities/CommandUtil';
import { ConfigUtil } from './Utilities/ConfigUtil';
import { ConsoleUtil } from './Utilities/ConsoleUtil';

export default class Main {

    private config = new ConfigUtil();

    public handleSystemArguments(systemArguments: string[]) {
        const customCommands = this.config.get.customCommands();
        const matchingCommands = customCommands.filter(customCommand => {
            return customCommand.input === systemArguments[2];
        });

        if (matchingCommands.length > 0) {
            CommandUtil.runShell(matchingCommands[0].command);
            return;
        }

        const args = systemArguments.slice(2);
        const secondaryArgs = systemArguments.slice(3);
        const command = CommandUtil.getClosestMatch(args[0], this.commands);

        if (args.includes(CommandUtil.helpFlag)) {
            CommandUtil.logCommandHelpString(command);
        } else {
            command.function(secondaryArgs, command);
        }
    }

    private set = (args: string[], command: Command) => {
        if (!CommandUtil.validateArguments(args, 2, Number.MAX_SAFE_INTEGER)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }
        const customCommand = args.splice(1, args.length - 1).join(' ');
        this.config.set.customCommand(args[0], customCommand);
        console.log('Set custom command: ' + chalk.yellow('wk ' + args[0]));
        console.log('Executes: ' + chalk.blue(customCommand));
    }

    private get = (args: string[], command: Command) => {
        if (!CommandUtil.validateArguments(args, 0, 0)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }
        if (this.config.get.customCommands().length > 0) { console.log('Listing keywords set by \'wk set\': '); }
        else { console.log(`No keywords set. Use the 'wk set' command to establish keywords.`); }

        this.config.get.customCommands().forEach(customCommand => {
            console.log(chalk.yellow(customCommand.input) + ', Executes: ' + chalk.blue(customCommand.command));
        });
    }

    private unset = (args: string[], command: Command) => {
        if (!CommandUtil.validateArguments(args, 1, 1)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }

        const matchingCommand = this.config.get.customCommands().find(customCommand => {
            return customCommand.input === args[0];
        });

        if (matchingCommand) {
            console.log(`Unsetting keyword: ${chalk.yellow(matchingCommand.input)} <${chalk.blue(matchingCommand.command)}>`);
            this.config.unsetCommand(args[0]);
        } else {
            console.log(chalk.red(`Couldn't find keyword: ${args[0]}`));
        }
    }

    private ls = (args: string[], command: Command) => {
        if (!CommandUtil.validateArguments(args, 0, 2)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }

        if (args[0] && args[0].toLowerCase() === '-r' || (args[1] && args[1].toLowerCase() === '-r')) {
            this.lsRecursive(args, command);
            return;
        }

        let path = args[0];
        if (!path || args[0].toLowerCase() === '-r') {
            path = '.';
        }

        if (!this.isDirectory(path)) {
            console.log(chalk.red(`Error: that path doesn't exist`));
            return;
        } 
    
        const tree: any[] = [];
        const files: string[] = [];
        const contents = fs.readdirSync(path, "ascii");
        contents.forEach(element => {
            if (this.isDirectory(`${path}/${element}`)) {
                const directoryContents = fs.readdirSync(`${path}/${element}`, "ascii");
                tree.push({
                name: element,
                contents: directoryContents
                });
            } else {
                files.push(element);
            }
        });

        tree.forEach(element => {
            if (element.contents) {
                let dashString = " ";
                for (let i = 0; i < 25 - element.name.length; i ++) {
                    dashString += "—";
                }

                if (this.isHidden(`${path}/${element.name}`)) {
                    console.log(this.styleAsHidden(element.name + dashString));
                } else {
                    console.log(chalk.blueBright(element.name + dashString));
                }

                console.log('    ' + this.getDirContentString(element.contents, `${path}/${element.name}`));
            } else {
                console.log(this.isHidden(element.name) ? this.styleAsHidden(element.name): element.name);
            }
        });

        if (files.length > 0) {
            console.log("——————————————————————————————");
            console.log(this.getFilesString(files));
        }
    }

    private lsRecursive = async (args: string[], command: Command) => {
        let path = args[0];
        if (!path || path.toLowerCase() === '-r') {
            path = '.';
        }
    
        if (!this.isDirectory(path)) {
            console.log(chalk.red(`Error: that path doesn't exist`));
            return;
        } 

        const tree: any[] = [];
        const files: string[] = [];
        const contents = fs.readdirSync(path, "ascii");
        const directories = contents.filter(element => this.isDirectory(`${path}/${element}`));
        directories.unshift('..');
        console.log(chalk.grey("——————————————————————————————"));
        console.log(this.getDirContentString(contents, path).replace(/    /g, ''));
        console.log(chalk.grey("——————————————————————————————"));
        const selection = await ConsoleUtil.getInputFromList('Select a new path:', directories);
        const nextPath = `${path}/${selection}`;
        console.log(chalk.yellow(nextPath));
        this.lsRecursive([nextPath, '-r'], command);

    }

    private isHidden = (path: string): boolean => {
        return (/(^|\/)\.[^\/\.]/g).test(path);
    }

    private styleAsHidden(str: string) {
        return chalk.grey(str);
    }

    private getDirContentString(contents: string[], parent: string) {
        const directories: any[] = [];
        const files: string[] = [];
        contents.forEach(element => {
            if (this.isDirectory(`${parent}/${element}`)) {
                const coloredElement = chalk.blueBright(element);
                directories.push(this.isHidden(element) ? this.styleAsHidden(element): coloredElement);
            } else {
                files.push(element);

            }
        });
    
        contents = directories.concat(files);
    
        const formattedArray: any[] = [];
        let currentLineLength = 0;
        contents.forEach((element, index) => {
            currentLineLength += stringLength(element);
            if (currentLineLength > 80 ) {
                formattedArray.push('\n  ');
                currentLineLength = 0;
            }
        
            formattedArray.push(element);
        });
    
        const dirContentString = formattedArray.toString().replace(/,/g, '  ');
        return dirContentString;
    }
    
    private getFilesString(files: string[]) {
        const formattedArray: any[] = [];
        let currentLineLength = 0;
        files.forEach((file) => {
            currentLineLength += stringLength(file);
            if (currentLineLength > 80 ) {
                formattedArray.push('\n');
                currentLineLength = 0;
            }
            const styledFile = this.isHidden(file) ? this.styleAsHidden(file) : file;
            formattedArray.push(styledFile);
        });
    
        let filesString = formattedArray.toString().replace(/\n,/g, '\n');
        filesString = filesString.replace(/,/g, '  ');
        return filesString;
    }

    private isDirectory(path: string) {
        try {
            return this.fileOrDirectoryExists(path) && fs.lstatSync(path).isDirectory();
        } catch (error) {
            return false;
        }
    }

    private fileOrDirectoryExists(path: string) {
        return fs.existsSync(path);
    }

    private http = async (args: string[], command: Command) => {
        if (args.length > 3) {
          console.log('Error: Too many arguments.');
          process.exit();
        }
      
        const validMethods = ['get', 'post', 'patch', 'put', 'delete'];
        let method = args[0];
        if (!method || !validMethods.includes(method) ) {
            method = await ConsoleUtil.getInputFromList('Choose a method:', validMethods);
        }
      
        let url = args[1];
        if (!url || !this.urlIsValid(url) ) {
            url = await ConsoleUtil.getInput('Please enter a valid request URL:');
        }
      
        let payload = args[2];
        if (method === 'post' && !payload) {
            payload = await ConsoleUtil.getInput('Type a request payload in JSON format');
        }
      
        let options: any = { url, method };
      
        if (payload) {
          try {
            payload = payload.replace(/\'/g, "\"");
            options = JSON.parse(payload);
            options.url = url;
            options.method = method;
          } catch (error) {
            console.log('Error: Couldn\'t parse JSON');
            console.log(error);
            process.exit();
          }
        }
      
        const request: any = await axios.request(options).catch((error: any) => {
            if (error.response) {
                console.log(`Error: (${error.response.status}: ${error.response.statText})`);
            } else {
                console.log("Error: No Response");
            }
            process.exit();
        });
      
        console.log(request.data);
    }
      
    private urlIsValid(url: string) {
        const pattern = new RegExp(
            '^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator

        return !!pattern.test(url);
    }

    private ask = async (args: string[], command: Command) => {
        if (!CommandUtil.validateArguments(args, 1, Number.MAX_SAFE_INTEGER)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }

        const query = args.join(' ').toLowerCase();
        const response: any = await axios.get(`https://api.duckduckgo.com/?q=${query}&format=json`).catch(error => {
            console.log(chalk.red(`Error: Couldn't contact DuckDuckGo Instant Answer API.`));
            if (error.response) {
                console.log(`Response: ${error.response.status}, ${error.response.statusText}`);
            }
            process.exit();
        });

        const entity = response.data.Entity;
        const heading = response.data.Heading;
        const abstract = response.data.Abstract;
        if (!response.data.RelatedTopics) {console.log(response.data);}

        let relatedTopics = response.data.RelatedTopics.map((topic: any) => {
            if (topic.Result) {
                const result = topic.Result.split('>')[1].split('<')[0].trim();
                return result;
            }
        });

        relatedTopics = relatedTopics.filter((topic: any) => {
            return topic && topic.toLowerCase() !== query.toLowerCase() &&
            topic.slice(topic.length - 8, topic.length) !== 'Category';
        });

        console.log(chalk.green('——————————————————————————————————————————————————————————————————————————————\n'));
        if (abstract) {
            entity && !entity.includes(',') && !entity.includes('|') ? console.log(chalk.blueBright(`${heading} (${entity}):`)) : console.log(chalk.blueBright(`${heading}:`));
            console.log(abstract);
        } else {
            if (response.data.Type && (response.data.Type === 'D' || response.data.Type === 'C') && relatedTopics.length > 0) {
                const topic = query.substr(0,1).toUpperCase() + query.substr(1, query.length - 1);
                relatedTopics.unshift(topic);
                console.log(chalk.yellow('Disambiguation:'));
                console.log(relatedTopics.join(', '));
            } else {
                const wolframResponse: any = await axios.get(`https://api.wolframalpha.com/v1/result?i=${query}&appid=8W3AA6-587U33TA5J`).catch(() => null);

                if (wolframResponse && wolframResponse.data) {console.log(wolframResponse.data);}
                else {console.log(chalk.grey(`No results found`));}
            }
        }
        console.log(chalk.green('\n——————————————————————————————————————————————————————————————————————————————'));
        if (relatedTopics.length > 0) {
            let newQuestion = await ConsoleUtil.getInputFromList(chalk.reset.yellow('Select a related topic:'),relatedTopics);
            if (newQuestion.toLowerCase() === query.toLowerCase()) { newQuestion = newQuestion + ' wikipedia';}
            this.ask(newQuestion.split(' '), command);
        } else if (response.data.Type) {
            console.log(chalk.gray('No related topics found'));
        }

    }

    // Command Configuration

    protected readonly commands: Command[] = [
        {
            string: 'ls',
            function: this.ls,
            usage: `wk ls <directory path (optional)> -r (recursively traverse directories with prompt)`,
            description: `Shows the files and directories in the path given. If a path is not given, the current directory is shown.`
        },
        {
            string: 'http',
            function: this.http,
            usage: `wk http '<HTTP method (optional)> <url (optional)> '<payload in JSON format (optional)>'`,
            description: `Makes http requests and prints the results.`
        },
        {
            string: 'ask',
            function: this.ask,
            usage: `wk ask <natural language query>`,
            description: `Responds to natural language queries using the DuckDuckGo Instant Answer API.`
        },
        {
            string: 'set',
            function: this.set,
            usage: `wk set <keyword> '<executable shell command>'`,
            description: `Creates a shortcut keyword for the given command. Can then be used as follows: wk <keyword>.`
        },
        {
            string: 'get',
            function: this.get,
            usage: `wk get`,
            description: `Lists keywords defined with the 'wk set' command.`
        },
        {
            string: 'unset',
            function: this.unset,
            usage: `wk unset <keyword>`,
            description: `Removes a shortcut keyword defined with the 'wk set' command.`
        },
        {
            string: 'test',
            function: () => {
                process.stdout.write("Hello, World" + "\nTEST");
                // process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.clearLine(null);
                // process.stdout.write("Hello, ASIAN");
                process.stdout.write("\n"); // end the line
            },
            usage: `wk unset <keyword>`,
            description: `Removes a shortcut keyword defined with the 'wk set' command.`
        },
    ];
}