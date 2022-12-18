#!/usr/bin/env node
import {execa} from 'execa'
import yargs from 'yargs'
import {AwsConfig} from '../../../aws.config'

/** Command Options */
const argv = yargs(process.argv)
  .option('stage', {
    type: 'string',
    describe: 'Stage of boostrap to perform',
  })
  .help()
  .parseSync()

async function boostrap({stage}: typeof argv) {
  if (!stage) {
    throw new Error(`Argument '--stage' is required`)
  }

  if (stage === AwsConfig.stages.bootstrap.organization) {
    await execa('pnpm', ['run', 'org-formation:update'], {stdio: 'inherit'})
    await execa('pnpm', ['run', 'sync-sso-directory'], {stdio: 'inherit'})
  }

  await execa('pnpx', ['sst', 'deploy', '--stage', stage], {stdio: 'inherit'})
}

boostrap(argv).catch((error) => {
  throw error
})
