import {App} from 'sst/constructs'
import {accountStacks} from './account-stacks'
import {appStacks} from './app-stacks'
import {cdnStacks} from './cdn-stacks'
import {InfraConfig} from './config'
import {organizationStacks} from './organization-stacks'
import {regionStacks} from './region-stacks'

export default function (app: App) {
  const {bootstrap} = InfraConfig.stages
  switch (app.stage) {
    case bootstrap.organization:
      return organizationStacks(app)
    case bootstrap.account:
      return accountStacks(app)
    case bootstrap.region:
      return regionStacks(app)
    case bootstrap.cdn:
      return cdnStacks(app)
    default:
      return appStacks(app)
  }
}
