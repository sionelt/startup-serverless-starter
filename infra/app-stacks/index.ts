import {App} from 'sst/constructs'
import {Api} from './api-stack'
import {Bus} from './bus-stack'
import {Database} from './database-stack'
import {Dns} from './dns-stack'
import {Notification} from './notification-stack'
import {WebApp} from './web-app-stack'

/**
 * Stacks to be deployed per stages of the app in each of the member account
 */
export function appStacks(app: App) {
  app.setDefaultFunctionProps({
    runtime: 'nodejs16.x',
    architecture: 'arm_64',
    nodejs: {
      esbuild: {
        format: 'esm',
        minify: true,
      },
    },
    environment: {
      NODE_OPTIONS: '--enable-source-maps',
      POWERTOOLS_DEV: app.local ? '1' : '0', // Prettify logs
      POWERTOOLS_LOGGER_LOG_EVENT: app.local ? '1' : '0',
    },
  })

  app
    .stack(Dns)
    .stack(Bus)
    .stack(Database)
    .stack(Notification)
    .stack(Api)
    .stack(WebApp)
}
