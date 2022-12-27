import {aws_wafv2} from 'aws-cdk-lib'
import {Config, StackContext} from 'sst/constructs'
import {AwsConfig} from '../config'

/**
 * Firewall protection
 */
export function Waf({stack, app}: StackContext) {
  /**
   * 'CLOUDFRONT' scope requires it to be in us-east-1
   * #AWSWishlist for AWS CDK to create this cross-region for us like ACM certificate.
   */
  const waf = new aws_wafv2.CfnWebACL(stack, 'Firewall', {
    scope: 'CLOUDFRONT',
    defaultAction: {allow: {}},
    visibilityConfig: {
      metricName: app.logicalPrefixedName('web-acl'),
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
    },
    rules: rules(),
  })

  /**
   * Save ARN as parameter so we can retrieve it other regions where
   * the Cloudfront distribution is created.
   */
  new Config.Parameter(stack, AwsConfig.cdn.wafWebAclArnName, {
    value: waf.attrArn,
  })
}

/**
 * Rule Groups
 * https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-list.html
 */
function rules() {
  const managedRules: aws_wafv2.CfnWebACL.RuleProperty[] = [
    // General common protection
    {
      name: 'AWSManagedRulesCommonRuleSet',
      priority: 10,
    },
    // Block  IP addresses associated with bots or other threats
    {
      name: 'AWSManagedRulesAmazonIpReputationList',
      priority: 20,
    },
    // Block bad/malicious inputs
    {
      name: 'AWSManagedRulesKnownBadInputsRuleSet',
      priority: 30,
    },
    // Block sql injection attacks
    {
      name: 'AWSManagedRulesSQLiRuleSet',
      priority: 40,
    },
  ].map((r) => ({
    name: r.name,
    priority: r.priority,
    overrideAction: {none: {}},
    statement: {
      managedRuleGroupStatement: {
        name: r.name,
        vendorName: 'AWS',
        excludedRules: [],
      },
    },
    visibilityConfig: {
      metricName: r.name,
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
    },
  }))

  /**
   * Rate limit for IP address per 5 minutes period
   */
  const ipRateLimit: aws_wafv2.CfnWebACL.RuleProperty = {
    name: 'IpRateLimit',
    priority: 1,
    action: {
      block: {}, // To disable, change to 'count'
    },
    statement: {
      rateBasedStatement: {
        limit: 600, // approx 2 RPS
        aggregateKeyType: 'IP',
      },
    },
    visibilityConfig: {
      metricName: 'IpRateLimit',
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
    },
  }

  return [...managedRules, ipRateLimit]
}
