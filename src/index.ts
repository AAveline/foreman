import { cd, exec } from 'shelljs';
import { program } from 'commander';
import * as fs from 'fs';

import { Project } from './types';

const chalk = require('chalk');
const ProgressBar = require('progress');
const { log } = console;

program.version('1.0.0');

program
  .option('-f, --file <path>', 'dependencies.json path');

program.parse(process.argv);

if (!program.file) process.exit(1);

const projects = JSON.parse(fs.readFileSync(program.file).toString()) as Project;
const bar = new ProgressBar('parsing dependencies [:bar] :percent', { total: Object.keys(projects).length, width: 100 });
let allDependencies: { [key: string]: string[][] } = {};

for (const [project, path] of Object.entries(projects)) {
  cd(path);
  const { dependencies } = JSON.parse(exec('npm list --json', { silent: true }) as any);

  for (const [key, val] of Object.entries(dependencies)) {
    const { version, required } = val as any;
    let finalVersion = 0;
    const computedVersion = version || required?.version;

    if (computedVersion) {
      const [major, minor, patch] = computedVersion.replace(/^(\^)?(>=)?(\*)?/, '').split('.');
      finalVersion = Number(`${major}${('000' + minor).slice(-4)}.${patch}`);
    }

    allDependencies[key] = allDependencies[key] ? [
      ...allDependencies[key],
      [project, finalVersion, computedVersion],
    ] : [[project, finalVersion, computedVersion]];
  }
  bar.tick();
}

const diff = {} as { [key: string]: string[][] };

for (const [dependency, values] of Object.entries(allDependencies)) {
  const [, firstVersion] = values[0];
  const isSame = values.every(([, version]) => firstVersion === version);

  if (!isSame) {
    diff[dependency] = allDependencies[dependency];
  }
}

log(chalk.blue('----------------------'))
log(chalk.blue('Dependencies with diff'))
log(chalk.blue('----------------------'))

const mapMessage = (entity: string[], index: number, topOfMind: string[]) => {
  const [project, , version] = entity;
  const [, , firstVersion] = topOfMind;

  if (index === 0) {
    log(chalk.green(`[LATEST] => [${project}] ${version}`))
  } else if (version !== firstVersion) {
    log(chalk.red(`[OUTDATED] => [${project}] ${version}`))
  } else {
    log(chalk.blue(`[UP-TO-DATE] => [${project}] ${version}`))
  }
};

Object.entries(diff).forEach(([dependency, values]) => {
  log(chalk.bold(chalk.blue(``)))
  log(chalk.bold(chalk.blue(`${dependency}: `)))

  const sorted = Object.entries(values).sort(([, [, versionA]], [, [, versionB]]) => Number(versionB) - Number(versionA));
  const [, topOfMind] = sorted[0];

  sorted.forEach(([, entity], index) => mapMessage(entity, index, topOfMind));
});
