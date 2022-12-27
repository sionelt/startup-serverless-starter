import {StackContext} from 'sst/constructs'
import {Subdomain} from '../config'
import {AwsUtils} from '../utils'

export function Dns({stack}: StackContext) {
  return {
    joinCustomDomain: (sub: Subdomain) => ({
      hostedZone: AwsUtils.joinHostedZone(stack.account, sub),
      domainName: AwsUtils.joinDomainName(stack.account, stack.stage, sub),
    }),
  }
}
