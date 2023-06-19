import { inject, injectable } from 'inversify'
import { action, makeObservable, observable, reaction } from 'mobx'
import { Types } from '../Core/Types'
import { Router } from '../Routing/Router'
import { UserModel } from './UserModel'
import { MessagePacking } from '../Core/Messages/MessagePacking'
import { RouterGateway } from "../Routing/RouterGateway";
import { useMobX } from "@/useMobX";

@injectable()
export class AuthenticationRepository {

  @inject(Router) router: Router

  @inject(Types.IDataGateway) dataGateway: RouterGateway

  @inject(UserModel) userModel: UserModel

  testVariable = []
  testVariable2 = {
    awesome: {
      super: 'yes'
    }
  }

  observables = {
    login: action,
    testVariable: observable,
    testVariable2: observable
  }

  constructor() {
    makeObservable(this, this.observables)
    // useMobX(this, this.observables)
  }

  async login (email, password) {
    const loginDto = await this.dataGateway.post('/login', {
      email,
      password,
    })

    if (loginDto.success) {
      this.userModel.email = email
      this.userModel.token = loginDto.result.token
    }

    return MessagePacking.unpackServerDtoToPm(loginDto)
  }

  async register (email, password) {
    const registerDto = await this.dataGateway.post('/register', {
      email,
      password,
    })

    return MessagePacking.unpackServerDtoToPm(registerDto)
  }

  async logOut () {
    this.userModel.email = ''
    this.userModel.token = ''
  }
}
