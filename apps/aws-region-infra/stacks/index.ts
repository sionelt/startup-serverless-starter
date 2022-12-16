import {App} from 'sst/constructs'
import {Ses} from './ses-stack'

export default function (app: App) {
  app.stack(Ses)
}
