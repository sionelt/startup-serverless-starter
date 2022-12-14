import {Tags} from 'aws-cdk-lib'
import {App} from 'sst/constructs'
import {GithubActions} from './github-actions-stack'
import {HostedZone} from './hosted-zone-stack'

export default function (app: App) {
  app.stack(GithubActions).stack(HostedZone)

  Tags.of(app).add('app', app.name)
  Tags.of(app).add('stage', app.stage)
}
