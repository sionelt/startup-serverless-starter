import {Fn, aws_cloudfront, aws_cloudfront_origins} from 'aws-cdk-lib'
import {Api as ApiGateway, Config, StackContext, use} from 'sst/constructs'
import {Dns} from './dns-stack'

export function AppApi({stack, app}: StackContext) {
  const dns = use(Dns)
  const prefixPath = 'api'
  const webAppUrl = `https://${dns.domainName('app')}`

  const api = new ApiGateway(stack, 'AppApi', {
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
      'GET /api/{proxy+}': 'server.main',
      'POST /api/{proxy+}': 'server.main',
    },
  })

  /**
   * Reverse proxy api from web app origin
   */

  const urlWithoutProtocol = Fn.select(2, Fn.split('/', api.url))
  const reverseProxyOrigin = `${urlWithoutProtocol}/${prefixPath}`
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
