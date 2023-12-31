import { inject, injectable } from 'inversify'
import { action, makeObservable, observable, computed, comparer, runInAction } from 'mobx'
import { AuthenticationRepository } from './AuthenticationRepository'
import { MessagesPresenter } from '../Core/Messages/MessagesPresenter'
import { MessagesRepository } from '../Core/Messages/MessagesRepository'
import { Router } from '../Routing/Router'
import { useMobX, notify } from '@/useMobX';
import { isReactive, reactive, watch } from "vue";
import cloneDeep from "lodash/cloneDeep";

@injectable()
class ObservableClass {
  hello = 1
}

@injectable()
export class TestPresenter extends MessagesPresenter {

  @inject(ObservableClass) observableClass

  nonObservablePrimitive = 1

  nonObservableObject = reactive({
    prop: {
      prop: {
        prop: 1
      }
    }
  })

  get reactiveVar () {
    console.log('yes')
    return this.authRepo.reactiveVar.map(el => ({
      test: el.test, test2: el.test2
    }))
  }

  setReactiveVar() {
    this.authRepo.reactiveVar.push({
      test: 1, test2: 2
    })
  }

  @inject(AuthenticationRepository) authRepo: AuthenticationRepository

  @inject(MessagesRepository) messagesRepository: MessagesRepository

  @inject(Router) router: Router

  email = null
  password2 = {
    alala: 1,
    ba: {
      sasa: {
        va: 'hi',
      },
      rara: 'la'
    }
  }
  password = [{
    test: {
      rest: {
        lest: 'best'
      }
    },
    arr: [1, 2]
  }, 'asdvsdv', 'abasbd', 'absbasd']

  option = null

  shallowObj = {
    prop: 1,
    prop2: {
      prop3: 3
    }
  }

  observables = {
    reactiveVar: computed,

    string: observable,
    number: observable,
    boolean: observable,

    array: observable,
    arraySplice: observable,
    arrayUnshift: observable,
    arrayPop: observable,
    arrayShift: observable,

    arrayNested: observable,
    arrayNestedSplice: observable,
    arrayNestedUnshift: observable,
    arrayNestedPop: observable,
    arrayNestedShift: observable,

    arrayReassign: observable,

    object: observable,
    objectUpdate: observable,
    objectDelete: observable,

    objectNested: observable,
    objectNestedUpdate: observable,
    objectNestedDelete: observable,

    objectReassign: observable,

    _getterObject: observable,
    getterObject: computed,

    _getterArray: observable,
    getterArray: computed,

    _getterNestedArray: observable,
    getterNestedArray: computed,

    _getterNestedObject: observable,
    getterNestedObject: computed,

    shallowObj: observable.shallow,

    mapObject: observable,
    setObject: observable,
    mapObjectVisual: observable,
    setObjectVisual: observable,

    email: observable,
    password: observable,
    password2: observable,
    option: observable,
    reset: action,


    awesome: computed,

    viewTest: computed,
    viewTest2: computed,

    _awesome: observable,

    hugeArray: observable,

    observableClass: observable,
    // derivedState: computed
  }

  // Primitives
  string = 'string'
  number = 1
  boolean = true

  // Arrays
  array = []
  arraySplice = [1, 3, 5]
  arrayUnshift = [1, 2]
  arrayPop = [1, 2]
  arrayShift = [1, 2]

  arrayNested = [[[]]]
  arrayNestedSplice = [[[1, 3, 5]]]
  arrayNestedUnshift = [[[1, 2]]]
  arrayNestedPop = [[[1, 2]]]
  arrayNestedShift = [[[1, 2]]]

  arrayReassign = [{ prop: 1 }]

  // Objects
  object = {}
  objectUpdate = { prop: 1 }
  objectDelete = { prop: 1 }

  objectNested = { nest: { nest: {} } }
  objectNestedUpdate = { nest: { nest: { prop: 1 } } }
  objectNestedDelete = { nest: { nest: { prop: 1 } } }


  objectReassign = { prop: { prop: 1 } }

