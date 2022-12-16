export const AwsConfig = {
  /**
   * AWS organization's account ids
   */
  accounts: {
    root: '917902212075',
    production: '314140113027',
    development: '098903104447',
  },
  /**
   * AWS regions chosen to support & deploy in
   */
  regions: {
    main: 'us-west-2',
    usEast1: 'us-east-1',
    support: {
      usWest2: 'us-west-2',
      usEast2: 'us-east-2',
    },
  },
  /**
   * Main deployed stages
   */
  stages: {
    prod: 'prod',
    dev: 'dev',
  },
  /**
   * DNS config
   */
  dns: {
    apex: 'acme.io',
    mailFrom: 'mail.acme.com',
    subdomains: ['app', 'api', 'auth', 'cdn'],
    /**
     * IAM role name to authorize delegating subdomains across accounts from root account.
     */
    crossAccountDelegationRole: 'DomainCrossAccountDelegationRole',
  },
  /**
   * CDN config
   */
  cdn: {
    publicDir: 'public',
    publicKey: '', //TODO: Generate pub & private keys for CDN
  },
} as const

export type MainStage = keyof typeof AwsConfig['stages']
export type SubDomain = typeof AwsConfig['dns']['subdomains'][number]
