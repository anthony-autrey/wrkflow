import axios from 'axios';
import * as fs from 'fs';
import { Command, CommandUtil } from './Utilities/CommandUtil';
import { InputUtil } from './Utilities/InputUtil';

export default class Git {
    
    protected readonly commands: Command[] = [
        {string: 'commitall', function: Git.commitAll},
        {string: 'pushall', function: Git.pushAll},
        {string: 'init', function: () => {}},
        {string: 'clone', function: () => {}},
        {string: 'searchrepos', function: () => {}},
        {string: 'deletetag', function: () => {}},
        {string: 'settoken', function: () => {}},
    ];

    public handleSystemArguments(systemArguments: string[]) {
        const args = systemArguments.slice(2);
        const secondaryArgs = systemArguments.slice(3);
        const command = CommandUtil.getClosestMatch(args[0], this.commands);
        command.function(secondaryArgs);
    }

    private static async commitAll(args: string[]) {
        let message = args[0];
      
        if (args.length <= 0) {
            message = await InputUtil.getInput('Please enter a commit message:');
        }
        else if (args.length > 1) {
            message = await InputUtil.getInput('Too many arguments. Please enter a commit message:');
        }
      
        CommandUtil.runShell(`git add -A && git commit -m "${message}"`);
    }

    private static async pushAll(args: string[]) {
      let message = args[0];
    
      if (args.length <= 0) {
          message = await InputUtil.getInput('Please enter a commit message:');
      }
      else if (args.length > 1) {
          message = await InputUtil.getInput('Too many arguments. Please enter a commit message:');
      }
    
      CommandUtil.runShell(`git add -A && git commit -m "${message}" && git push`);
    }
}



// async function deleteTag(args) {
//   let tag = args[0];

//   if (args.length <= 0)
//     tag = await getInput('Please enter a tag to delete:')
//   else if (args.length > 1)
//     message = await getInput('Too many arguments. Please enter a tag to delete:')

//   runCommand(`git tag -d ${tag} && git push --delete origin ${tag}`)
// }


// async function init() {
//   let name = await getInput('Enter a repo name:');
//   let token = await getPersonalAccessToken();
//   let description = await getInput('Enter a description:');
//   let repoIsPublic = await getConfirmation('Should the repo be public?');
//   let response = await axios.post(`https://api.github.com/user/repos?access_token=${token}`, {
//     "name": `${name}`,
//     "description": `${description}`,
//     "private": !repoIsPublic,
//     validateStatus: function (status) {
//       return status >= 200 && status < 300;
//     },
//   }).catch(error => {
//     console.log('Error: Couldn\'t create repo.')
//     let token = getConfig('github_personal_access_token')
//     if (token == '')
//       console.log('You need to establish a GitHub Personal Access Token with the \'wgit settoken\' command.')
//     process.exit();
//   });

//   let url = response.data.ssh_url
//   runCommand(`git clone ${url}`)
// }

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
//     await runCommand(`git clone ${url}`)
//   } else {
//     Console.log('Couldn\'t find any repos')
//     process.exit();
//   }
// }

// async function searchRepos(secondaryArgs) {
//   if (secondaryArgs.length <= 0) {
//     console.log('Search queries may include qualifiers. Examples:')
//     console.log('user:anthony-autrey org:centurylink language:javascript is:public stars:>=100')
//     let input = await getInput('Enter a search query:')
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
//     await runCommand(`git clone ${selectedRepoInfo.url}`)
//   } else if (selectedAction == 'Delete') {
//     let typedConfirmation = await getInput(`To confirm deletion, type the full name of the repo: (${selectedRepoInfo.name}) THIS CANNOT BE UNDONE!`);
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
//   let token = await getInput('Enter your Personal Access Token:')
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
//       let username = await getInput('Enter your GitHub username:')
//       await writeConfigFile('github_username', username).catch(error => console.log(error));
//       return Promise.resolve(username);
//     } else
//       return Promise.resolve(undefined);
//   }
// }



