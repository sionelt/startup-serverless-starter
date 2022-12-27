import yargs from 'yargs'
import {AwsConfig} from './infra/config'

const {argv} = yargs(process.argv.slice(2))

export default async function () {
  return {
    name: 'to',
    /**
     * Bootstrap account infra in us-east-1 for regional infra that
     * requires it e.g. WAF, Certificate for Cloudfront
     */
    region:
      argv.stage === AwsConfig.stages.bootstrap.account
        ? AwsConfig.regions.usEast1
        : AwsConfig.regions.main,
    main: 'stacks/index.ts',
  }
}
