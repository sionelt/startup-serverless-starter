import {aws_iam, aws_route53} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {Accounts, Dns} from '../../../aws.config'

export function HostedZone({stack}: StackContext) {
  new aws_route53.PublicHostedZone(stack, 'ParentHostedZone', {
    zoneName: Dns.apex,
    crossAccountZoneDelegationRoleName: Dns.crossAccountDelegationRole,
    crossAccountZoneDelegationPrincipal: new aws_iam.AccountPrincipal(
      Accounts.root
    ),
  })
}
