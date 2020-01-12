import axios from 'axios';
import chalk from 'chalk';
import * as fs from 'fs';
import { Command, CommandUtil } from './Utilities/CommandUtil';
import { ConfigUtil } from './Utilities/ConfigUtil';
import { ConsoleUtil } from './Utilities/ConsoleUtil';

export default class Git {

    private config = new ConfigUtil();

    public handleSystemArguments(systemArguments: string[]) {
        const args = systemArguments.slice(2);
        const secondaryArgs = systemArguments.slice(3);
        const command = CommandUtil.getClosestMatch(args[0], this.commands);
        command.function(secondaryArgs, command);
    }

    private async commitAll(args: string[], command: Command) {
        if (!CommandUtil.validateArguments(args, 0, 1)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }

        let message = args[0];

        if (args.length <= 0) {
            message = await ConsoleUtil.getInput('Please enter a commit message:');
        }
        else if (args.length > 1) {
            message = await ConsoleUtil.getInput('Too many arguments. Please enter a commit message:');
        }

        CommandUtil.runShell(`git add -A && git commit -m "${message}"`);
    }

    private async pushAll(args: string[], command: Command) {
        if (!CommandUtil.validateArguments(args, 0, 1)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }

        let message = args[0];

        if (args.length <= 0) {
            message = await ConsoleUtil.getInput('Please enter a commit message:');
        }
        else if (args.length > 1) {
            message = await ConsoleUtil.getInput('Too many arguments. Please enter a commit message:');
        }

        CommandUtil.runShell(`git add -A && git commit -m "${message}" && git push`);
    }

    private async deleteTag(args: string[], command: Command) {
        if (!CommandUtil.validateArguments(args, 0, 1)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }

        let tag = args[0];
        if (args.length <= 0) {
            tag = await ConsoleUtil.getInput('Please enter a tag to delete:');
        }

        CommandUtil.runShell(`git tag -d ${tag} && git push --delete origin ${tag}`);
    }

    private setToken = async (args: string[], command: Command) => {
        if (!CommandUtil.validateArguments(args, 0, 1)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }

        let token = args[0];
        if (!token) {
            token = await ConsoleUtil.getInput('Enter your Personal Access Token:');
        }

        this.config.set.wgit.githubPersonalAccessToken(token);
        console.log(`Successfully set token: '${token}'.`);
    }

    private init = async (args: string[], command: Command) => {
        if (!CommandUtil.validateArguments(args, 0, 2)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }

        let name = args[0];
        let description = args[1];

        if (!name) {
            name = await ConsoleUtil.getInput('Enter a repo name:');
        }

        if (!description) {
            description = await ConsoleUtil.getInput('Enter a description:');
        }
        const repoIsPublic = await ConsoleUtil.getConfirmation('Should the repo be public?');

        const token = await this.getPersonalAccessToken();
        if (!token) {
            console.log('This operation requires that you establish a GitHub Personal Access Token with the \'wgit settoken\' command.');
            return;
        }
        const response: any = await axios.post(`https://api.github.com/user/repos?access_token=${token}`, {
            "name": `${name}`,
            "description": `${description}`,
            "private": !repoIsPublic,
            validateStatus: (status: any) => {
                return status >= 200 && status < 300;
            },
        }).catch(error => {
            console.log(chalk.red(`Error: Couldn't create repo.`));
            if (error.response) {
                console.log(`Response: ${error.response.status}, ${error.response.statusText}`);
            }
            process.exit();
        });

        const url = response.data.ssh_url;
        CommandUtil.runShell(`git clone ${url}`);
    }

    private clone = async (args: string[], command: Command) =>  {
        if (!CommandUtil.validateArguments(args, 0, 1)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }

        if (args[0]) {
            CommandUtil.runShell(`git clone ${args[0]}`);
            return;
        }

        const token = await this.getPersonalAccessToken();
        const response: any = await axios.get(`https://api.github.com/user/repos?access_token=${token}`, {
            validateStatus:  (status) => {
                return status >= 200 && status < 300;
            },
        }).catch(error => {
            console.log(chalk.red(`Error: Couldn't get list of repos.`));
            if (error.response) {
                console.log(`Response: ${error.response.status}, ${error.response.statusText}`);
            }
            process.exit();
        });

        const repos: string[] = [];
        const urls: string[] = [];
        response.data.forEach((repo: any) => {
            repos.push(repo.full_name);
            urls.push(repo.ssh_url);
        });

        if (repos.length > 0) {
            const repo = await ConsoleUtil.getInputFromList('Select a repo to clone:', repos);
            const index = repos.indexOf(repo);
            const url = urls[index];
            if (fs.existsSync(repo)) {
                console.log('Error: That repo already exists here.');
                return;
            }
            CommandUtil.runShell(`git clone ${url}`);
        } else {
            console.log('Couldn\'t find any repos');
        }
    }

