#!/usr/bin/env node
import {execa} from 'execa'
import yargs from 'yargs'
import {InfraConfig} from '../config'

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

  if (stage === InfraConfig.stages.bootstrap.organization) {
    await execa('pnpm', ['run', 'infra:org-update'], {stdio: 'inherit'})
    await execa('pnpm', ['run', 'infra:sync-sso'], {stdio: 'inherit'})
  }

  await execa('pnpm', ['run', 'deploy', '--stage', stage], {stdio: 'inherit'})
}

boostrap(argv).catch((error) => {
  throw error
})
