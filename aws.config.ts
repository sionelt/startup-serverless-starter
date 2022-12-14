export const AccountIds = {
  root: '917902212075',
  production: '314140113027',
  devlopment: '098903104447',
} as const

export const SupportedRegions = {
  usWest2: 'us-west-2',
  usEast2: 'us-east-2',
}

export const MainStages = {
  prod: 'prod',
  dev: 'dev',
} as const
export type MainStage = keyof typeof MainStages

export const ApexDomain = 'acme.com'

export const SubDomains = ['app', 'api', 'auth', 'cdn'] as const
export type SubDomain = typeof SubDomains[number]

export const joinHostedZone = (
  accountId: string,
  sub: typeof SubDomains[number]
) => {
  const domain = `${sub}.${ApexDomain}`

  switch (accountId) {
    case AccountIds.production:
      return domain
    case AccountIds.devlopment:
      return `dev-${domain}`
    default:
      throw new Error(`Unrecognized aws account: ${accountId}`)
  }
}

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
    default:
      return `${stage}.${hostedZoneAsDomainName}`
  }
}
