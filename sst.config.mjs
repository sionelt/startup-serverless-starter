import {AwsConfig} from './aws.config'

export default async function () {
  return {
    name: "to",
    region: AwsConfig.regions.main,
    main: "stacks/index.ts",
  };
}
