import {App} from 'sst/constructs'
import {GithubOidc} from './github-oidc-stack'
import {HostedZone} from './hosted-zone-stack'
import {Ses} from './ses-stack'

export default function (app: App) {
  app.stack(HostedZone).stack(GithubOidc).stack(Ses)
}
