import {aws_iam, aws_route53} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {AwsConfig} from '../config'

/**
 * Create DNS infra for apex domain in Root Account
 */
export function ApexDomain({stack}: StackContext) {
  const {accounts, dns, regions} = AwsConfig

  const zone = new aws_route53.PublicHostedZone(stack, 'HostedZone', {
    zoneName: dns.apex,
    crossAccountZoneDelegationRoleName: dns.crossAccountDelegationRole,
    crossAccountZoneDelegationPrincipal: new aws_iam.AccountPrincipal(
      accounts.root
    ),
  })

  /**
   * Add records for SES Domain Identity & MAIL FROM verfications
   * @file ./ses-stack.ts
   */

  for (const region of Object.values(regions.supporting)) {
    dns.dkimTokensByRegion[region].forEach((token, i) => {
      new aws_route53.CnameRecord(stack, `DkimCnameRecord${region}${i}`, {
        zone,
        recordName: `${token}._domainkey.${dns.apex}`,
        domainName: `${token}.dkim.amazonses.com`,
        comment: `SES DKIM Verification for ${region}`,
      })
    })

    new aws_route53.MxRecord(stack, 'MailFromMxRecord', {
      zone,
      recordName: dns.apex,
      comment: `SES MAIL FROM Verification for ${region}`,
      values: [
        {
          priority: 10,
          hostName: `feedback-smtp.${region}.amazonses.com`,
        },
      ],
    })
  }

  new aws_route53.TxtRecord(stack, 'MailFromTxtRecord', {
    zone,
    recordName: dns.apex,
    comment: 'SES MAIL FROM Verification',
    values: [`"v=spf1 include:amazonses.com ~all"`],
  })
}
