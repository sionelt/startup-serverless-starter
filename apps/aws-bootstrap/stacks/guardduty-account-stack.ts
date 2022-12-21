import {
  aws_events,
  aws_events_targets,
  aws_guardduty,
  aws_sns,
  aws_sns_subscriptions,
} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {AwsConfig} from '../../../aws.config'
import {AwsUtils} from '../../../aws.utils'

/**
 * Create GuardDuty per account for threat detection & monitoring
 * @link https://dev.to/aws-heroes/centralising-audit-compliance-and-incident-detection-11fi
 * @link https://github.com/aws-samples/aws-cdk-intro-workshop/blob/master/cdkworkshop.com/guardduty.ts
 */
export function GuarddutyAccount({stack}: StackContext) {
  const detector = new aws_guardduty.CfnDetector(stack, 'Detector', {
    enable: true,
    findingPublishingFrequency: 'FIFTEEN_MINUTES',
  })

  const master = new aws_guardduty.CfnMaster(stack, 'GuardDutyMaster', {
    detectorId: detector.logicalId,
    masterId: AwsConfig.accounts.root.id,
  })

  const topic = new aws_sns.Topic(stack, 'GuardDutyNotificationTopic')
  topic.addSubscription(
    new aws_sns_subscriptions.EmailSubscription(
      AwsUtils.getAccount(stack.account).email
    )
  )

  const account = aws_events.EventField.fromPath('$.account')
  const region = aws_events.EventField.fromPath('$.region')
  const detail = aws_events.EventField.fromPath('$.detail')
  const type = aws_events.EventField.fromPath('$.detail.type')

  new aws_events.Rule(stack, 'GuardDutyEventRule', {
    eventPattern: {
      source: ['aws.guardduty'],
      detailType: ['GuardDuty Finding'],
    },
    targets: [
      new aws_events_targets.SnsTopic(topic, {
        message: aws_events.RuleTargetInput.fromText(
          `WARNING: AWS GuardDuty has discovered a ${type} security issue in ${account} (${region}).
          Please go to https://${region}.console.aws.amazon.com/guardduty/ to find out more details.
          Event Payload: ${detail}`
        ),
      }),
    ],
  })

  stack.addOutputs({
    GuardDutyMasterId: master.masterId,
    GuardDutySnsTopicArn: topic.topicArn,
  })
}
