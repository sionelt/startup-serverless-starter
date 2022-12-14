import {aws_certificatemanager, aws_route53, aws_ssm} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {InfraConfig} from '../config'
import {InfraUtils} from '../utils'

/**
 * Certificate required for Cloudfront HTTPS & custom domains.
 * Includes wildcard for subdomains so we only need a single certificate per account.
 *
 * #### Monthly Cost
 * * Free
 */
export function CdnCertificate({stack}: StackContext) {
  const zoneName = InfraUtils.joinHostedZone(stack.account, 'app')
  const zone = aws_route53.HostedZone.fromLookup(stack, `HostedZone`, {
    domainName: zoneName,
  })

  const certificate = new aws_certificatemanager.DnsValidatedCertificate(
    stack,
    'Certificate',
    {
      hostedZone: zone,
      domainName: zoneName,
      subjectAlternativeNames: [`*.${zoneName}`],
    }
  )

  /**
   * Save ARN as parameter so we can retrieve it other regions where
   * the Cloudfront distribution is created.
   */
  new aws_ssm.StringParameter(stack, 'CdnCertificateArn', {
    parameterName: InfraConfig.cdn.certificateArnSsmParameterName,
    stringValue: certificate.certificateArn,
  })
}
