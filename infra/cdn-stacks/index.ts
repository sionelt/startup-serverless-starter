import {InfraConfig} from 'infra/config'
import {App} from 'sst/constructs'
import {InfraUtils} from '../utils'
import {CdnCertificate} from './cdn-certificate-stack'
import {Waf} from './waf-stack'

/**
 * Stacks to be deployed only in us-east-1 region in each of the member account
 */
export function cdnStacks(app: App) {
  if (InfraUtils.isRootAccount(app.account)) {
    throw new Error(`This infra should not be deployed into Root Account`)
  }
  if (app.region !== InfraConfig.regions.usEast1) {
    throw new Error(`This infra should be deployed in us-east-1 region`)
  }

  app.stack(CdnCertificate)

  // Only deploy WAF in prod, don't really need them on dev account
  if (InfraUtils.isProdAccount(app.account)) {
    app.stack(Waf)
  }
}
