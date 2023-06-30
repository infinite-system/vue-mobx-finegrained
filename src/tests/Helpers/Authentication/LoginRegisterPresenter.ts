import { inject, injectable } from 'inversify'
import { action, makeObservable, observable, computed, comparer } from 'mobx'
import { AuthenticationRepository } from './AuthenticationRepository'
import { MessagesPresenter } from '../Core/Messages/MessagesPresenter'
import { MessagesRepository } from '../Core/Messages/MessagesRepository'
import { Router } from '../Routing/Router'
import { useMobX, notify } from '@/useMobX';
import { isReactive, watch } from "vue";

@injectable()
export class LoginRegisterPresenter extends MessagesPresenter {

  testNonObservable = 1

  testNonObservableObject = {
    prop: {
      prop: {
        prop: 1
      }
    }
  }

  object

  @inject(AuthenticationRepository) authenticationRepository: AuthenticationRepository

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


  observables = {
    _string: observable,
    _number: observable,
    _boolean: observable,
    _array: observable,
    _arraySplice: observable,
    _arrayUnshift: observable,
    _arrayPop: observable,
    _arrayShift: observable,

    _object: observable,
    _objectUpdate: observable,
    _objectDelete: observable,
    _nobject: observable,
    _nobjectUpdate: observable,
    _nobjectDelete: observable,

    _arrayReassign: observable,
    _objectReassign: observable,

    _getterArray: observable,
    getterArray: computed,

    _getterNestedArray: observable,
    getterNestedArray: computed,

    _getterNestedObject: observable,
    getterNestedObject: computed,

    mapObject: observable,
    setObject: observable,

    email: observable,
    password: observable,
    password2: observable,
    option: observable,
    reset: action,
    login: action,
    register: action,
    // addObjectProperty: action,
    logOut: action,
    // setAuthRepoTest: action,
    awesome: computed,
    viewTest: computed,
    viewTest2: computed,
    _awesome: observable
  }
  _string = 'string'
  _number = 1
  _boolean = true

  _array = []
  _arraySplice = [1, 3, 5]
  _arrayUnshift = [1, 2]
  _arrayPop = [1, 2]
  _arrayShift = [1, 2]

  _narray = [[[]]]
  _narraySplice = [[[1, 3, 5]]]
  _narrayUnshift = [[[1, 2]]]
  _narrayPop = [[[1, 2]]]
  _narrayShift = [[[1, 2]]]

  _object = {}
  _objectUpdate = { prop: 1 }
  _objectDelete = { prop: 1 }

  _nobject = { nest: { nest: {} } }
  _nobjectUpdate = { nest: { nest: { prop: 1 } } }
  _nobjectDelete = { nest: { nest: { prop: 1 } } }

  _arrayReassign = [{ prop: 1 }]
  _objectReassign = { prop: { prop: 1 } }

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


  get vm () {

    const observables = {
      ...this.observables,
      ...this.messagesObservables
    }

    return useMobX(this, observables)
  }

  constructor () {
    super()
    makeObservable(this, this.observables)
    this.init()
  }

  get viewTest () {
    return this.authenticationRepository.testVariable.map(pm => {
      return { test1: pm.test1 + '(mapped)', sub: pm.sub, test2: pm.test2 + '(mapped)' }
    })
  }

  get viewTest2 () {
    return this.authenticationRepository.testVariable2
  }

  set viewTest (value) {
    this.authenticationRepository.testVariable = value
  }

  setAuthRepoTest () {
    this.authenticationRepository.testVariable.push(
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

  reset () {
    this.email = 'test@test.ca'
    // this.password = ''
    this.option = 'login'
  }

  async login () {
    const loginPm = await this.authenticationRepository.login(this.email, this.password)

    console.log('this', this)
    this.unpackRepositoryPmToVm(loginPm, 'User logged in')

    if (loginPm.success) {
      this.router.goToId('homeLink')
    }
  }

  async register () {
    const registerPm = await this.authenticationRepository.register(this.email, this.password)

    console.log('this', this)
    this.unpackRepositoryPmToVm(registerPm, 'User registered')
  }

  async logOut () {
    this.authenticationRepository.logOut()
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
    console.log(this.vm._objectReassign, isReactive(this.vm._objectReassign))
    // console.log('this.vm',  this.vm)
    watch(this.vm._objectReassign, newValue => {
      console.log('watching...')
    }, { deep: true })
  }


  doArrayReassign () {
    console.log('doArrayReassign', this._arrayReassign[0].newProp)
  }
}

