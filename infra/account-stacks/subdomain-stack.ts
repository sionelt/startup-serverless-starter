import {aws_iam, aws_route53} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {InfraConfig} from '../config'
import {InfraUtils} from '../utils'

/**
 * Delegate subdomains cross account from the root account by creating NS record
 * pointing to each subdomain's Hosted Zone in each account.
 * @link https://theburningmonk.com/2021/05/how-to-manage-route53-hosted-zones-in-a-multi-account-environment/
 *
 * #### Monthly Cost
 * * Hosted Zone ($0.50) * 2 (1 per account) = $1
 * * Requests ($0.40/million)                = $0
 * ##### TOTAL                              >= $1
 */
export function Subdomain({stack}: StackContext) {
  const delegationRoleArn = stack.formatArn({
    region: '',
    service: 'iam',
    resource: 'role',
    account: InfraConfig.accounts.root.id,
    resourceName: InfraConfig.dns.crossAccountDelegationRole,
  })
  const delegationRole = aws_iam.Role.fromRoleArn(
    stack,
    'DelegationRole',
    delegationRoleArn
  )

  for (const subdomain of InfraConfig.dns.subdomains) {
    const zoneName = InfraUtils.joinHostedZone(stack.account, subdomain)
    const delegatedZone = new aws_route53.PublicHostedZone(
      stack,
      `${subdomain}HostedZone`,
      {zoneName}
    )

    new aws_route53.CrossAccountZoneDelegationRecord(
      stack,
      `${subdomain}DelegateRecord`,
      {
        delegationRole,
        delegatedZone,
        parentHostedZoneName: InfraConfig.dns.apex,
      }
    )
  }
}
