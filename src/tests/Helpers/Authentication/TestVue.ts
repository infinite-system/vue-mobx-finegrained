import { inject, injectable } from 'inversify'
import { action, makeObservable, observable, computed, comparer, runInAction } from 'mobx'
import { AuthenticationRepository } from './AuthenticationRepository'
import { MessagesPresenter } from '../Core/Messages/MessagesPresenter'
import { MessagesRepository } from '../Core/Messages/MessagesRepository'
import { Router } from '../Routing/Router'
import { useMobX, notify } from '@/useMobX';
import { isReactive, markRaw, reactive, shallowReactive, shallowRef, toRaw, watch } from "vue";
import cloneDeep from "lodash/cloneDeep";
import { clone, deepClone } from "@/utils.js";

@injectable()
class ObservableClass {
  hello = 1
}

@injectable()
abstract class ParentTestVue {
  @inject(MessagesRepository) messagesRepository: MessagesRepository

  prop = 'test'

  showValidationWarning = null

  messagesObservables = {}

  constructor () {

  }

  init () {
    this.showValidationWarning = false
    this.reset()
  }

  abstract reset (): void
}

@injectable()
export class TestVue extends ParentTestVue {

  overrides = {
    // authRepo: false,
    // messagesRepository: false,
    // router: false,
    hugeArray: observable.shallow,
    reactiveVar: observable.shallow
  }

  @inject(ObservableClass) observableClass

  @inject(AuthenticationRepository) authRepo: AuthenticationRepository

  @inject(MessagesRepository) messagesRepository: MessagesRepository

  @inject(Router) router: Router

  hugeArray = []

  constructor () {
    super()

    for(let i =0; i<22;i++){
      this.hugeArray.push({
        prop: 'test',
        struct: {
          id: i,
          user: 'vasya',
          text: 'hello',
          struct: {
            id: i,
            user: 'vasya',
            text: 'hello',
            struct: {
              id: i,
              user: 'vasya',
              text: 'hello',
              struct: {
                id: i,
                user: 'vasya',
                text: 'hello',
                struct: {
                  id: i,
                  user: 'vasya',
                  text: 'hello',
                  struct: {
                    id: i,
                    user: 'vasya',
                    text: 'hello',
                    struct: {
                      id: i,
                      user: 'vasya',
                      text: 'hello',
                      struct: {
                        id: i,
                        user: 'vasya',
                        text: 'hello',
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })

    }
  }



  primitive = 1

  array = [1,2,3]

  object = {
    prop: {
      prop: {
        prop: 1
      }
    }
  }

  i = 0

  cacheReactiveVar = [{test: 'ta', test2:'ta'}]

  reactiveVar = []
  get _reactiveVar () {
    console.log('compute')
    // this.object.test = 1
    return (this.authRepo.reactiveVar.map(el => ({
      test: el.test + 'nah !', test2: el.test2,
    })))
  }



  reactiveVar2 = []
  get _reactiveVar2 () {
    console.log('compute2')
    return this.reactiveVar.map(el => ({
      test: el.test+'+yahooo', test2:el.test2
    }))
  }

  reactiveVar3 = 1
  get _reactiveVar3 () {
    // console.log('compute3', this.primitive)
    return this.primitive
  }

  // set reactiveVar(v){ this.authRepo.reactiveVar = v }

  setReactiveVar2(v){ this.reactiveVar = [{test:'ahah', test2:'lala'}] }

  setReactiveVar() {

    this.authRepo.reactiveVar.push({
      test: 1,
      test2: 2
    })
    // this.authRepo.reactiveVar.push({
    //   test: 1, test2: 2
    // })
  }

  setCacheReactiveVar() {

    this.cacheReactiveVar.push({
      test: 1,
      test2: 2
    })
    console.log('setCacheReactiveVar', this.cacheReactiveVar)
    console.log('setCacheReactiveVar', this)
    // this.authRepo.reactiveVar.push({
    //   test: 1, test2: 2
    // })
  }


  action () {}
}

