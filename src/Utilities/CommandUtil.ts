import * as child from 'child_process';

export interface Command {
    string: string;
    function: (args: string[], command: Command) => void;
    usage: string;
    description: string;
}

export class CommandUtil {
    
    public static getClosestMatch(command: string, possibleCommands: Command[]): Command {
        const possibleCommandStrings = possibleCommands.map(possibleCommand => {
            return possibleCommand.string;
        });
        if (!command) {
            console.log(CommandUtil.getUnknownCommandString(possibleCommandStrings));
            process.exit();
        }
    
        let matches = possibleCommandStrings;
        let letters = '';
        Array.from(command.toLowerCase()).forEach(letter => {
            letters += letter;
            matches = matches.filter(match => {
                return match.substring(0, letters.length) === letters;
            });
        });
    
        if (matches.length <= 0) {
        console.log(CommandUtil.getUnknownCommandString(possibleCommandStrings));
        process.exit();
        } else if (matches.length > 1) {
        console.log('Error: Ambiguous command. Did you mean [ ' + matches.toString().replace(/,/g, ', ') + ' ] ?');
        process.exit();
        }
    
        const matchingCommand = possibleCommands.find(possibleCommand => {
            return possibleCommand.string === matches[0].toLowerCase();
        });

        return matchingCommand;
    }

    public static getUnknownCommandString(commands: string[]) {
        return `Try one of the following: [ ${commands.toString().replace(/,/g, ', ')} ]`;
    }

    public static validateArguments(args: string[], minArgs: number, maxArgs: number, regex: RegExp[] = []) : boolean {
        if (args.length < minArgs || args.length > maxArgs) {
            return false;
        }

        let allRegexMatch = true;
        regex.forEach((reg, index) => {
            if (!args[index]) {
                throw new Error('Unexpected: more regex provided than args');
            }

            if (!reg.test(args[index])) {
                allRegexMatch = false;
            }
        });

        return allRegexMatch;
    }

    public static async runShell(command: string) {
        child.exec(command, { env: process.env }, (err, stdout, stderr) => {
            if (err) {
                const error = err.message;
                console.log(error.substr(0, error.length - 1));
            }
            if (stdout) {
                console.log(stdout);
            }
            if (stderr && !err) {
                console.log(stderr.substr(0, stderr.length - 1));
            }
        });
    }
}