  _getterArray = []
  _getterNestedArray = [{ prop: 1, prop2: 2, prop3: { prop: 1 } }]

  _getterObject = {}
  _getterNestedObject = {
    prop: 1,
    prop2: 2,
    prop3: { prop: 1, prop2: 2 }
  }

  hugeArray = []

  mapObject = new Map()
  setObject = new Set()

  mapObjectVisual = new Map([[2,200]])
  setObjectVisual = new Set([1])

  get getterArray () {
    return this._getterArray.map(el => {
      return { prop: el.prop, prop2: el.prop2 }
    })
  }

  set getterArray (value) {
    this._getterArray = value
  }

  get getterNestedArray () {
    return this._getterNestedArray.map(el => {
      return { prop: el.prop, prop2: el.prop2, prop3: el.prop3 }
    })
  }

  set getterNestedArray (value) {
    this._getterNestedArray = value
  }

  get getterObject () {
    return this._getterObject
  }

  get getterNestedObject () {
    return this._getterNestedObject
  }

  get vm () {

    const observables = {
      ...this.observables,
      ...this.messagesObservables
    }

    return useMobX(this, observables)
  }

  alertState() {
    alert(this.vm.hugeArray[20].struct.user)
  }

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

    makeObservable(this, this.observables)
    this.init()
  }

  get viewTest () {
    console.log('viewTest getter')
    const res = this.authRepo.testVariable.filter(el => true)
    console.log(res)
    return res;
  }

  //
  // set viewTest (value) {
  //   // console.log('this!', this)
  //   console.log('viewTest setting....')
  //   this.authRepo.testVariable = value
  //   this.authRepo.testVariable = notify(this.authRepo.testVariable)
  // }


  get viewTest2 () {
    return this.authRepo.testVariable2
  }

  setAuthRepoTest () {
    // this.authRepo.testVariable[0].test1 = 'test22'
    this.authRepo.testVariable.push(
      { test1: 'test1!', test2: 'test1!', sub: { test: 'yes' } }
    )
  }

  _awesome = 0

  _awesome = {
    a: {
      b: {
        c: 0
      }
    }
  }


  get awesome () {
    return this._awesome
  }

  set awesome (value) {
    console.log('set awesome')
    this._awesome = value
  }

  setAuthRepoArrayKey () {
    console.log('this.authRepo.testVariable[0]', this.authRepo.testVariable[0])

    this.authRepo.testVariable[0].sub.test = 'aaaaaaaaaaa';
    this.authRepo.testVariable[0].sub.rest = 'aaaaaaaaaaa';

    this.authRepo.testVariable[0]
      = notify(this.authRepo.testVariable[0])
  }

  setInjectableObservableSubProperties () {
    console.log('this.authRepo.testVariable2', this.authRepo.testVariable2)
    this.authRepo.testVariable2.awesome.super = 'test'
    this.authRepo.testVariable2.awesome.duper = 'test'

    this.authRepo.testVariable2
      = notify(this.authRepo.testVariable2)
  }

  setObjectSubProperty () {
    delete this.password[0].test.rest.lest
  }

  addObjectSubProperty () {
    this.password[0].test.bla = true
  }
  addObjectProperty () {
    this.password2.test= true
    this.password2.test2= true
    this.password2.test2= true
  }

  deleteSubObjectProperty () {
    delete this.password2.ba.sasa
  }

  setSpliceArrayProperty () {
    this.password.splice(1, 1, 'test')
  }

  setSubProperty() {
    this.password2.alala = 2
  }

  setProperty() {
    this.password2 = { haha: true}
    console.log('this.password2', this.password2)
  }

  setPushArrayItem () {
    this.password.push('testing push')
  }

  setPushSubObjectArrayItem () {
    // this.password[0].arr.splice(this.password[0].arr.length, 0, ['array', 'list'])
    this.password[0].arr.push(['array', 'list'])
  }

  setViewTestViaMethod () {
    this.viewTest = [{ test1: 'aloha', sub: { test: 'mmmmmm' } }]
  }
  reset () {
    this.email = 'test@test.ca'
    // this.password = ''
    this.option = 'login'
  }


}

