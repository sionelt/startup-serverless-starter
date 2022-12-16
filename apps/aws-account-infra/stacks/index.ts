import {App} from 'sst/constructs'
import {Cdn} from './cdn-stack'
import {GithubOidc} from './github-oidc-stack'
import {HostedZone} from './hosted-zone-stack'

export default function (app: App) {
  app.stack(HostedZone).stack(GithubOidc).stack(Cdn)
}
