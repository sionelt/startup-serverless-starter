import {
  Fn,
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_route53,
} from 'aws-cdk-lib'
import {Api as ApiGateway, Config, StackContext, use} from 'sst/constructs'
import {Dns} from './dns-stack'

export function Api({stack}: StackContext) {
  const dns = use(Dns)
  const hostedZone = dns.hostedZone('api')
  const domainName = dns.domainName('api')
  const webAppUrl = `https://${dns.domainName('app')}`

  const prefixPath = 'api'
  const api = new ApiGateway(stack, 'Api', {
    customDomain: {
      hostedZone,
      domainName,
      cdk: {certificate: dns.apiCertificate},
    },
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
      'GET /health': 'health-check.main',
      [`GET /${prefixPath}/{proxy+}`]: 'server.main',
      [`POST /${prefixPath}/{proxy+}`]: 'server.main',
    },
  })

  if (!api.customDomainUrl) {
    throw new Error(`Custom domain for API is required`)
  }

  /**
   * Latency based-routing with health checks enables multi-region active-active.
   * Api Gateway in each supporting regions routed to same domain by based on
   * least latency to users and heath checks endpoints.
   */

  const healthCheck = new aws_route53.CfnHealthCheck(stack, 'Health', {
    healthCheckConfig: {
      type: 'HTTPS',
      port: 443,
      requestInterval: 30, // seconds
      resourcePath: `/health`,
      fullyQualifiedDomainName: api.url,
    },
  })

  const zone = aws_route53.HostedZone.fromLookup(stack, 'ImportedZone', {
    domainName: hostedZone,
  })
  // strip protocol https off
  const dnsName = Fn.select(1, Fn.split('https://', api.url))

  new aws_route53.CfnRecordSet(stack, `${stack.region}RecordSet`, {
    type: 'A',
    name: domainName,
    region: stack.region,
    hostedZoneId: zone.hostedZoneId,
    setIdentifier: `${stack.region}Api`,
    healthCheckId: healthCheck.attrHealthCheckId,
    aliasTarget: {
      dnsName,
      hostedZoneId: zone.hostedZoneId,
    },
  })

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
        origin: new aws_cloudfront_origins.HttpOrigin(reverseProxyOrigin),
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
