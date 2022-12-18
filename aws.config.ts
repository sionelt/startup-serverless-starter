const Users: SsoUsers = {
  michael: {
    username: 'michael',
    email: 'michael@theoffice.io',
    givenName: 'Michael',
    familyName: 'Scott',
  },
  dwight: {
    username: 'dwight',
    email: 'dwight@theoffice.io',
    givenName: 'Dwight',
    familyName: 'Schrute',
  },
  sadiq: {
    username: 'sadiq',
    email: 'sadiq@theoffice.io',
    givenName: 'Sadiq',
    familyName: '',
  },
}

export const AwsConfig = {
  /** AWS organization's accounts */
  accounts: {
    root: {
      id: '917902212075',
      name: 'The Office Root',
      email: 'f3i5y0h1s4q9e9l1@acme.slack.com',
    },
    production: {
      id: '314140113027',
      name: 'The Office Production',
      email: 't9r9n7l1k5i9h4f5@acme.slack.com',
    },
    development: {
      id: '098903104447',
      name: 'The Office Development',
      email: 'f2s8i2d0z8n6j5n2@acme.slack.com',
    },
  },
  /** AWS regions chosen to support & deploy in */
  regions: {
    main: 'us-west-2',
    usEast1: 'us-east-1',
    support: {
      usWest2: 'us-west-2',
      usEast2: 'us-east-2',
    },
  },
  /** Deployed stages */
  stages: {
    main: {
      prod: 'prod',
      dev: 'dev',
    },
    bootstrap: {
      organization: 'organization',
      account: 'account',
      region: 'region',
    },
  },
  /** SSO/Identity Source config */
  sso: {
    groups: ['admin', 'developer', 'readOnly'],
    users: {
      all: Object.values(Users),
      admin: [Users.michael],
      developer: [Users.sadiq],
      readOnly: [Users.dwight],
    },
  },
  /** DNS config */
  dns: {
    apex: 'theoffice.io',
    mailFrom: 'mail.theoffice.io',
    subdomains: ['app', 'api', 'auth', 'cdn'],
    /** IAM role to authorize delegating subdomains across accounts from root account. */
    crossAccountDelegationRole: 'DomainCrossAccountDelegationRole',
  },
  /** CDN config */
  cdn: {
    publicDir: 'public',
    publicKey: '', //TODO: Generate pub & private keys for CDN
  },
} as const

export type MainStage = keyof typeof AwsConfig['stages']['main']
export type SubDomain = typeof AwsConfig['dns']['subdomains'][number]
export type SsoGroup = typeof AwsConfig['sso']['groups'][number]
export type SsoUser = {
  username: string
  email: string
  givenName: string
  familyName: string
}
export type SsoUsers = Readonly<Record<'michael' | 'dwight' | 'sadiq', SsoUser>>
