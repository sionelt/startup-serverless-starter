import {App} from 'sst/constructs'
import {Api} from './api-stack'

export default function (app: App) {
  app.setDefaultFunctionProps({
    runtime: 'nodejs16.x',
    nodejs: {
      esbuild: {
        format: 'esm',
        minify: true,
      },
    },
  })

  app.stack(Api)
}
