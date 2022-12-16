import {App} from 'sst/constructs'
import {HostedZone} from './hosted-zone-stack'

export default function (app: App) {
  app.stack(HostedZone)
}
