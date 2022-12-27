import {aws_cloudtrail} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {getCdkLogRetention} from '../utils'

/**
 * Create Cloudtrail for all accounts in the organization.
 * @link https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html
 */
export function Cloudtrail({stack}: StackContext) {
  const cloudtrail = new aws_cloudtrail.Trail(stack, 'Cloudtrail', {
    isOrganizationTrail: true,
    isMultiRegionTrail: true,
    enableFileValidation: true,
    includeGlobalServiceEvents: true,
    sendToCloudWatchLogs: true,
    s3KeyPrefix: 'audit-trail',
    cloudWatchLogsRetention: getCdkLogRetention(stack.stage),
  })

  stack.addOutputs({
    CloudtrailLogGroupName: cloudtrail.logGroup?.logGroupName ?? '',
  })
}
