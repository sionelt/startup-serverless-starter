import {aws_iam} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'

export function IamPolicies({stack}: StackContext) {
  const userAccessRole = new aws_iam.Role(stack, 'UserAccess', {
    assumedBy: new aws_iam.AccountRootPrincipal(),
    inlinePolicies: {
      db: new aws_iam.PolicyDocument({
        statements: [
          new aws_iam.PolicyStatement({
            sid: 'S3Access',
            resources: ['*'],
            actions: ['s3:GetObject'],
          }),
          new aws_iam.PolicyStatement({
            sid: 'KmsAccess',
            resources: ['*'],
            actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:GenerateDataKey'],
            conditions: {
              StringEquals: {
                'aws:PrincipalTag/UserID': '${aws:ResourceTag/UserID}',
              },
            },
          }),
        ],
      }),
    },
  })

  return {
    userAccessRole,
  }
}
