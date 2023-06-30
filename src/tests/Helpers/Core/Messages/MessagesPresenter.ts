import { inject, injectable } from 'inversify'
import { action, computed, makeObservable, observable } from 'mobx'
import { MessagesRepository } from './MessagesRepository'
import { useMobX } from "@/useMobX";

export abstract class GrandParent {
  grandParentProp = 1
}

@injectable()
export abstract class MessagesPresenter extends GrandParent {

  @inject(MessagesRepository) messagesRepository: MessagesRepository

  nonObservedProp = 'test'

  showValidationWarning = null

  messagesObservables = {
    showValidationWarning: observable,
    messages: computed,
    clientMessages: computed,
    unpackRepositoryPmToVm: action,
  }

  constructor () {
    super()
    makeObservable(this, this.messagesObservables)
  }

  init () {
    this.showValidationWarning = false
    this.reset()
  }

  abstract reset (): void

  get messages () {
    return this.messagesRepository.appMessages
  }

  get clientMessages () {
    return this.messagesRepository.clientMessages
  }

  unpackRepositoryPmToVm (pm, userMessage) {
    this.showValidationWarning = !pm.success
    this.messagesRepository.appMessages = pm.success ? [userMessage] : [pm.serverMessage]
  }

  get vm () {
    return useMobX(this, this.messagesObservables)
  }
}
