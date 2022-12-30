import {aws_certificatemanager} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {AwsConfig, Subdomain} from '../config'
import {AwsUtils} from '../utils'

export function Dns({stack}: StackContext) {
  /**
   * Import CDN Certificate created in cdn-stacks/cdn-certificate-stack.ts
   */
  const cdnCertificate = aws_certificatemanager.Certificate.fromCertificateArn(
    stack,
    'ImportedCdnCertificate',
    AwsConfig.cdn.certificateArnSsmParameterName
  )

  return {
    cdnCertificate,
    hostedZone: <S extends Subdomain>(sub: S) =>
      AwsUtils.joinHostedZone(stack.account, sub),
    domainName: <S extends Subdomain>(sub: S) =>
      AwsUtils.joinDomainName(stack.account, stack.stage, sub),
  }
}
