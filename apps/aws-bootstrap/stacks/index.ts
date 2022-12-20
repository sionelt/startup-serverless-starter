import {App} from 'sst/constructs'
import {AwsConfig} from '../../../aws.config'
import {AwsUtils} from '../../../aws.utils'
import {Cdn} from './cdn-stack'
import {Cloudtrail} from './cloudtrail-stack'
import {DnsAccount} from './dns-account-stack'
import {DnsRoot} from './dns-root-stack'
import {GithubOidc} from './github-oidc-stack'
import {Guardduty} from './guardduty-stack'
import {Ses} from './ses-stack'
import {Sso} from './sso-stack'

export default function (app: App) {
  switch (app.stage) {
    case AwsConfig.stages.bootstrap.organization:
      return organizationStacks(app)
    case AwsConfig.stages.bootstrap.account:
      return accountStacks(app)
    case AwsConfig.stages.bootstrap.region:
      return regionStacks(app)
    default:
      throw new Error(`Unrecognized stage ${app.stage}`)
  }
}

function organizationStacks(app: App) {
  if (!AwsUtils.isRootAccount(app.account)) {
    throw new Error(
      `This infra can only be deployed into Root Account, not ${app.account}`
    )
  }
  app.stack(Sso).stack(Cloudtrail).stack(DnsRoot)
}

function accountStacks(app: App) {
  if (AwsUtils.isRootAccount(app.account)) {
    throw new Error(`This infra should not be deployed into Root Account`)
  }
  app.stack(DnsAccount).stack(GithubOidc).stack(Cdn)
}

function regionStacks(app: App) {
  if (AwsUtils.isRootAccount(app.account)) {
    throw new Error(`This infra should not be deployed into Root Account`)
  }
  app.stack(Ses).stack(Guardduty)
}
