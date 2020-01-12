var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import chalk from 'chalk';
import * as input from 'inquirer';
export class ConsoleUtil {
    static getInput(message, defaultValue) {
        return __awaiter(this, void 0, void 0, function* () {
            const question = yield input.prompt({ name: 'answer', type: 'input', message, default: defaultValue });
            return Promise.resolve(question.answer);
        });
    }
    static getInputFromList(message, list) {
        return __awaiter(this, void 0, void 0, function* () {
            const question = yield input.prompt({ name: 'answer', type: 'list', message, choices: list, default: 0 });
            return Promise.resolve(question.answer);
        });
    }
    static getConfirmation(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const question = yield input.prompt({ name: 'answer', type: 'confirm', message, default: 0 });
            return Promise.resolve(question.answer);
        });
    }
    static logInvalidArgumentsError(command) {
        console.log(chalk.red('Invalid Arguments, Usage: ') + chalk.white(command.usage));
    }
}
//# sourceMappingURL=ConsoleUtil.js.map