    private searchRepos = async (args: string[], command: Command) => {
        if (!CommandUtil.validateArguments(args, 0, 1000)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }

        if (args.length <= 0) {
            console.log('Search queries may include qualifiers. Examples:');
            console.log('user:anthony-autrey org:centurylink language:javascript is:public stars:>=100');
            const input = await ConsoleUtil.getInput('Enter a search query:');
            args = input.split(' ');
        }

        const query = this.buildSearchQuery(args);
        const token = await this.getPersonalAccessToken();
        const response: any = await axios.get(`https://api.github.com/search/repositories?q=${query}&access_token=${token}`)
        .catch(error => {
            console.log('Error: Couldn\'t get list of repos.');
            process.exit();
        });

        const repos: any[] = [];
        response.data.items.forEach((repo: any) => {
            repos.push({name: repo.full_name, url: repo.ssh_url});
        });

        if (repos.length <= 0) {
            console.log('No search results found.');
            process.exit();
        }

        console.log(`${repos.length} repos found.`);
        const repoChoices = repos.map(repo => repo.name);
        const selectedRepo = await ConsoleUtil.getInputFromList('Select a repo from the list:', repoChoices);
        const selectedRepoInfo = repos.find(repo => {
            return repo.name === selectedRepo;
        });
        const actionChoices = ['Clone here', 'Delete', 'Cancel'];
        const selectedAction = await ConsoleUtil.getInputFromList('What do you want to do with this repo?:', actionChoices);
        if (selectedAction === 'Clone here') {
            if (fs.existsSync(selectedRepoInfo.name)) {
            console.log('Error: That repo already exists here.');
            process.exit();
            }
            await CommandUtil.runShell(`git clone ${selectedRepoInfo.url}`);
        } else if (selectedAction === 'Delete') {
            const typedConfirmation = await ConsoleUtil.getInput(`To confirm deletion, type the full name of the repo: (${selectedRepoInfo.name}) THIS CANNOT BE UNDONE!`);
            if (typedConfirmation === selectedRepoInfo.name) {
                axios.delete(`https://api.github.com/repos/${selectedRepoInfo.name}?access_token=${token}`).then(() => {
                    console.log('Successfully deleted repo.');
                }).catch(error => {
                    console.log('Error: ' + error.response.statusText);
                });
            } else {
            console.log('Names didn\'t match. Aborting.');
            }
        }
    }

    private buildSearchQuery(queryArray: string[]) {
        let queryString = '';
        queryArray.forEach(arg => {
            queryString += arg + '+';
        });

        return encodeURI(queryString);
    }

    private async getPersonalAccessToken(require ?: boolean): Promise < string > {
        let token = this.config.get.wgit.githubPersonalAccessToken();
        if(token == null) {
            const getToken = await ConsoleUtil.getConfirmation('You haven\'t registered a GitHub Personal Access Token. Do you want to now?');
            if (getToken) {
                console.log('  Go to GitHub.com > User Settings > Developer Settings to create a Personal Access Token');
                token = await ConsoleUtil.getInput('Enter your Personal Access Token:');
                this.config.set.wgit.githubPersonalAccessToken(token);
            } else {
                token = '';
                this.config.set.wgit.githubPersonalAccessToken('');
                console.log('You declined using a Personal Access Token. This means you\'ll only have anonymous access to the GitHub API.');
                console.log('To change your token later, use the \'wgit settoken\' command.');
            }
        }

        return Promise.resolve(token);
    }

    // Command Configuration

    protected readonly commands: Command[] = [
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
            description: 'Creates a new GitHub repo and clones it in the current directory. (Requires GitHub Personal Access Token).'
        },
        {
            string: 'clone',
            function: this.clone,
            usage: 'wgit clone <repo url (optional)>',
            description: 'Searches your GitHub repos and presents you with a list from which to clone in the current directory.'
        },
        {
            string: 'searchrepos',
            function: this.searchRepos,
            usage: `wgit searchrepos <query (optional)> Note: queries may include qualifiers, i.e. org:facebook`,
            description: 'Takes query and searches for GitHub repos, then presents a list from which you can execute actions on the repos.'
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
        }
    ];
}

