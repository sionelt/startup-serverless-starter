import {
  Fn,
  SecretValue,
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_route53,
} from 'aws-cdk-lib'
import {Api as ApiGateway, Config, StackContext, use} from 'sst/constructs'
import {Dns} from './dns-stack'

export function Api({stack}: StackContext) {
  const dns = use(Dns)
  const customDomain = dns.joinCustomDomain('api')
  const appCustomDomain = dns.joinCustomDomain('app')
  const webAppUrl = `https://${appCustomDomain.domainName}`

  const prefixPath = 'api'
  const api = new ApiGateway(stack, 'Api', {
    customDomain,
    defaults: {
      function: {
        timeout: '29 seconds',
        bind: [new Config.Parameter(stack, 'WEB_APP_URL', {value: webAppUrl})],
      },
    },
    cors: {
      allowCredentials: true,
      allowHeaders: ['*'],
      allowMethods: ['ANY'],
      allowOrigins: [webAppUrl, 'https://console.sst.dev'],
    },
    routes: {
      [`GET /${prefixPath}/{proxy+}`]: 'server.main',
      [`POST /${prefixPath}/{proxy+}`]: 'server.main',
    },
  })

  const healthCheck = new aws_route53.CfnHealthCheck(stack, 'health', {
    healthCheckConfig: {
      type: 'HTTPS',
      port: 443,
      requestInterval: 30, // seconds
      resourcePath: `/health`,
      fullyQualifiedDomainName: api.url,
    },
  })

  const zone = aws_route53.HostedZone.fromLookup(stack, 'ImportedZone', {
    domainName: customDomain.hostedZone,
  })
  // strip protocol https off
  const dnsName = Fn.select(1, Fn.split('https://', api.url))

  new aws_route53.CfnRecordSet(stack, `${stack.region}RecordSet`, {
    type: 'A',
    region: stack.region,
    name: customDomain.domainName,
    hostedZoneId: zone.hostedZoneId,
    setIdentifier: `${stack.region}Api`,
    healthCheckId: healthCheck.attrHealthCheckId,
    aliasTarget: {
      dnsName,
      hostedZoneId: zone.hostedZoneId,
    },
  })

  if (!api.customDomainUrl) {
    throw new Error(`Custom domain for API is required`)
  }

  /**
   * Reverse proxy api from web app origin
   */

  const reverseProxyUrl = `${webAppUrl}/${prefixPath}`
  const reverseProxyOrigin = `${api.customDomainUrl}/${prefixPath}`
    .split('https://')
    .pop() as string

  const reverseProxyBehaviors: aws_cloudfront.DistributionProps['additionalBehaviors'] =
    {
      [`${prefixPath}/*`]: {
        origin: new aws_cloudfront_origins.HttpOrigin(reverseProxyOrigin, {
          customHeaders: {
            'x-origin-verify': SecretValue.ssmSecure('').unsafeUnwrap(),
          },
        }),
        allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: aws_cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: aws_cloudfront.OriginRequestPolicy.ALL_VIEWER,
        viewerProtocolPolicy: aws_cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        responseHeadersPolicy:
          aws_cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
      },
    }

  stack.addOutputs({
    ApiUrl: reverseProxyUrl,
  })

  return {
    api,
    reverseProxyUrl,
    reverseProxyBehaviors,
  }
}
