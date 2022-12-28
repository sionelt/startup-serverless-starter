import yargs from 'yargs'
import {AwsConfig} from './infra/config'

const {argv} = yargs(process.argv.slice(2))

export default async function () {
  return {
    name: 'to',
    main: 'infra/index.ts',
    region: argv.region ?? AwsConfig.regions.main,
  }
}
