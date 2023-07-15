import { Container } from "inversify";
import getDecorators from "inversify-inject-decorators";

export const container = new Container({
  autoBindInjectable: true,
  defaultScope: 'Transient',
})

const { lazyInject:lazyInject_ } = getDecorators(container);
// console.log(lazyInject_)
export const lazyInject = lazyInject_