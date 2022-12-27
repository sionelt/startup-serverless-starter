import {Config, StackContext} from 'sst/constructs'

export function Database({stack, app}: StackContext) {
  app.setDefaultFunctionProps({
    bind: [
      new Config.Secret(stack, 'PLANETSCALE_URL'),
      new Config.Secret(stack, 'UPSTASH_REDIS_REST_TOKEN'),
      new Config.Parameter(stack, 'UPSTASH_REDIS_REST_URL', {
        value: 'https://global-obliging-chimp-31301.upstash.io',
      }),
    ],
  })
}
