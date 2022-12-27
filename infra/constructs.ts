import {
  Duration,
  Tags,
  aws_events,
  aws_events_targets,
  aws_lambda,
  aws_lambda_destinations,
  aws_lambda_event_sources,
  aws_sqs,
} from 'aws-cdk-lib'
import {Function, FunctionProps, Queue as SstQueue, Stack} from 'sst/constructs'
import {SetRequired} from 'type-fest'
import {AwsConfig} from './config'

export const DLQ = (stack: Stack, id: string, props?: aws_sqs.QueueProps) => {
  const queueId = `${id}DLQ`
  const queue = new SstQueue(stack, queueId, {
    cdk: {
      queue: {
        retentionPeriod: Duration.days(14),
        ...props,
      },
    },
  })

  Tags.of(queue).add('type', 'dlq')

  return queue
}

/**
 * Queue's recommended config
 * @link https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html#events-sqs-queueconfig
 */
export const Queue = (
  stack: Stack,
  id: string,
  {
    consumer,
    eventSource,
    ...queueProps
  }: aws_sqs.QueueProps & {
    consumer: Function
    eventSource: aws_lambda_event_sources.SqsEventSourceProps
  }
) => {
  const queueId = `${id}Queue`
  const isProd = stack.stage === AwsConfig.stages.main.prod
  const fnTimeout = consumer.timeout ?? Duration.seconds(10)
  const visibilityTimeout = Duration.seconds(
    fnTimeout.toSeconds() * (isProd ? 6 : 1)
  )
  const maxReceiveCount = isProd ? 5 : 2

  const dlq = DLQ(stack, queueId, {
    fifo: queueProps.fifo,
    contentBasedDeduplication: queueProps.contentBasedDeduplication,
  })
  const queue = new SstQueue(stack, queueId, {
    consumer: {
      function: consumer,
      cdk: {
        eventSource: {
          batchSize: 10,
          reportBatchItemFailures: true,
          ...eventSource,
        },
      },
    },
    cdk: {
      queue: {
        visibilityTimeout,
        deadLetterQueue: {
          queue: dlq.cdk.queue,
          maxReceiveCount,
        },
        ...queueProps,
      },
    },
  })

  Tags.of(queue).add('type', queueProps.fifo ? 'fifo' : 'standard')

  return {dlq, queue}
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
    eventPattern: aws_events.EventPattern
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

type EventPattern = SetRequired<aws_events.EventPattern, 'detailType'>

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
    //TODO: Type safe the event pattern type
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
