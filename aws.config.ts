import {aws_logs} from 'aws-cdk-lib'

/**
 * AWS organization's account ids
 */
export const Accounts = {
  root: '917902212075',
  production: '314140113027',
  development: '098903104447',
} as const

/**
 * AWS regions chosen to support & deploy in
 */
export const SupportedRegions = {
  usWest2: 'us-west-2',
  usEast2: 'us-east-2',
}

/**
 * Main deployed stages
 */
export const MainStages = {
  prod: 'prod',
  dev: 'dev',
} as const
export type MainStage = keyof typeof MainStages

/**
 * DNS config
 */
export const Dns = {
  apex: 'acme.io',
  mailFrom: 'mail.acme.com',
  subdomains: ['app', 'api', 'auth', 'cdn'],
  /**
   * IAM role name to authorize delegating subdomains across accounts from root account.
   */
  crossAccountDelegationRole: 'DomainCrossAccountDelegationRole',
} as const
type SubDomain = typeof Dns['subdomains'][number]

/**
 * Join Route53 Hosted Zone name
 * @param accountId aws account id
 * @param sub subdomain
 */
export const joinHostedZone = (accountId: string, sub: SubDomain) => {
  const domain = `${sub}.${Dns.apex}`

  switch (accountId) {
    case Accounts.production:
      return domain
    case Accounts.development:
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
  sub: SubDomain
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
