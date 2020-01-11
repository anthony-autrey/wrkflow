var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as child from 'child_process';
export class CommandUtil {
    static getClosestMatch(command, possibleCommands) {
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
        }
        else if (matches.length > 1) {
            console.log('Error: Ambiguous command. Did you mean [ ' + matches.toString().replace(/,/g, ', ') + ' ] ?');
            process.exit();
        }
        const matchingCommand = possibleCommands.find(possibleCommand => {
            return possibleCommand.string === matches[0].toLowerCase();
        });
        return matchingCommand;
    }
    static getUnknownCommandString(commands) {
        return `Try one of the following: [ ${commands.toString().replace(/,/g, ', ')} ]`;
    }
    static runShell(command) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
}
