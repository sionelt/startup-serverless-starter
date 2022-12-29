import {
  Fn,
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_route53,
} from 'aws-cdk-lib'
import {Api as ApiGateway, Config, StackContext, use} from 'sst/constructs'
import {Dns} from './dns-stack'

export function AppApi({stack, app}: StackContext) {
  const dns = use(Dns)
  const prefixPath = 'api'
  const hostedZone = dns.hostedZone('proxy')
  const domainName = dns.domainName('proxy')
  const webAppUrl = `https://${dns.domainName('app')}`

  const api = new ApiGateway(stack, 'AppApi', {
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
    // Allow only for SST console in local dev else app uses reverse proxy
    cors: app.local
      ? {
          allowCredentials: true,
          allowHeaders: ['*'],
          allowMethods: ['ANY'],
          allowOrigins: ['https://console.sst.dev'],
        }
      : false,
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
   * Api Gateway in each supporting regions routed to same domain based on
   * least latency to users and heath checks endpoints.
   */

  const healthCheck = new aws_route53.CfnHealthCheck(stack, 'HealthCheck', {
    healthCheckConfig: {
      type: 'HTTPS',
      port: 443,
      requestInterval: 30, // seconds
      resourcePath: '/health',
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
    ApiUrl: `${webAppUrl}/${prefixPath}`,
  })

  return {
    api,
    reverseProxyBehaviors,
    reverseProxyPath: prefixPath,
  }
}
