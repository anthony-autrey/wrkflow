import * as fs from 'fs';

export interface Config {
    wgit: {
        githubPersonalAccessToken: string;
        username: string;
        password: string;
    };
}

export class ConfigUtil {
    private readonly filepath = `${process.env.HOME}/.wrkflow/wrkflow.config`;
    private readonly directorypath = `${process.env.HOME}/.wrkflow/`;
    private config: Config;

    public set = {
        wgit: {
            githubPersonalAccessToken: (value: string) => this.setGithubPersonalAccessToken(value)
        }
    };

    public get = {
        wgit: {
            githubPersonalAccessToken: () => this.getGithubPersonalAccessToken()
        }
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
        fs.mkdirSync(this.directorypath, { recursive: true });
        fs.writeFileSync(this.filepath, JSON.stringify(this.config));
    }

    private writeEmptyConfigFile() {
        const config: Config = {
            wgit: {
                githubPersonalAccessToken: null,
                username: null,
                password: null
            }
        };

        fs.mkdirSync(this.directorypath, { recursive: true });
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

    // Getters

    private getGithubPersonalAccessToken = (): string =>  {
        this.readConfigFile();
        return this.config.wgit.githubPersonalAccessToken;
    }
}