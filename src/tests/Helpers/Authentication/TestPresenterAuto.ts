import { inject, injectable } from 'inversify'
import { action, makeObservable, observable, computed, comparer, makeAutoObservable } from 'mobx'
import { AuthenticationRepository } from './AuthenticationRepository'
import { MessagesPresenter } from '../Core/Messages/MessagesPresenter'
import { MessagesRepository } from '../Core/Messages/MessagesRepository'
import { Router } from '../Routing/Router'
import { useMobX, notify } from '@/useMobX';
import { isReactive, watch } from "vue";

@injectable()
class Test {
  test = 1
}
@injectable()
export class TestPresenterAuto {

  nonObservablePrimitive = 1

  nonObservableObject = {
    prop: {
      prop: {
        prop: 1
      }
    }
  }

  object

  @inject(Test) test: Test

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


  string = 'string'
  number = 1
  boolean = true

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

  object = {}
  objectUpdate = { prop: 1 }
  objectDelete = { prop: 1 }

  objectNested = { nest: { nest: {} } }
  objectNestedUpdate = { nest: { nest: { prop: 1 } } }
  objectNestedDelete = { nest: { nest: { prop: 1 } } }

  arrayReassign = [{ prop: 1 }]
  objectReassign = { prop: { prop: 1 } }

  _getterArray = []
  _getterNestedArray = [{ prop: 1, prop2: 2, prop3: { prop: 1 } }]

  _getterObject = {}
  _getterNestedObject = {
    prop: 1,
    prop2: 2,
    prop3: { prop: 1, prop2: 2 }
  }

  mapObject = new Map()
  setObject = new Set()

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



  observable = {
    observable: false,
    nonObservableObject: false,
    nonObservablePrimitive: false,
    customObservable: false,
    getterObject: computed,
    messagesRepository: false,
    router: false,
    authRepo: false,
    vm: false,
  }

  constructor () {
    // super()

    const observables = {
      // ...this.observables
    }
    makeAutoObservable(this, this.observable)
    this.reset()
  }

  get vm () {
    return useMobX(this, this.observable, { auto: true })
  }


  get viewTest () {
    return this.authRepo.testVariable.map(pm => {
      return { test1: pm.test1 + '(mapped)', sub: pm.sub, test2: pm.test2 + '(mapped)' }
    })
  }

  get viewTest2 () {
    return this.authRepo.testVariable2
  }

  set viewTest (value) {
    this.authRepo.testVariable = value
  }

  setAuthRepoTest () {
    this.authRepo.testVariable.push(
      { test1: 'test1!', test2: 'test1!', sub: { test: 'yes' } }
    )
  }

  _awesome = 0


  //
  set viewTest (value) {
    console.log('this!', this)
    this.authRepo.testVariable = value
  }

  setAuthRepoTest () {
    this.authRepo.testVariable.push(
      { test1: 'test1!', test2: 'test1!', sub: { test: 'yes' } }
    )
  }

  _awesome = 0

  get awesome () {
    return this._awesome
  }

  set awesome (value) {
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

  async login () {
    const loginPm = await this.authRepo.login(this.email, this.password)

    console.log('this', this)
    this.unpackRepositoryPmToVm(loginPm, 'User logged in')

    if (loginPm.success) {
      this.router.goToId('homeLink')
    }
  }

  async register () {
    const registerPm = await this.authRepo.register(this.email, this.password)

    console.log('this', this)
    this.unpackRepositoryPmToVm(registerPm, 'User registered')
  }

  async logOut () {
    this.authRepo.logOut()
    this.router.goToId('loginLink')
  }

  formValid () {
    const clientValidationMessages = []

    if (this.email === '') clientValidationMessages.push('No email')
    if (this.password === '') clientValidationMessages.push('No password')

    this.messagesRepository.clientMessages = clientValidationMessages

    return clientValidationMessages.length === 0
  }

  #testFunct () {

  }

  watchSomething = () => {
    console.log(this.vm.objectReassign, isReactive(this.vm.objectReassign))
    // console.log('this.vm',  this.vm)
    watch(this.vm.objectReassign, newValue => {
      console.log('watching...')
    }, { deep: true })
  }


  doArrayReassign () {
    console.log('doArrayReassign', this.arrayReassign[0].newProp)
  }
}

