import {aws_iam, aws_route53} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {Accounts, Dns} from '../../../aws.config'

export function HostedZone({stack}: StackContext) {
  const apexZone = new aws_route53.PublicHostedZone(stack, 'ApexHostedZone', {
    zoneName: Dns.apex,
    crossAccountZoneDelegationRoleName: Dns.crossAccountDelegationRole,
    crossAccountZoneDelegationPrincipal: new aws_iam.AccountPrincipal(
      Accounts.root
    ),
  })

  /**
   * Add records for SES Domain Identity & MAIL FROM verfications
   * @file /apps/aws-account-bootstrap/stacks/ses-stack.ts
   */

  /**
   * TODO:
   * Add 3 tokens from aws-account-bootstrap's Ses stack's CNAME outputs, once it's deployed.
   */
  const dkimTokens: string[] = []
  dkimTokens.forEach((token, i) => {
    new aws_route53.CnameRecord(stack, `DkimCnameRecord${i}`, {
      zone: apexZone,
      recordName: `${token}._domainkey.${Dns.apex}`,
      domainName: `${token}.dkim.amazonses.com`,
      comment: 'SES DKIM Verification',
    })
  })
  new aws_route53.MxRecord(stack, 'SesMailFromMxRecord', {
    zone: apexZone,
    recordName: Dns.apex,
    comment: 'SES MAIL FROM Verfication',
    values: [
      {
        priority: 10,
        hostName: `feedback-smtp.${stack.region}.amazonses.com`,
      },
    ],
  })
  new aws_route53.TxtRecord(stack, 'SesMailFromTxtRecord', {
    zone: apexZone,
    recordName: Dns.apex,
    comment: 'SES MAIL FROM Verfication',
    values: [`"v=spf1 include:amazonses.com ~all"`],
  })
}
