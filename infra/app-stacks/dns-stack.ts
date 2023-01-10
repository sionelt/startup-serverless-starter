import {aws_certificatemanager} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {InfraConfig, Subdomain} from '../config'
import {InfraUtils} from '../utils'

export function Dns({stack}: StackContext) {
  /**
   * Import CDN Certificate created in cdn-stacks/cdn-certificate-stack.ts
   */
  const cdnCertificate = aws_certificatemanager.Certificate.fromCertificateArn(
    stack,
    'ImportedCdnCertificate',
    InfraConfig.cdn.certificateArnSsmParameterName
  )

  return {
    cdnCertificate,
    hostedZone: <S extends Subdomain>(sub: S) =>
      InfraUtils.joinHostedZone(stack.account, sub),
    domainName: <S extends Subdomain>(sub: S) =>
      InfraUtils.joinDomainName(stack.account, stack.stage, sub),
  }
}
