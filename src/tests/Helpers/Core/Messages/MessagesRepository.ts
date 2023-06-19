import { injectable } from 'inversify'
import { makeObservable, observable } from 'mobx'

@injectable()
export class MessagesRepository {

  appMessages = null
  clientMessages = null

  constructor () {
    makeObservable(this, {
      appMessages: observable,
      clientMessages: observable,
    })
    this.reset()
  }

  reset () {
    this.appMessages = []
    this.clientMessages = []
  }
}
