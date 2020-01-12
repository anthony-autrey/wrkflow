import axios from 'axios';
import chalk from 'chalk';
import { Command, CommandUtil } from './Utilities/CommandUtil';
import { ConfigUtil } from './Utilities/ConfigUtil';
import { ConsoleUtil } from './Utilities/ConsoleUtil';
import { async } from 'rxjs/internal/scheduler/async';

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
            validateStatus: (status: any) =>  {
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
    }

    private async getPersonalAccessToken(require?: boolean): Promise<string> {
        let token = this.config.get.wgit.githubPersonalAccessToken();
        if (token == null) {
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
                } else {
                    console.log('no token -> ' + token);
                }

                config.set.wgit.githubPersonalAccessToken('not null');
                token = config.get.wgit.githubPersonalAccessToken();
                if (token) {
                    console.log('was token. -> ' + token);
                } else {
                    console.log('no token -> ' + token);
                }

            },
            usage: '',
            description: ''
        },
    ];
}



// async function clone(secondaryArgs) {
//   let token = await getPersonalAccessToken();
//   let response = await axios.get(`https://api.github.com/user/repos?access_token=${token}`, {
//     validateStatus: function (status) {
//       return status >= 200 && status < 300;
//     },
//   }).catch(error => {
//     console.log('Error: Couldn\'t get list of repos.')
//     let token = getConfig('github_personal_access_token')
//     if (token == '')
//       console.log('You need to establish a GitHub Personal Access Token with the \'wgit settoken\' command.')
//     process.exit();
//   });

//   let repos = [];
//   let urls = [];
//   response.data.forEach(repo => {
//     repos.push(repo.full_name)
//     urls.push(repo.ssh_url)
//   })

//   if (repos.length > 0) {
//     let repo = await getInputFromList('Select a repo to clone:', repos);
//     let index = repos.indexOf(repo)
//     let url = urls[index];
//     if (fs.existsSync(repo)) {
//       console.log('Error: That repo already exists here.')
//       process.exit();
//     }
//     await CommandUtil.runShell(`git clone ${url}`)
//   } else {
//     Console.log('Couldn\'t find any repos')
//     process.exit();
//   }
// }

// async function searchRepos(secondaryArgs) {
//   if (secondaryArgs.length <= 0) {
//     console.log('Search queries may include qualifiers. Examples:')
//     console.log('user:anthony-autrey org:centurylink language:javascript is:public stars:>=100')
//     let input = await InputUtil.getInput('Enter a search query:')
//     secondaryArgs = input.split(' ')
//   }

//   let query = buildSearchQuery(secondaryArgs);
//   let token = await getPersonalAccessToken();
//   let response = await axios.get(`https://api.github.com/search/repositories?q=${query}&access_token=${token}`).catch(error => {
//     console.log('Error: Couldn\'t get list of repos.')
//     process.exit();
//   });

//   let repos = [];
//   response.data.items.forEach(repo => {
//     repos.push({name: repo.full_name, url: repo.ssh_url})
//   })

//   if (repos.length <= 0) {
//     console.log('No search results found.')
//     process.exit();
//   }

//   console.log(`${repos.length} repos found.`)
//   let repoChoices = repos.map(repo => { return repo.name });
//   let selectedRepo = await getInputFromList('Select a repo from the list:', repoChoices);
//   let selectedRepoInfo = repos.find(repo => {
//     return repo.name == selectedRepo;
//   })
//   let actionChoices = ['Clone here', 'Delete', 'Cancel']
//   let selectedAction = await getInputFromList('What do you want to do with this repo?:', actionChoices);
//   if (selectedAction == 'Clone here') {
//     if (fs.existsSync(selectedRepoInfo.name)) {
//       console.log('Error: That repo already exists here.')
//       process.exit();
//     }
//     await CommandUtil.runShell(`git clone ${selectedRepoInfo.url}`)
//   } else if (selectedAction == 'Delete') {
//     let typedConfirmation = await InputUtil.getInput(`To confirm deletion, type the full name of the repo: (${selectedRepoInfo.name}) THIS CANNOT BE UNDONE!`);
//     if (typedConfirmation == selectedRepoInfo.name) {
//       axios.delete(`https://api.github.com/repos/${selectedRepoInfo.name}?access_token=${token}`).then(() => {
//         console.log('Successfully deleted repo.')
//       }).catch(error => {
//         console.log('Error: ' + error.response.statusText)
//       })
//     } else {
//       console.log('Names didn\'t match. Aborting.')
//     }
//   }
// }

