import {App} from 'sst/constructs'
import {Api} from './api-stack'
import {Bus} from './bus-stack'
import {Cdn} from './cdn-stack'
import {Database} from './database-stack'
import {Dns} from './dns-stack'
import {Notification} from './notification-stack'
import {WebApp} from './web-app-stack'

/**
 * Stacks to be deployed per stages in each supporting regions of the member account
 */
export function appStacks(app: App) {
  const environment: Record<string, string> = {
    NODE_OPTIONS: '--enable-source-maps',
  }

  if (app.local) {
    environment.POWERTOOLS_DEV = '1'
  }

  app.setDefaultFunctionProps({
    runtime: 'nodejs16.x',
    architecture: 'arm_64',
    environment,
    nodejs: {
      esbuild: {
        format: 'esm',
        minify: true,
      },
    },
  })

  app
    .stack(Dns)
    .stack(Bus)
    .stack(Cdn)
    .stack(Database)
    .stack(Notification)
    .stack(Api)
    .stack(WebApp)
}
