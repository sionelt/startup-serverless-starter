import {ArnFormat, Duration, aws_iam} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'

/**
 * Create OpenID Connect provider in IAM for Github OpenID Connect.
 * Github OIDC provider will assume an IAM role with necessary permissions to access
 * AWS services from within Github Actions.
 * @link https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect
 */
export function GithubOidc({stack}: StackContext) {
  const domain = 'token.actions.githubusercontent.com'

  /**
   * GITHUB_REPOSITORY (owner/repo) already set in Github Actions envs
   */
  const githubRepository = process.env.GITHUB_REPOSITORY
  if (!githubRepository) {
    throw new Error(
      `Env variable "GITHUB_REPOSITORY" is required to create Github OIDC provider in IAM`
    )
  }

  /**
   * Github as OIDC provider in IAM.
   * There can only be one Github provider created per aws account!
   */
  const provider = new aws_iam.OpenIdConnectProvider(stack, 'Provider', {
    url: `https://${domain}`,
    clientIds: ['sts.amazonaws.com'],
  })

  /**
   * Principal to assume deployment roles.
   */
  const principal = new aws_iam.OpenIdConnectPrincipal(provider, {
    StringLike: {
      [`${domain}:sub`]: [`repo:${githubRepository}:*`],
    },
  })

  /**
   * CDK Boostrap creates 5 IAM roles for authorizing CDK tasks.
   * Allow Github principal to assume these roles in Github Actions for CDK deployment.
   * @link https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html#bootstrapping-contract
   */
  const role = new aws_iam.Role(stack, 'Role', {
    assumedBy: principal,
    roleName: 'GitHubActions',
    maxSessionDuration: Duration.hours(1), // Min: 1 hr, max: 12 hrs
    inlinePolicies: {
      CdkDeployment: new aws_iam.PolicyDocument({
        assignSids: true,
        statements: [
          new aws_iam.PolicyStatement({
            effect: aws_iam.Effect.ALLOW,
            actions: ['sts:AssumeRole'],
            resources: [
              stack.formatArn({
                region: '',
                service: 'iam',
                resource: 'role',
                resourceName: 'cdk-*', // Wildcard to match all 5 roles.
                arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
              }),
            ],
          }),
        ],
      }),
    },
  })

  stack.addOutputs({
    GithubOidcRoleName: role.roleName,
  })
}
