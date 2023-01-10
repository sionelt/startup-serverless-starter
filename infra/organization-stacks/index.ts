import {App} from 'sst/constructs'
import {InfraConfig} from '../config'
import {Budget} from '../shared-stacks/budget-stack'
import {InfraUtils} from '../utils'
import {ApexDomain} from './apex-domain-stack'
import {Cloudtrail} from './cloudtrail-stack'
import {Sso} from './sso-stack'

/**
 * Stacks to be deployed only to the root account for the organization
 */
export function organizationStacks(app: App) {
  if (!InfraUtils.isRootAccount(app.account)) {
    throw new Error(
      `This infra can only be deployed into Root Account, not ${app.account}`
    )
  }
  if (app.region !== InfraConfig.regions.main) {
    throw new Error(
      `This infra should be deployed in ${InfraConfig.regions.main} region`
    )
  }

  app.stack(Sso).stack(Cloudtrail).stack(ApexDomain).stack(Budget)
}
