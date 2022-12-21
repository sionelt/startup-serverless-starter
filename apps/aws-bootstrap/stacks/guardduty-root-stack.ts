import {aws_guardduty} from 'aws-cdk-lib'
import {StackContext} from 'sst/constructs'
import {AwsConfig} from '../../../aws.config'
import {AwsUtils} from '../../../aws.utils'

/**
 * Create GuardDuty in root account as master for threat detection & monitoring
 * @link https://github.com/aws-samples/aws-cdk-intro-workshop/blob/master/cdkworkshop.com/guardduty.ts
 */
export function GuarddutyRoot({stack}: StackContext) {
  const detector = new aws_guardduty.CfnDetector(stack, 'Detector', {
    enable: true,
    findingPublishingFrequency: 'FIFTEEN_MINUTES',
  })

  const memberAccounts = Object.values(AwsConfig.accounts).filter(
    (a) => !AwsUtils.isRootAccount(a.id)
  )
  for (const acc of memberAccounts) {
    new aws_guardduty.CfnMember(stack, `GuardDuty${acc.name}Member`, {
      email: acc.email,
      status: 'Invited',
      memberId: acc.id,
      detectorId: detector.logicalId,
      disableEmailNotification: true,
    })
  }

  stack.addOutputs({})
}