// function buildSearchQuery(args) {
//   let queryString = ''
//   args.forEach(arg => {
//     queryString += arg + '+'
//   });

//   return encodeURI(queryString)
// }

// async function writeConfigFile(filename, contents) {
//   fs.mkdirSync(`${process.env.HOME}/.wgit_config`, { recursive: true })
//   if (contents == '') {
//     fs.closeSync(fs.openSync(`${process.env.HOME}/.wgit_config/${filename}`, 'w'))
//     return Promise.resolve('')
//   }

//   fs.writeFile(`${process.env.HOME}/.wgit_config/${filename}`, contents, error => {
//     console.log(error)

//     if (error)
//       Promise.reject('Error: Couldn\'t write to file.');
//     else
//       Promises.resolve(contents);
//   })
// }

// function configExists(file) {
//   return fs.existsSync(`${process.env.HOME}/.wgit_config/${file}`);
// }

// function getConfig(file) {
//   return fs.readFileSync(`${process.env.HOME}/.wgit_config/${file}`, {encoding: 'ascii'});
// }

// async function takePersonalAccessTokenInput() {
//   console.log('  Go to GitHub.com > User Settings > Developer Settings to create a Personal Access Token');
//   let token = await InputUtil.getInput('Enter your Personal Access Token:')
//   await writeConfigFile('github_personal_access_token', token).catch(error => {});

//   return Promise.resolve(token);
// }

// async function getPersonalAccessTokenIfNotEstablished() {
//   let tokenExists = configExists('github_personal_access_token');
//   if (tokenExists) {
//     let token = getConfig('github_personal_access_token');
//     return Promise.resolve(token);
//   } else {
//       return getPersonalAccessTokenWithPrompts();
//   }
// }

// async function getPersonalAccessTokenWithPrompts() {
//   let getToken = await getConfirmation('You haven\'t registered a GitHub Personal Access Token. Do you want to now?')
//   if (getToken) {
//     let token = await takePersonalAccessTokenInput();
//     return Promise.resolve(token);
//   } else {
//     console.log('You declined using a Personal Access Token. This means you\'ll only have anonymous access to the GitHub API.');
//     console.log('To change your token later, use the \'wgit settoken\' command.');
//     let token = await writeConfigFile('github_personal_access_token', '').catch(error => {
//       console.log(error)
//     });
//     return Promise.resolve(token);
//   }
// }

// async function getPersonalAccessToken() {
//   let token = await getPersonalAccessTokenIfNotEstablished().catch(error => {
//     if (error == 'declined token')
//       console.log('You must establish a GitHub Personal Access Token for this command')
//     else
//       console.log('Error: Couldn\'t obtain GitHub Personal Access Token');

//     process.exit();
//   });

//   return Promise.resolve(token);
// }

// async function setToken() {
//   if (configExists('github_personal_access_token') && getConfig('github_personal_access_token') !== '') {
//     if (await getConfirmation('You\'ve already set a GitHub Personal Access Token. Do you want to replace it?'))
//       await takePersonalAccessTokenInput();
//     else
//       await getPersonalAccessToken();
//     process.exit();
//   } else {
//     await takePersonalAccessTokenInput();
//   }
// }

// async function getGitHubUsername() {
//   let usernameExists = configExists('github_username');
//   if (usernameExists) {
//     let user = getConfig('github_username');
//     return Promise.resolve(username);
//   } else {
//     let getUsername = await getConfirmation('You haven\'t registered a GitHub username. Do you want to now?')
//     if (getUsername) {
//       let username = await InputUtil.getInput('Enter your GitHub username:')
//       await writeConfigFile('github_username', username).catch(error => console.log(error));
//       return Promise.resolve(username);
//     } else
//       return Promise.resolve(undefined);
//   }
// }



