import {aws_iam, aws_route53} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {AwsConfig} from '../../../aws.config'

export function DnsAccount({stack}: StackContext) {
  const apexZone = new aws_route53.PublicHostedZone(stack, 'HostedZone', {
    zoneName: AwsConfig.dns.apex,
    crossAccountZoneDelegationRoleName:
      AwsConfig.dns.crossAccountDelegationRole,
    crossAccountZoneDelegationPrincipal: new aws_iam.AccountPrincipal(
      AwsConfig.accounts.root.id
    ),
  })

  /**
   * Add records for SES Domain Identity & MAIL FROM verfications
   * @file /apps/aws-region-infra/stacks/ses-stack.ts
   */

  /**
   * TODO: Add tokens from aws-region-infra's Ses stack's CNAME outputs,
   * once its bootstrap in each supported region.
   */
  const dkimTokensByRegion = {
    [AwsConfig.regions.support.usWest2]: [],
    [AwsConfig.regions.support.usEast2]: [],
  }

  for (const region of Object.values(AwsConfig.regions.support)) {
    dkimTokensByRegion[region].forEach((token, i) => {
      new aws_route53.CnameRecord(stack, `DkimCnameRecord${region}${i}`, {
        zone: apexZone,
        recordName: `${token}._domainkey.${AwsConfig.dns.apex}`,
        domainName: `${token}.dkim.amazonses.com`,
        comment: `SES DKIM Verification for ${region}`,
      })
    })

    new aws_route53.MxRecord(stack, 'MailFromMxRecord', {
      zone: apexZone,
      recordName: AwsConfig.dns.apex,
      comment: `SES MAIL FROM Verfication for ${region}`,
      values: [
        {
          priority: 10,
          hostName: `feedback-smtp.${region}.amazonses.com`,
        },
      ],
    })
  }

  new aws_route53.TxtRecord(stack, 'MailFromTxtRecord', {
    zone: apexZone,
    recordName: AwsConfig.dns.apex,
    comment: 'SES MAIL FROM Verfication',
    values: [`"v=spf1 include:amazonses.com ~all"`],
  })
}
