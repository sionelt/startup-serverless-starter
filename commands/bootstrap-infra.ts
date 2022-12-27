#!/usr/bin/env node
import {execa} from 'execa'
import yargs from 'yargs'
import {AwsConfig} from '../infra/config'

/** Command Options */
const argv = yargs(process.argv)
  .option('stage', {
    type: 'string',
    describe: 'Stage of boostrap to perform',
  })
  .help()
  .parseSync()

async function boostrapInfra({stage}: typeof argv) {
  if (!stage) {
    throw new Error(`Argument '--stage' is required`)
  }

  if (stage === AwsConfig.stages.bootstrap.organization) {
    await execa('pnpm', ['run', 'infra:org-update'], {stdio: 'inherit'})
    await execa('pnpm', ['run', 'infra:sync-sso'], {stdio: 'inherit'})
  }

  await execa('pnpm', ['run', 'deploy', '--stage', stage], {stdio: 'inherit'})
}

boostrapInfra(argv).catch((error) => {
  throw error
})
