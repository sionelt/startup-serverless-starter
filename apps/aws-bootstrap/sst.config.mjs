import {AwsConfig} from '../../aws.config'

export default async function () {
  return {
    name: 'bootstrap',
    region: AwsConfig.regions.main,
    main: 'stacks/index.ts',
  }
}
