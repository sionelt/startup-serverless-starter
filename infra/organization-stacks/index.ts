import {App} from 'sst/constructs'
import {AwsConfig} from '../config'
import {Budget} from '../shared-stacks/budget-stack'
import {AwsUtils} from '../utils'
import {ApexDomain} from './apex-domain-stack'
import {Cloudtrail} from './cloudtrail-stack'
import {Sso} from './sso-stack'

/**
 * Stacks to be deployed only to the root account for the organization
 */
export function organizationStacks(app: App) {
  if (!AwsUtils.isRootAccount(app.account)) {
    throw new Error(
      `This infra can only be deployed into Root Account, not ${app.account}`
    )
  }
  if (app.region !== AwsConfig.regions.main) {
    throw new Error(
      `This infra should be deployed in ${AwsConfig.regions.main} region`
    )
  }

  app.stack(Sso).stack(Cloudtrail).stack(ApexDomain).stack(Budget)
}
