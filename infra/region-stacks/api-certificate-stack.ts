import {aws_certificatemanager, aws_route53, aws_ssm} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {AwsConfig} from '../config'
import {AwsUtils} from '../utils'

/**
 * Certificate required for Api Gateway custom domains.
 * Includes wildcard for subdomains so we only need a single certificate.
 */
export function ApiCertificate({stack}: StackContext) {
  const zoneName = AwsUtils.joinHostedZone(stack.account, 'api')
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
  new aws_ssm.StringParameter(stack, 'ApiCertificateArn', {
    parameterName: AwsConfig.api.certificateArnSsmParameterName,
    stringValue: certificate.certificateArn,
  })
}
