import {Duration, Tags, aws_lambda_event_sources, aws_sqs} from 'aws-cdk-lib'
import {Function, Queue as SstQueue, Stack} from 'sst/constructs'
import {InfraConfig} from '../config'

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
  const isProd = stack.stage === InfraConfig.stages.app.prod
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
