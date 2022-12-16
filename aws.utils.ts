import {aws_logs} from 'aws-cdk-lib'
import {AwsConfig, MainStage, SubDomain} from './aws.config'

/**
 * Join Route53 Hosted Zone name
 * @param accountId aws account id
 * @param sub subdomain
 */
export const joinHostedZone = (accountId: string, sub: SubDomain) => {
  const domain = `${sub}.${AwsConfig.dns.apex}`

  switch (accountId) {
    case AwsConfig.accounts.production:
      return domain
    case AwsConfig.accounts.development:
      return `dev-${domain}`
    default:
      throw new Error(`Unrecognized aws account: ${accountId}`)
  }
}

/**
 * Join custom domain name
 * @param accountId aws account id
 * @param stage deployed stage name
 * @param sub subdomain
 */
export const joinDomainName = (
  accountId: string,
  stage: unknown,
  sub: Exclude<SubDomain, 'cdn'>
) => {
  const hostedZoneAsDomainName = joinHostedZone(accountId, sub)

  switch (stage as MainStage) {
    case 'prod':
    case 'dev':
      return hostedZoneAsDomainName
    // Ephemeral stages e.g. PR stages
    default:
      return `${stage}.${hostedZoneAsDomainName}`
  }
}

/**
 * Get CDK's log group retention by stage name
 * @param stage deployed stage name
 */
export const getCdkLogRetention = (stage: unknown): aws_logs.RetentionDays => {
  switch (stage as MainStage) {
    case 'prod':
      return aws_logs.RetentionDays.ONE_MONTH
    case 'dev':
      return aws_logs.RetentionDays.TWO_WEEKS
    default:
      return aws_logs.RetentionDays.ONE_WEEK
  }
}
