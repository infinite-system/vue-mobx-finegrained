import { inject, injectable } from 'inversify'
import TreeModel from 'tree-model'
import { AuthenticationRepository } from '../Authentication/AuthenticationRepository'
import { Router } from '../Routing/Router'
import { action, computed, makeObservable } from 'mobx'

@injectable()
export class NavigationRepository {

  @inject(AuthenticationRepository) authenticationRepository: AuthenticationRepository
  @inject(Router) router: Router

  get currentNode () {
    return this.getTree().all((node) => node.model.id === this.router.currentRoute.routeId)[0]
  }

  constructor () {
    makeObservable(this, {
      currentNode: computed,
      back: action,
    })
  }

  getTree () {
    const tree = new TreeModel()

    const root = tree.parse({
      id: 'homeLink',
      type: 'root',
      text: 'Home',
      children: [],
    })

    return root
  }

  back () {
    const currentNode = this.currentNode
    this.router.goToId(currentNode.parent.model.id)
  }
}
