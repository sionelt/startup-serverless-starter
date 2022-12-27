import {App} from 'sst/constructs'
import {accountStacks} from './account-stacks'
import {appStacks} from './app-stacks'
import {AwsConfig} from './config'
import {organizationStacks} from './organization-stacks'
import {regionStacks} from './region-stacks'

export default function (app: App) {
  switch (app.stage) {
    case AwsConfig.stages.bootstrap.organization:
      return organizationStacks(app)
    case AwsConfig.stages.bootstrap.account:
      return accountStacks(app)
    case AwsConfig.stages.bootstrap.region:
      return regionStacks(app)
    default:
      return appStacks(app)
  }
}
