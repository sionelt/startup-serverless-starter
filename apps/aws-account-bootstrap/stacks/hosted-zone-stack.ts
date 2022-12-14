import {aws_iam, aws_route53} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {
  AccountIds,
  ApexDomain,
  SubDomains,
  joinHostedZone,
} from '../../../aws.config'

/**
 * Delegate subdomains cross account from the root account by creating NS record
 * pointing to each subdomain's Hosted Zone in each account.
 * @link https://theburningmonk.com/2021/05/how-to-manage-route53-hosted-zones-in-a-multi-account-environment/
 */
export function HostedZone({stack, app}: StackContext) {
  const delegationRoleArn = stack.formatArn({
    region: '', // IAM is global
    service: 'iam',
    account: AccountIds.root,
    resource: 'role',
    resourceName: 'MyDelegationRole',
  })
  const delegationRole = aws_iam.Role.fromRoleArn(
    stack,
    'DelegationRole',
    delegationRoleArn
  )

  for (const subDomain of SubDomains) {
    const subZoneName = joinHostedZone(app.account, subDomain)
    const delegatedZone = new aws_route53.PublicHostedZone(
      stack,
      `${subDomain}DomainZone`,
      {zoneName: subZoneName}
    )

    new aws_route53.CrossAccountZoneDelegationRecord(
      stack,
      `${subDomain}DelegateRecord`,
      {
        delegationRole,
        delegatedZone,
        parentHostedZoneName: ApexDomain,
      }
    )
  }
}
