import {AwsConfig} from '../../aws.config'

/**
 * Must be deployed in us-east-1:
 * - Only supported region for Cloudfront Certificate
 * - Create CDN S3 bucket close to Cloudfront
 */
export default async function () {
  return {
    name: 'infra',
    region: AwsConfig.regions.usEast1,
    main: 'stacks/index.ts',
  }
}
