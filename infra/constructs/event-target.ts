import {
  aws_events,
  aws_events_targets,
  aws_lambda,
  aws_lambda_destinations,
} from 'aws-cdk-lib'
import {Function, FunctionProps, Stack} from 'sst/constructs'
import {Events} from '../../events'
import {DLQ} from './queue'

interface EventPattern extends aws_events.EventPattern {
  detailType: (keyof Events)[]
}

export const EventTargetFunction = (
  stack: Stack,
  id: string,
  {
    eventBus,
    eventPattern,
    eventMapping = '$',
    ...fnProps
  }: FunctionProps & {
    eventBus: aws_events.IEventBus
    eventPattern: EventPattern
    eventMapping?: string
  }
) => {
  const dlq = DLQ(stack, id)
  const fn = new Function(stack, id, {
    ...fnProps,
    /**
     * Only works on deployed stages.
     * SST hard set this to 0 on local. So it won't be retried.
     */
    retryAttempts: 2,
    onFailure: new aws_lambda_destinations.SqsDestination(dlq.cdk.queue),
  })

  new aws_events.Rule(stack, `${id}Rule`, {
    eventBus,
    eventPattern,
    targets: [
      new aws_events_targets.LambdaFunction(fn, {
        deadLetterQueue: dlq.cdk.queue,
        event: aws_events.RuleTargetInput.fromEventPath(eventMapping),
      }),
    ],
  })

  return fn
}

export const EventApiDestinationFunction = (
  stack: Stack,
  id: string,
  {
    eventBus,
    eventPattern,
    connection,
    rateLimitPerSecond,
    ...fnProps
  }: FunctionProps & {
    eventBus: aws_events.IEventBus
    eventPattern: EventPattern
    connection: aws_events.ApiDestinationProps['connection']
    rateLimitPerSecond: aws_events.ApiDestinationProps['rateLimitPerSecond']
  }
) => {
  const fn = new Function(stack, id, fnProps)
  const fnUrl = fn.addFunctionUrl({
    authType: aws_lambda.FunctionUrlAuthType.NONE,
  })

  const destination = new aws_events.ApiDestination(
    stack,
    `${id}ApiDestination`,
    {
      connection,
      rateLimitPerSecond,
      endpoint: fnUrl.url,
      httpMethod: aws_events.HttpMethod.POST,
    }
  )
  destination.node.addDependency(fnUrl)

  new aws_events.Rule(stack, `${id}Rule`, {
    eventBus,
    eventPattern,
    targets: [new aws_events_targets.ApiDestination(destination)],
  })

  return {fn, url: fnUrl.url}
}
