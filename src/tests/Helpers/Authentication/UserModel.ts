import { injectable } from 'inversify'
import { makeObservable, observable } from 'mobx'

@injectable()
export class UserModel {

  email = null
  token = null

  upperCaseEmail = ''

  get _upperCaseEmail () {
    return String(this.email).toUpperCase()
  }

  dashedUppercaseEmail = ''

  get _dashedUppercaseEmail () {
    return this.upperCaseEmail.split('')
  }

  constructor () {}
}
