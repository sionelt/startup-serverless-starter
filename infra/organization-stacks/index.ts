import {App} from 'sst/constructs'
import {Budget} from '../shared-stacks/budget-stack'
import {AwsUtils} from '../utils'
import {ApexDns} from './apex-dns-stack'
import {Cloudtrail} from './cloudtrail-stack'
import {Sso} from './sso-stack'

/**
 * Infra stacks to be deployed only to the root account for the organization
 */
export function organizationStacks(app: App) {
  if (!AwsUtils.isRootAccount(app.account)) {
    throw new Error(
      `This infra can only be deployed into Root Account, not ${app.account}`
    )
  }
  app.stack(Sso).stack(Cloudtrail).stack(ApexDns).stack(Budget)
}
