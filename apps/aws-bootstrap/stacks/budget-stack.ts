import {aws_budgets} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {AwsUtils} from '../../../aws.utils'

/**
 * Account budgets.
 * @link https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html
 */
export function Budget({stack}: StackContext) {
  const account = AwsUtils.getAccount(stack.account)

  /** Monthly budget */
  new aws_budgets.CfnBudget(stack, 'MonthlyBudget', {
    budget: {
      budgetType: 'COST',
      timeUnit: 'MONTHLY',
      budgetLimit: {amount: account.budget, unit: 'USD'},
    },
    // Notify by email on forecast & actual thresholds
    notificationsWithSubscribers: [
      {type: 'FORECASTED', threshold: 80},
      {type: 'ACTUAL', threshold: 100},
    ].map((n) => ({
      subscribers: [{address: account.email, subscriptionType: 'EMAIL'}],
      notification: {
        notificationType: n.type,
        threshold: n.threshold,
        thresholdType: 'PERCENTAGE',
        comparisonOperator: 'GREATER_THAN',
      },
    })),
  })
}
