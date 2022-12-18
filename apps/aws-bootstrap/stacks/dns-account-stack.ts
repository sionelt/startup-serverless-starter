import {aws_iam, aws_route53} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {AwsConfig} from '../../../aws.config'
import {joinHostedZone} from '../../../aws.utils'

/**
 * Delegate subdomains cross account from the root account by creating NS record
 * pointing to each subdomain's Hosted Zone in each account.
 * @link https://theburningmonk.com/2021/05/how-to-manage-route53-hosted-zones-in-a-multi-account-environment/
 */
export function DnsAccount({stack}: StackContext) {
  const delegationRoleArn = stack.formatArn({
    region: '', // IAM is global
    service: 'iam',
    resource: 'role',
    account: AwsConfig.accounts.root.id,
    resourceName: AwsConfig.dns.crossAccountDelegationRole,
  })
  const delegationRole = aws_iam.Role.fromRoleArn(
    stack,
    'DelegationRole',
    delegationRoleArn
  )

  for (const subdomain of AwsConfig.dns.subdomains) {
    const delegatedZone = new aws_route53.PublicHostedZone(
      stack,
      `${subdomain}HostedZone`,
      {zoneName: joinHostedZone(stack.account, subdomain)}
    )

    new aws_route53.CrossAccountZoneDelegationRecord(
      stack,
      `${subdomain}DelegateRecord`,
      {
        delegationRole,
        delegatedZone,
        parentHostedZoneName: AwsConfig.dns.apex,
      }
    )
  }
}
