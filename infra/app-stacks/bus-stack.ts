import {SecretValue, aws_events} from 'aws-cdk-lib'
import {Config, EventBus, Function, StackContext} from 'sst/constructs'
import {DLQ} from '../constructs'

export function Bus({stack}: StackContext) {
  const bus = new EventBus(stack, 'Main')
  const dlq = DLQ(stack, 'Main')

  new Function(stack, 'PublishEvents', {
    bind: [dlq, bus],
    handler: 'use-cases/publish-events.main',
  })

  /**
   * Connection to authorize internal Api Destination targets
   */

  const apiDestinationCredentials = new Config.Parameter(
    stack,
    'API_DESTINATION_CREDENTIALS',
    {value: '/bus/api_destination/credentials'}
  )

  const apiDestinationConnection = new aws_events.Connection(
    stack,
    'ApiDestinationTargetConnection',
    {
      authorization: aws_events.Authorization.apiKey(
        'api-destination-key',
        SecretValue.secretsManager(apiDestinationCredentials.value, {
          jsonField: 'api_key',
        })
      ),
    }
  )

  stack.addOutputs({
    BusName: bus.eventBusName,
    BusDlqUrl: dlq.queueUrl,
  })

  return {
    apiDestinationConnection,
    apiDestinationCredentials,
    eventBus: bus.cdk.eventBus,
  }
}
