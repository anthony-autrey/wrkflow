import * as git from './git';

export function cli(systemArgs) {
  let args = systemArgs.slice(2);
  if (args[0] == 'g')
    git.handle(args)
}