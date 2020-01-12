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
import { CommandUtil } from './Utilities/CommandUtil';
import { ConfigUtil } from './Utilities/ConfigUtil';
import { ConsoleUtil } from './Utilities/ConsoleUtil';
export default class Git {
    constructor() {
        this.config = new ConfigUtil();
        this.setToken = (args, command) => __awaiter(this, void 0, void 0, function* () {
            if (!CommandUtil.validateArguments(args, 0, 1)) {
                ConsoleUtil.logInvalidArgumentsError(command);
                return;
            }
            let token = args[0];
            if (!token) {
                token = yield ConsoleUtil.getInput('Enter your Personal Access Token:');
            }
            this.config.set.wgit.githubPersonalAccessToken(token);
            console.log(`Successfully set token: '${token}'.`);
        });
        this.init = (args, command) => __awaiter(this, void 0, void 0, function* () {
            if (!CommandUtil.validateArguments(args, 0, 2)) {
                ConsoleUtil.logInvalidArgumentsError(command);
                return;
            }
            let name = args[0];
            let description = args[1];
            if (!name) {
                name = yield ConsoleUtil.getInput('Enter a repo name:');
            }
            if (!description) {
                description = yield ConsoleUtil.getInput('Enter a description:');
            }
            const repoIsPublic = yield ConsoleUtil.getConfirmation('Should the repo be public?');
            const token = yield this.getPersonalAccessToken();
            if (!token) {
                console.log('This operation requires that you establish a GitHub Personal Access Token with the \'wgit settoken\' command.');
                return;
            }
            const response = yield axios.post(`https://api.github.com/user/repos?access_token=${token}`, {
                "name": `${name}`,
                "description": `${description}`,
                "private": !repoIsPublic,
                validateStatus: (status) => {
                    return status >= 200 && status < 300;
                },
            }).catch(error => {
                if (error.response) {
                    console.log(`${chalk.red(`Error: Couldn't create repo.`)}`);
                    console.log(`Response: ${error.response.status}, ${error.response.statusText}`);
                }
                process.exit();
            });
            const url = response.data.ssh_url;
            CommandUtil.runShell(`git clone ${url}`);
        });
        this.commands = [
            {
                string: 'commitall',
                function: this.commitAll,
                usage: `wgit commitall '<commit message (optional)>'`,
                description: `Stages and commits all current changes. If a commit message isn't included, a prompt will accept one.`
            },
            {
                string: 'pushall',
                function: this.pushAll,
                usage: `wgit pushall '<commit message (optional)>'`,
                description: `Stages, commits and pushes all current changes. If a commit message isn't included, a prompt will accept one.`
            },
            {
                string: 'init',
                function: this.init,
                usage: `wgit init '<name (optional)> '<description (optional)>'`,
                description: 'Creates a new GitHub repo and clones it in the current directory. (Requires GitHub Personal Access Token)'
            },
            {
                string: 'clone',
                function: () => { },
                usage: '',
                description: ''
            },
            {
                string: 'searchrepos',
                function: () => { },
                usage: '',
                description: ''
            },
            {
                string: 'deletetag',
                function: this.deleteTag,
                usage: `wgit deletetag <tag (optional)>`,
                description: 'Deletes a tag both locally and in origin.'
            },
            {
                string: 'settoken',
                function: this.setToken,
                usage: 'wgit settoken <token (optional)>',
                description: 'Sets a GitHub personal access token for accessing the GitHub API.'
            },
            {
                string: 'testconfig',
                function: () => {
                    const config = new ConfigUtil();
                    let token = config.get.wgit.githubPersonalAccessToken();
                    console.log('1 --> ' + token);
                    config.set.wgit.githubPersonalAccessToken(null);
                    token = config.get.wgit.githubPersonalAccessToken();
                    if (token) {
                        console.log('was token. -> ' + token);
                    }
                    else {
                        console.log('no token -> ' + token);
                    }
                    config.set.wgit.githubPersonalAccessToken('not null');
                    token = config.get.wgit.githubPersonalAccessToken();
                    if (token) {
                        console.log('was token. -> ' + token);
                    }
                    else {
                        console.log('no token -> ' + token);
                    }
                },
                usage: '',
                description: ''
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
    pushAll(args, command) {
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
            CommandUtil.runShell(`git add -A && git commit -m "${message}" && git push`);
        });
    }
    deleteTag(args, command) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!CommandUtil.validateArguments(args, 0, 1)) {
                ConsoleUtil.logInvalidArgumentsError(command);
                return;
            }
            let tag = args[0];
            if (args.length <= 0) {
                tag = yield ConsoleUtil.getInput('Please enter a tag to delete:');
            }
            CommandUtil.runShell(`git tag -d ${tag} && git push --delete origin ${tag}`);
        });
    }
    getPersonalAccessToken(require) {
        return __awaiter(this, void 0, void 0, function* () {
            let token = this.config.get.wgit.githubPersonalAccessToken();
            if (token == null) {
                const getToken = yield ConsoleUtil.getConfirmation('You haven\'t registered a GitHub Personal Access Token. Do you want to now?');
                if (getToken) {
                    console.log('  Go to GitHub.com > User Settings > Developer Settings to create a Personal Access Token');
                    token = yield ConsoleUtil.getInput('Enter your Personal Access Token:');
                    this.config.set.wgit.githubPersonalAccessToken(token);
                }
                else {
                    token = '';
                    this.config.set.wgit.githubPersonalAccessToken('');
                    console.log('You declined using a Personal Access Token. This means you\'ll only have anonymous access to the GitHub API.');
                    console.log('To change your token later, use the \'wgit settoken\' command.');
                }
            }
            return Promise.resolve(token);
        });
    }
}
//# sourceMappingURL=Git.js.map