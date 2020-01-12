import chalk from 'chalk';
import * as input from 'inquirer';
import { Command } from './CommandUtil';


export class ConsoleUtil {

    public static async getInput(message: string, defaultValue?: string): Promise<string> {
      const question = await input.prompt({name: 'answer', type: 'input', message, default: defaultValue});
      return Promise.resolve(question.answer);
    }
    
    public static async getInputFromList(message: string, list: string[]): Promise<string> {
      const question = await input.prompt({name: 'answer', type: 'list', message, choices: list, default: 0});
      return Promise.resolve(question.answer);
    }
    
    public static async getConfirmation(message: string): Promise<boolean> {
      const question = await input.prompt({name: 'answer', type: 'confirm', message, default: 0});
      return Promise.resolve(question.answer);
    }

    public static logInvalidArgumentsError(command: Command) {
      console.log(chalk.red('Invalid Arguments, Usage: ') + chalk.white(command.usage));
  }

}