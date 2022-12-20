import {
  aws_events,
  aws_events_targets,
  aws_guardduty,
  aws_sns,
  aws_sns_subscriptions,
} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {AwsUtils} from '../../../aws.utils'

/**
 * Create GuardDuty per region for security monitoring
 * @link https://github.com/aws-samples/aws-cdk-intro-workshop/blob/master/cdkworkshop.com/guardduty.ts
 */
export function Guardduty({stack}: StackContext) {
  new aws_guardduty.CfnDetector(stack, 'Detector', {
    enable: true,
    findingPublishingFrequency: 'FIFTEEN_MINUTES',
  })
  // TODO: Need master & member ??

  const topc = new aws_sns.Topic(stack, 'GuardDutyNotificationTopic')
  topc.addSubscription(
    new aws_sns_subscriptions.EmailSubscription(
      AwsUtils.getAccount(stack.account).email
    )
  )

  const account = aws_events.EventField.fromPath('$.account')
  const region = aws_events.EventField.fromPath('$.region')
  const type = aws_events.EventField.fromPath('$.detail.type')

  new aws_events.Rule(stack, 'GuardDutyEventRule', {
    eventPattern: {
      source: ['aws.guardduty'],
      detailType: ['GuardDuty Finding'],
    },
    targets: [
      new aws_events_targets.SnsTopic(topc, {
        message: aws_events.RuleTargetInput.fromText(
          `WARNING: AWS GuardDuty has discovered a ${type} security issue in ${account} (${region}).
          Please go to https://${region}.console.aws.amazon.com/guardduty/ to find out more details.`
        ),
      }),
    ],
  })

  stack.addOutputs({
    GuardDutySnsTopicArn: topc.topicArn,
  })
}
