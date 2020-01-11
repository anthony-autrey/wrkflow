var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CommandUtil } from './Utilities/CommandUtil';
import { InputUtil } from './Utilities/InputUtil';
export default class Git {
    constructor() {
        this.commands = [
            { string: 'commitall', function: Git.commitAll },
            { string: 'pushall', function: Git.pushAll },
            { string: 'init', function: () => { } },
            { string: 'clone', function: () => { } },
            { string: 'searchrepos', function: () => { } },
            { string: 'deletetag', function: () => { } },
            { string: 'settoken', function: () => { } },
        ];
    }
    handleSystemArguments(systemArguments) {
        const args = systemArguments.slice(2);
        const secondaryArgs = systemArguments.slice(3);
        const command = CommandUtil.getClosestMatch(args[0], this.commands);
        command.function(secondaryArgs);
    }
    static commitAll(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let message = args[0];
            if (args.length <= 0) {
                message = yield InputUtil.getInput('Please enter a commit message:');
            }
            else if (args.length > 1) {
                message = yield InputUtil.getInput('Too many arguments. Please enter a commit message:');
            }
            CommandUtil.runShell(`git add -A && git commit -m "${message}"`);
        });
    }
    static pushAll(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let message = args[0];
            if (args.length <= 0) {
                message = yield InputUtil.getInput('Please enter a commit message:');
            }
            else if (args.length > 1) {
                message = yield InputUtil.getInput('Too many arguments. Please enter a commit message:');
            }
            CommandUtil.runShell(`git add -A && git commit -m "${message}" && git push`);
        });
    }
}
