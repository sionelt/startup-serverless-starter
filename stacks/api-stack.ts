import {Api as SstApi, StackContext} from 'sst/constructs'

export function Api({stack}: StackContext) {
  const api = new SstApi(stack, 'api', {
    routes: {
      'GET /': 'services/functions/lambda.handler',
    },
  })
  stack.addOutputs({
    ApiEndpoint: api.url,
  })
}
