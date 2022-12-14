import {aws_iam, aws_route53} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {AccountIds, ApexDomain} from '../../../aws.config'

export function HostedZone({stack}: StackContext) {
  new aws_route53.PublicHostedZone(stack, 'HostedZone', {
    zoneName: ApexDomain,
    crossAccountZoneDelegationPrincipal: new aws_iam.AccountPrincipal(
      AccountIds.root
    ),
    crossAccountZoneDelegationRoleName: 'MyDelegationRole',
  })
}
