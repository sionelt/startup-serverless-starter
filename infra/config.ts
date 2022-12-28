import {z} from 'zod'

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

const RequiredEnv = (name: string) =>
  z
    .string({
      required_error: `${name} is required`,
      invalid_type_error: `${name} is not of valid string`,
    })
    .min(0)
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    .parse(process.env[name])

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
  /** AWS regions chosen to support */
  regions: {
    main: Regions.usWest2,
    usEast1: Regions.usEast1,
    supporting: {usWest2: Regions.usWest2, usEast2: Regions.usEast2},
  },
  /** Deployed stages */
  stages: {
    main: {prod: 'prod', dev: 'dev'},
    bootstrap: {
      organization: 'organization',
      account: 'account',
      region: 'region',
      cdn: 'cdn',
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
    subdomains: ['app', 'api'],
    mailFrom: 'mail.theoffice.io',
    // IAM role to authorize delegating subdomains across accounts from root account.
    crossAccountDelegationRole: 'DomainCrossAccountDelegationRole',
    // TODO: Add tokens from ses-stack's CNAME outputs, once its bootstrap in each supported region.*/
    dkimTokensByRegion: {
      [Regions.usWest2]: [],
      [Regions.usEast2]: [],
    },
  },
  /** CDN config */
  cdn: {
    wafWebAclArnSsmParameterName: '/cdn/waf/web_acl_arn',
    certificateArnSsmParameterName: '/cdn/certificate_arn',
    // TODO: Follow guide to generate key group: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront-readme.html#keygroup--publickey-api
    publicKey: '',
  },
  /** API config */
  api: {
    certificateArnSsmParameterName: '/api/certificate_arn',
  },
  /** CI/CD config */
  cicd: {
    // GITHUB_REPOSITORY (owner/repo) already set in Github Actions envs
    githubRepository: RequiredEnv('GITHUB_REPOSITORY'),
  },
} as const

export type MainStage = keyof typeof AwsConfig['stages']['main']
export type Subdomain = typeof AwsConfig['dns']['subdomains'][number]
export type SsoGroup = keyof typeof AwsConfig['sso']['groups']
export type SsoUser = {
  username: string
  email: string
  givenName: string
  familyName: string
}
export type SsoUsers = Readonly<Record<'michael' | 'dwight' | 'sadiq', SsoUser>>
