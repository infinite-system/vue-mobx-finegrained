import { injectable } from 'inversify'
import { makeObservable, observable } from 'mobx'

@injectable()
export class UserModel {

  email = null
  token = null

  get upperCaseEmail () {
    return String(this.email).toUpperCase()
  }

  get dashedUppercaseEmail () {
    return this.upperCaseEmail.split('')
  }

  constructor () {}
}
