import { inject, injectable } from 'inversify'
import getDecorators from 'inversify-inject-decorators';
import { makeObservable, observable } from 'mobx'
import { container, lazyInject } from '@/tests/Helpers/Container.ts'
import { AppPresenter } from "@/tests/Helpers/AppPresenter.js";
import { Types } from "@/tests/Helpers/Core/Types.js";
// const { lazyInject } = getDecorators(container, false);
@injectable()
export class UserModel {

  @lazyInject(Types.IAppPresenter) app: AppPresenter

  // get app() {
  //   return () => container.get(AppPresenter)
  // }

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
