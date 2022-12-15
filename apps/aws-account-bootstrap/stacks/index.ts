import {Tags} from 'aws-cdk-lib'
import {App} from 'sst/constructs'
import {GithubOidc} from './github-oidc-stack'
import {HostedZone} from './hosted-zone-stack'
import {Ses} from './ses-stack'

export default function (app: App) {
  app.stack(HostedZone).stack(GithubOidc).stack(Ses)

  Tags.of(app).add('app', app.name)
  Tags.of(app).add('stage', app.stage)
}
