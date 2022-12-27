import {App} from 'sst/constructs'
import {AwsUtils} from '../utils'
import {Ses} from './ses-stack'

/**
 * Infra stacks to be deployed per supporting region in each of the member account
 */
export function regionStacks(app: App) {
  if (AwsUtils.isRootAccount(app.account)) {
    throw new Error(`This infra should not be deployed into Root Account`)
  }
  app.stack(Ses)
}
