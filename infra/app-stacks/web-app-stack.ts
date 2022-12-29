import {aws_ssm} from 'aws-cdk-lib'
import {AwsUtils} from 'infra/utils'
import {StackContext, StaticSite, use} from 'sst/constructs'
import {AwsConfig} from '../config'
import {AppApi} from './app-api-stack'
import {Cdn} from './cdn-stack'
import {Dns} from './dns-stack'

export function WebApp({stack}: StackContext) {
  const cdn = use(Cdn)
  const dns = use(Dns)
  const api = use(AppApi)
  const hostedZone = dns.hostedZone('app')
  const domainName = dns.domainName('app')
  const isProd = AwsUtils.isProdAccount(stack.account)

  /**
   * Import WAF Web ACL created in cdk-stacks/waf-stack.ts
   */
  const webAclArn = isProd
    ? aws_ssm.StringParameter.valueFromLookup(
        stack,
        AwsConfig.cdn.wafWebAclArnSsmParameterName
      )
    : undefined

  const app = new StaticSite(stack, 'WebApp', {
    customDomain: {
      hostedZone,
      domainName,
      domainAlias: `www.${domainName}`,
      cdk: {certificate: dns.cdnCertificate},
    },
    path: 'apps/web',
    buildCommand: 'pnpm run build',
    environment: {
      VITE_API_PATH: api.reverseProxyPath,
      VITE_CDN_SECURE_PATH: cdn.securePath,
      VITE_CDN_PUBLIC_PATH: cdn.publicPath,
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
