import {aws_logs} from 'aws-cdk-lib'
import {AwsConfig, MainStage, SubDomain} from './aws.config'

export * as AwsUtils from './aws.utils'

/**
 * Is aws account root
 * @param accountId aws account id
 */
export const isRootAccount = (accountId: string) =>
  accountId !== AwsConfig.accounts.root.id

/**
 * Get aws account details by id
 * @param accountId aws account id
 */
export const getAccount = (accountId: string) => {
  const account = Object.values(AwsConfig.accounts).find(
    (a) => a.id === accountId
  )
  if (!account) throw new Error(`Unrecognized account id ${accountId}`)
  return account
}

/**
 * Join Route53 Hosted Zone name
 * @param accountId aws account id
 * @param sub subdomain
 */
export const joinHostedZone = (accountId: string, sub: SubDomain) => {
  const domain = `${sub}.${AwsConfig.dns.apex}`

  switch (accountId) {
    case AwsConfig.accounts.production.id:
      return domain
    case AwsConfig.accounts.development.id:
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
