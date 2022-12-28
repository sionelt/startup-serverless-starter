import {aws_iam} from 'aws-cdk-lib'
import {StackContext, use} from 'sst/constructs'
import {EventApiDestinationFunction} from '../constructs/event-target'
import {Bus} from './bus-stack'

export function Notification({stack}: StackContext) {
  const bus = use(Bus)

  stack.addDefaultFunctionBinding([bus.apiDestinationCredentials])

  const emailFn = EventApiDestinationFunction(stack, 'SendEmail', {
    handler: 'send-email.main',
    eventBus: bus.eventBus,
    connection: bus.apiDestinationConnection,
    rateLimitPerSecond: 14,
    reservedConcurrentExecutions: 15,
    eventPattern: {
      detailType: ['email_notification_routed'],
    },
    permissions: [
      new aws_iam.PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      }),
    ],
  })

  stack.addOutputs({
    EmailNotificationEndpoint: emailFn.url,
  })
}
