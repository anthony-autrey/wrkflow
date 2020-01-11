import * as input from 'inquirer';

export class InputUtil {
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
}