import {App} from 'sst/constructs'
import {Budget} from '../shared-stacks/budget-stack'
import {AwsUtils} from '../utils'
import {GithubOidc} from './github-oidc-stack'
import {SubdomainDns} from './subdomain-dns-stack'
import {Waf} from './waf-stack'

/**
 * Infra stacks to be deployed per member account of the organization
 */
export function accountStacks(app: App) {
  if (AwsUtils.isRootAccount(app.account)) {
    throw new Error(`This infra should not be deployed into Root Account`)
  }
  app.stack(Budget).stack(SubdomainDns).stack(GithubOidc).stack(Waf)
}
