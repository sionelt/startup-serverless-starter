import {aws_ses} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {Dns} from '../../../aws.config'

/**
 * Configure SES with verified domain & metrics
 */
export function Ses({stack}: StackContext) {
  /**
   * Create a default Configuration Set for the domain
   */
  const configurationSet = new aws_ses.ConfigurationSet(
    stack,
    'ConfigurationSet',
    {
      sendingEnabled: true,
      reputationMetrics: true,
      tlsPolicy: aws_ses.ConfigurationSetTlsPolicy.REQUIRE,
      suppressionReasons: aws_ses.SuppressionReasons.COMPLAINTS_ONLY,
    }
  )

  new aws_ses.CfnConfigurationSetEventDestination(
    stack,
    'ConfigurationSetEventDestination',
    {
      configurationSetName: configurationSet.configurationSetName,
      eventDestination: {
        enabled: true,
        name: 'Engagement',
        matchingEventTypes: [
          'reject',
          'bounce',
          'complaint',
          'send',
          'delivery',
          'open',
          'click',
          'subscription',
        ],
        cloudWatchDestination: {
          /**
           * Use MAIL FROM tag to track metrics events
           * SES auto tag email with FAIL FROM
           * @link https://aws.amazon.com/blogs/messaging-and-targeting/introducing-sending-metrics/
           */
          dimensionConfigurations: [
            {
              defaultDimensionValue: Dns.mailFrom,
              dimensionName: 'ses:from-domain',
              dimensionValueSource: 'messageTag',
            },
          ],
        },
      },
    }
  )

  /**
   * Add and verify Domain using DKIM
   * @link https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dkim.html
   */
  const identity = new aws_ses.EmailIdentity(stack, 'Identity', {
    identity: aws_ses.Identity.domain(Dns.apex),
    mailFromDomain: Dns.mailFrom,
    configurationSet,
  })

  /**
   * Output DNS records to be added manually to Apex's Hosted Zone in Root Account
   */
  identity.dkimRecords.forEach((token, i) => {
    stack.addOutputs({
      [`DkimCnameRecord${i}`]: {
        description: `DKIM CNAME Record ${i}`,
        value: `Name=${token.name} Value=${token.value}`,
      },
    })
  })
  stack.addOutputs({
    MailFromDomainMxRecord: {
      description: `MAIL FROM domain MX Record`,
      value: `Name=${Dns.apex} Value=feedback-smtp.${stack.region}.amazonses.com Priority=10`,
    },
    MailFromDomainTxtRecord: {
      description: `MAIL FROM domain TXT Record`,
      value: `Name=${Dns.apex} Value="v=spf1 include:amazonses.com ~all"`,
    },
  })
}
