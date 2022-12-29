import {App} from 'sst/constructs'
import {AwsConfig} from '../config'
import {Budget} from '../shared-stacks/budget-stack'
import {AwsUtils} from '../utils'
import {GithubOidc} from './github-oidc-stack'
import {Subdomain} from './subdomain-stack'

/**
 * Stacks to be deployed per member account
 */
export function accountStacks(app: App) {
  if (AwsUtils.isRootAccount(app.account)) {
    throw new Error(`This infra should not be deployed into Root Account`)
  }
  if (app.region !== AwsConfig.regions.main) {
    throw new Error(
      `This infra should be deployed in ${AwsConfig.regions.main} region`
    )
  }

  app.stack(Budget).stack(Subdomain).stack(GithubOidc)
}
