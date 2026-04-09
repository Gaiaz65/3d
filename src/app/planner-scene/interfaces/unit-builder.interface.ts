import {ResolvedUnit} from './unit-config.models';

export interface IUnitBuilderStrategy {
  build(config: any): ResolvedUnit;
}
