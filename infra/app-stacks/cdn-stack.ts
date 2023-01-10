import {
  RemovalPolicy,
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_s3,
} from 'aws-cdk-lib'
import {Bucket, Config, StackContext, use} from 'sst/constructs'
import {InfraConfig} from '../config'
import {Dns} from './dns-stack'

export function Cdn({stack, app}: StackContext) {
  const dns = use(Dns)
  const securePath = 'secure'
  const publicPath = 'public'
  const appDomainName = dns.domainName('app')
  const secureUrl = `${appDomainName}/${securePath}`
  const publicUrl = `${appDomainName}/${publicPath}`

  /**
   * Uploads/Access to Bucket can only be done via CDN.
   */
  const bucket = new Bucket(stack, 'Bucket', {
    cdk: {
      bucket: {
        autoDeleteObjects: false,
        removalPolicy: RemovalPolicy.RETAIN,
        publicReadAccess: false,
        eventBridgeEnabled: true,
        bucketKeyEnabled: true,
        versioned: true,
        encryption: aws_s3.BucketEncryption.KMS_MANAGED,
        blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
      },
    },
  })

  /**
   * Key group to secure private assets
   */

  const publicKey = new aws_cloudfront.PublicKey(stack, 'PublicKey', {
    encodedKey: InfraConfig.cdn.publicKey,
  })
  const keyGroup = new aws_cloudfront.KeyGroup(stack, 'KeyGroup', {
    items: [publicKey],
  })

  const behaviors: aws_cloudfront.DistributionProps['additionalBehaviors'] = {
    /**
     * Behavior for private assets requires URLs to be signed with a key group.
     * Cloudfront validates the signed url against this key group on requests.
     * @link Private Content: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PrivateContent.html
     * @link Key Group generation: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront-readme.html#keygroup--publickey-api
     */
    [`${securePath}/*`]: {
      trustedKeyGroups: [keyGroup],
      origin: new aws_cloudfront_origins.S3Origin(bucket.cdk.bucket),
      allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_ALL,
      originRequestPolicy: aws_cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
      viewerProtocolPolicy: aws_cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
    },
    /**
     * Public assets don't require URLs to be signed.
     */
    [`${publicPath}/*`]: {
      origin: new aws_cloudfront_origins.S3Origin(bucket.cdk.bucket),
      allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      originRequestPolicy: aws_cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
      viewerProtocolPolicy: aws_cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
    },
  }

  app.addDefaultFunctionBinding([
    bucket,
    new Config.Parameter(stack, 'CDN_SECURE_URL', {value: secureUrl}),
    new Config.Parameter(stack, 'CDN_PUBLIC_URL', {value: publicUrl}),
  ])

  stack.addOutputs({
    CdnSecureUrl: secureUrl,
    CdnPublicUrl: publicUrl,
    CdnBucketName: bucket.bucketName,
  })

  return {
    securePath,
    publicPath,
    behaviors,
  }
}
