import * as fs from 'fs';
export class ConfigUtil {
    constructor() {
        this.filepath = `${process.env.HOME}/.wrkflow/wrkflow.config`;
        this.directorypath = `${process.env.HOME}/.wrkflow/`;
        this.set = {
            wgit: {
                githubPersonalAccessToken: (value) => this.setGithubPersonalAccessToken(value)
            }
        };
        this.get = {
            wgit: {
                githubPersonalAccessToken: () => this.getGithubPersonalAccessToken()
            }
        };
        this.setGithubPersonalAccessToken = (value) => {
            this.config.wgit.githubPersonalAccessToken = value;
            this.writeConfigFile();
        };
        this.getGithubPersonalAccessToken = () => {
            this.readConfigFile();
            return this.config.wgit.githubPersonalAccessToken;
        };
        if (!this.configExists()) {
            this.writeEmptyConfigFile();
        }
        this.readConfigFile();
    }
    readConfigFile() {
        const configString = fs.readFileSync(this.filepath, { encoding: 'ascii' });
        const json = JSON.parse(configString);
        this.config = json;
    }
    writeConfigFile() {
        fs.mkdirSync(this.directorypath, { recursive: true });
        fs.writeFileSync(this.filepath, JSON.stringify(this.config));
    }
    writeEmptyConfigFile() {
        const config = {
            wgit: {
                githubPersonalAccessToken: null,
                username: null,
                password: null
            }
        };
        fs.mkdirSync(this.directorypath, { recursive: true });
        fs.writeFileSync(this.filepath, JSON.stringify(config));
    }
    configExists() {
        return fs.existsSync(this.filepath);
    }
}
//# sourceMappingURL=ConfigUtil.js.map