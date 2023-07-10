import { Container } from 'inversify'
import { MessagesRepository } from './Core/Messages/MessagesRepository'
import { Router } from './Routing/Router'
import { RouterRepository } from './Routing/RouterRepository'
import { UserModel } from './Authentication/UserModel'
import { NavigationRepository } from './Navigation/NavigationRepository'
import { AppPresenter } from './AppPresenter'
import { TestPresenter } from "./Authentication/TestPresenter.js";

export class BaseIOC {
  container

  constructor() {
    this.container = new Container({
      autoBindInjectable: true,
      defaultScope: 'Transient',
    })
  }

  buildBaseTemplate = () => {

    this.container.bind(MessagesRepository).to(MessagesRepository).inSingletonScope()
    this.container.bind(Router).to(Router).inSingletonScope()
    this.container.bind(RouterRepository).to(RouterRepository).inSingletonScope()
    this.container.bind(NavigationRepository).to(NavigationRepository).inSingletonScope()
    this.container.bind(UserModel).to(UserModel).inSingletonScope()
    this.container.bind(AppPresenter).to(AppPresenter).inSingletonScope()
    this.container.bind(TestPresenter).to(TestPresenter).inSingletonScope()

    return this.container
  }
}
