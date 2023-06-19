import { RouterGateway } from './Routing/RouterGateway'
import { HttpGateway } from './Core/HttpGateway'
import { Types } from './Core/Types'
import { BaseIOC } from './BaseIOC'

export const container = new BaseIOC().buildBaseTemplate()

container.bind(Types.IDataGateway).to(HttpGateway).inSingletonScope()
container.bind(Types.IRouterGateway).to(RouterGateway).inSingletonScope()
