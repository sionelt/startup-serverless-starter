import {aws_sso} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {InfraConfig} from '../config'

/**
 * Create permission sets for SSO directory.
 * @link Credit https://github.com/markilott/aws-cdk-sso-permission-sets
 *
 * #### Monthly Cost
 * * Free
 */
export function Sso({stack}: StackContext) {
  const {instanceArn} = InfraConfig.sso

  /**
   * Add Permission sets
   */
  for (const {
    name,
    description,
    accounts,
    groups,
    sessionHours,
    managedPolicies,
    inlinePolicy,
  } of permisssionSets()) {
    const permissionSet = new aws_sso.CfnPermissionSet(
      stack,
      `${name}PermissionSet`,
      {
        name,
        description,
        instanceArn,
        inlinePolicy,
        managedPolicies,
        sessionDuration: `PT${sessionHours}H`, // In ISO 8601
      }
    )

    // Assign to Accounts and Groups
    for (const accountId of accounts) {
      for (const group of groups) {
        new aws_sso.CfnAssignment(
          stack,
          `${name}${accountId}${group}Assignment`,
          {
            instanceArn,
            targetType: 'AWS_ACCOUNT',
            targetId: accountId,
            principalType: 'GROUP',
            principalId: InfraConfig.sso.groupIds[group],
            permissionSetArn: permissionSet.attrPermissionSetArn,
          }
        )
      }
    }
  }
}

const allAccountIds = Object.values(InfraConfig.accounts).map((a) => a.id)

/**
 * @link Managed Policies https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_job-functions.html
 */
export const permisssionSets = () => [
  {
    name: 'Admin',
    description: 'For admins',
    accounts: allAccountIds,
    sessionHours: 12,
    groups: [InfraConfig.sso.groups.admin],
    managedPolicies: [
      'arn:aws:iam::aws:policy/AdministratorAccess',
      'arn:aws:iam::aws:policy/job-function/Billing',
    ],
    inlinePolicy: {},
  },
  {
    name: 'Developer',
    description: 'For developers access',
    sessionHours: 12,
    accounts: [InfraConfig.accounts.development.id],
    groups: [InfraConfig.sso.groups.developer],
    managedPolicies: ['arn:aws:iam::aws:policy/PowerUserAccess'],
    inlinePolicy: {},
  },
  {
    name: 'Production',
    description: 'Only allow Read access in Production',
    sessionHours: 4,
    accounts: [InfraConfig.accounts.production.id],
    groups: [InfraConfig.sso.groups.developer],
    managedPolicies: ['arn:aws:iam::aws:policy/ReadOnlyAccess'],
    inlinePolicy: {},
  },
]
