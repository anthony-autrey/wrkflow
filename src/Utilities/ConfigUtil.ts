import * as fs from 'fs';

export interface Config {
    wgit: {
        githubPersonalAccessToken: string;
        username: string;
        password: string;
    };
    customCommands: CustomCommand[];
}

interface CustomCommand {
    input: string;
    command: string;
}

export class ConfigUtil {
    private readonly filepath = `${process.env.HOME}/.wrkflow/wrkflow.config`;
    private readonly directorypath = `${process.env.HOME}/.wrkflow/`;
    private config: Config;

    public set = {
        wgit: {
            githubPersonalAccessToken: (value: string) => this.setGithubPersonalAccessToken(value)
        },
        customCommand: (input: string, command: string) => this.setCustomCommand(input, command)
    };

    public get = {
        wgit: {
            githubPersonalAccessToken: () => this.getGithubPersonalAccessToken()
        },
        customCommands: () => this.getCustomCommands()
    };

    public constructor() {
        if (!this.configExists()) {
            this.writeEmptyConfigFile();
        }
        
        this.readConfigFile();
    }

    private readConfigFile(): void {
        const configString = fs.readFileSync(this.filepath, {encoding: 'ascii'});
        const json = JSON.parse(configString);
        this.config = json;
    }

    private writeConfigFile() {
        if (!fs.existsSync(this.directorypath)) {
            fs.mkdirSync(this.directorypath, { recursive: true });
        }
        fs.writeFileSync(this.filepath, JSON.stringify(this.config));
    }

    private writeEmptyConfigFile() {
        const config: Config = {
            wgit: {
                githubPersonalAccessToken: null,
                username: null,
                password: null
            },
            customCommands: []
        };

        if (!fs.existsSync(this.directorypath)) {
            fs.mkdirSync(this.directorypath, { recursive: true });
        }
        fs.writeFileSync(this.filepath, JSON.stringify(config));
    }

    private configExists(): boolean {
         return fs.existsSync(this.filepath);
    }

    // Setters

    private setGithubPersonalAccessToken = (value: string) => {
        this.config.wgit.githubPersonalAccessToken = value;
        this.writeConfigFile();
    }

    private setCustomCommand = (input: string, command: string) => {
        this.config.customCommands = this.config.customCommands.filter(customCommand => {
            return customCommand.input !== input;
        });

        const newCommand: CustomCommand = { input, command};
        this.config.customCommands.push(newCommand);
        this.writeConfigFile();
    }

    // Getters

    private getGithubPersonalAccessToken = (): string =>  {
        this.readConfigFile();
        return this.config.wgit.githubPersonalAccessToken;
    }

    private getCustomCommands = (): CustomCommand[] => {
        this.readConfigFile();
        return this.config.customCommands;
    }

    // Deletors

    public unsetCommand(input: string) {
        this.config.customCommands = this.config.customCommands.filter(customCommand => {
            return customCommand.input !== input;
        });

        this.writeConfigFile();
    }
}