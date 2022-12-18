import {
  RemovalPolicy,
  aws_certificatemanager,
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_route53,
  aws_route53_targets,
  aws_s3,
} from 'aws-cdk-lib'
import {Bucket, StackContext} from 'sst/constructs'
import {AwsConfig} from '../../../aws.config'
import {AwsUtils} from '../../../aws.utils'

export function Cdn({stack}: StackContext) {
  /**
   * Uploads/Access to Bucket can only be done via CDN.
   * NOTE: Bucket will be in a specific region, but CDN will help with latency.
   */
  const bucket = new Bucket(stack, 'Bucket', {
    cdk: {
      bucket: {
        autoDeleteObjects: false,
        removalPolicy: RemovalPolicy.RETAIN,
        publicReadAccess: false,
        eventBridgeEnabled: true,
        bucketKeyEnabled: true,
        encryption: aws_s3.BucketEncryption.KMS_MANAGED,
        blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
        cors: [
          {
            allowedOrigins: ['*'],
            allowedHeaders: ['*'],
            allowedMethods: [aws_s3.HttpMethods.PUT],
          },
        ],
      },
    },
  })

  /**
   * Default Behavior for private assets requires URLs to be signed with a key group
   * Cloudfront validates the signed url against this key group on requests.
   * @link Private Content: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PrivateContent.html
   * @link Key Groups generation: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront-readme.html#keygroup--publickey-api
   */

  const publicKey = new aws_cloudfront.PublicKey(stack, 'PublicKey', {
    encodedKey: AwsConfig.cdn.publicKey,
  })
  const keyGroup = new aws_cloudfront.KeyGroup(stack, 'KeyGroup', {
    items: [publicKey],
  })
  const defaultBehavior: aws_cloudfront.DistributionProps['defaultBehavior'] = {
    trustedKeyGroups: [keyGroup],
    origin: new aws_cloudfront_origins.S3Origin(bucket.cdk.bucket),
    allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
    originRequestPolicy: aws_cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
    viewerProtocolPolicy: aws_cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
  }

  /**
   * Additonal behaviors:
   * - Public content don't require URLs to be signed.
   */
  const additionalBehaviors: aws_cloudfront.DistributionProps['additionalBehaviors'] =
    {
      [`${AwsConfig.cdn.publicDir}/*`]: {
        origin: new aws_cloudfront_origins.S3Origin(bucket.cdk.bucket),
        allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        originRequestPolicy: aws_cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        viewerProtocolPolicy: aws_cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
      },
    }

  /**
   * Custom domain
   */

  const domainName = AwsUtils.joinHostedZone(stack.account, 'cdn')
  const hostedZone = aws_route53.HostedZone.fromLookup(stack, 'HostedZone', {
    domainName,
  })

  const certificate = new aws_certificatemanager.DnsValidatedCertificate(
    stack,
    'Certificate',
    {
      domainName,
      hostedZone,
      region: AwsConfig.regions.usEast1, // Required to be created in us-east-1
    }
  )
  const distro = new aws_cloudfront.Distribution(stack, 'Distro', {
    certificate,
    defaultBehavior,
    additionalBehaviors,
    domainNames: [domainName],
  })

  new aws_route53.ARecord(stack, 'ARecord', {
    zone: hostedZone,
    recordName: domainName,
    target: aws_route53.RecordTarget.fromAlias(
      new aws_route53_targets.CloudFrontTarget(distro)
    ),
  })
  new aws_route53.AaaaRecord(stack, 'AliasRecord', {
    zone: hostedZone,
    recordName: domainName,
    target: aws_route53.RecordTarget.fromAlias(
      new aws_route53_targets.CloudFrontTarget(distro)
    ),
  })

  stack.addOutputs({
    CdnUrl: `https://${domainName}`,
    CdnBucketName: bucket.bucketName,
    CdnPublicDir: AwsConfig.cdn.publicDir,
  })
}
