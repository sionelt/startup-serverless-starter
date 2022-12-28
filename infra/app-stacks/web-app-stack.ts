import {aws_ssm} from 'aws-cdk-lib'
import {StackContext, StaticSite, use} from 'sst/constructs'
import {AwsConfig} from '../config'
import {Api} from './api-stack'
import {Cdn} from './cdn-stack'
import {Dns} from './dns-stack'

export function WebApp({stack}: StackContext) {
  const api = use(Api)
  const cdn = use(Cdn)
  const dns = use(Dns)

  /**
   * Import WAF Web ACL created in cdk-stacks/waf-stack.ts
   */
  const webAclArn = aws_ssm.StringParameter.valueFromLookup(
    stack,
    AwsConfig.cdn.wafWebAclArnSsmParameterName
  )

  const app = new StaticSite(stack, 'WebApp', {
    customDomain: {
      hostedZone: dns.hostedZone('app'),
      domainName: dns.domainName('app'),
      domainAlias: `www.${dns.domainName('app')}`,
      cdk: {certificate: dns.cdnCertificate},
    },
    path: 'apps/web',
    buildCommand: 'pnpm run build',
    environment: {
      VITE_API_URL: api.reverseProxyUrl,
      VITE_CDN_SECURE_URL: cdn.secureUrl,
      VITE_CDN_PUBLIC_URL: cdn.publicUrl,
    },
    cdk: {
      distribution: {
        webAclId: webAclArn,
        additionalBehaviors: {
          ...cdn.behaviors,
          ...api.reverseProxyBehaviors,
        },
      },
    },
  })

  stack.addOutputs({
    WEB_APP_URL: app.url,
  })
}
