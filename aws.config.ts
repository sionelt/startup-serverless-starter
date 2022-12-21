const Regions = {
  usWest2: 'us-west-2',
  usEast2: 'us-east-2',
  usEast1: 'us-east-1',
} as const

const Groups = {admin: 'admin', developer: 'developer'} as const

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
      email: 'f3i5y0h1s4q9e9l1@theoffice.slack.com',
      budget: 10,
    },
    production: {
      id: '314140113027',
      name: 'The Office Production',
      email: 't9r9n7l1k5i9h4f5@theoffice.slack.com',
      budget: 50,
    },
    development: {
      id: '098903104447',
      name: 'The Office Development',
      email: 'f2s8i2d0z8n6j5n2@theoffice.slack.com',
      budget: 20,
    },
  },
  /** AWS regions chosen to support & deploy in */
  regions: {
    main: Regions.usWest2,
    usEast1: Regions.usEast1,
    support: {usWest2: Regions.usWest2, usEast2: Regions.usEast2},
  },
  /** Deployed stages */
  stages: {
    main: {prod: 'prod', dev: 'dev'},
    bootstrap: {
      organization: 'organization',
      account: 'account',
      region: 'region',
    },
  },
  /** SSO/Identity Store config */
  sso: {
    instanceArn: '',
    groups: Groups,
    // TODO: Add group ids once groups are created with `sync-sso-directroy` cmd
    groupIds: {
      [Groups.admin]: '',
      [Groups.developer]: '',
    },
    users: {
      all: Object.values(Users),
      [Groups.admin]: [Users.michael],
      [Groups.developer]: [Users.sadiq, Users.dwight],
    },
  },
  /** DNS config */
  dns: {
    apex: 'theoffice.io',
    mailFrom: 'mail.theoffice.io',
    subdomains: ['app', 'api', 'auth', 'cdn'],
    // IAM role to authorize delegating subdomains across accounts from root account.
    crossAccountDelegationRole: 'DomainCrossAccountDelegationRole',
    // TODO: Add tokens from Ses stack's CNAME outputs, once its bootstrap in each supported region.*/
    dkimTokensByRegion: {
      [Regions.usWest2]: [],
      [Regions.usEast2]: [],
    },
  },
  /** CDN config */
  cdn: {
    publicDir: 'public',
    // TODO: Generate pub & private keys for CDN
    publicKey: '',
  },
} as const

export type MainStage = keyof typeof AwsConfig['stages']['main']
export type SubDomain = typeof AwsConfig['dns']['subdomains'][number]
export type SsoGroup = keyof typeof AwsConfig['sso']['groups']
export type SsoUser = {
  username: string
  email: string
  givenName: string
  familyName: string
}
export type SsoUsers = Readonly<Record<'michael' | 'dwight' | 'sadiq', SsoUser>>
