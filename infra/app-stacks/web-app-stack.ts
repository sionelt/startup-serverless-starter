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
  const customDomain = dns.joinCustomDomain('app')

  /**
   * Import WAF Web ACL's ARN created in waf-stack in us-east-1
   */
  const webAclArn = aws_ssm.StringParameter.valueFromLookup(
    stack,
    AwsConfig.cdn.wafWebAclArnName
  )

  const site = new StaticSite(stack, 'WebApp', {
    customDomain,
    path: 'apps/web',
    buildCommand: 'npm run build',
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
    SITE_URL: site.url,
  })

  return {
    site,
  }
}
