import {AwsConfig.regions} from '../../aws.config'

export default async function () {
  return {
    name: 'infra',
    region: AwsConfig.regions.main,
    main: 'stacks/index.ts',
  }
}
