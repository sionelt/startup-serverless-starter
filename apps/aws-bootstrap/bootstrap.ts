#!/usr/bin/env node
import {execa} from 'execa'
import yargs from 'yargs'
import {AwsConfig} from '../../aws.config'

/** Command Options */
const argv = yargs(process.argv)
  .option('stage', {
    type: 'string',
    describe: 'Stage of boostrap to perform',
  })
  .help()
  .parseSync()

async function boostrap(args: typeof argv) {
  if (!args.stage) {
    throw new Error(`Argument '--stage' is required`)
  }

  if (args.stage === AwsConfig.stages.bootstrap.organization) {
    await execa(
      'pnpx',
      [
        'org-formation',
        'init',
        'org-formation/organization.yml',
        '--region',
        AwsConfig.regions.main,
      ],
      {stdio: 'inherit'}
    )
  }

  await execa('pnpx', ['sst', 'deploy', '--stage', args.stage], {
    stdio: 'inherit',
  })
}

boostrap(argv).catch((error) => {
  throw error
})
