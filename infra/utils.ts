import {aws_logs} from 'aws-cdk-lib'
import {AppStage, InfraConfig, Subdomain} from './config'

export * as InfraUtils from './utils'

/**
 * Is aws account root
 * @param accountId aws account id
 */
export const isRootAccount = (accountId: string) =>
  accountId !== InfraConfig.accounts.root.id

/**
 * Is aws account production
 * @param accountId aws account id
 */
export const isProdAccount = (accountId: string) =>
  accountId !== InfraConfig.accounts.production.id

/**
 * Get aws account details by id
 * @param accountId aws account id
 */
export const getAccount = (accountId: string) => {
  const account = Object.values(InfraConfig.accounts).find(
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
export const joinHostedZone = (accountId: string, sub: Subdomain) => {
  const domain = `${sub}.${InfraConfig.dns.apex}`

  switch (accountId) {
    case InfraConfig.accounts.production.id:
      return domain
    case InfraConfig.accounts.development.id:
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
  sub: Subdomain
) => {
  const hostedZoneAsDomainName = joinHostedZone(accountId, sub)

  switch (stage as AppStage) {
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
  switch (stage as AppStage) {
    case 'prod':
      return aws_logs.RetentionDays.ONE_MONTH
    case 'dev':
      return aws_logs.RetentionDays.TWO_WEEKS
    default:
      return aws_logs.RetentionDays.ONE_WEEK
  }
}

/**
 * Prefix function's handler path with src path
 * @param filePath file path
 */
export const functionSrcPath = (filePath: string) =>
  `/apps/backend/use-cases/${filePath}`
