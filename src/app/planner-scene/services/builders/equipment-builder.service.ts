import {inject, Injectable} from '@angular/core';
import {IUnitBuilderStrategy} from '../../interfaces/unit-builder.interface';
import {ResolvedUnit} from '../../interfaces/unit-config.models';
import {BottomUnitBuilderService} from './bottom-unit-builder.service';

/**
 * Техника и встраиваемое оборудование.
 * Пока делегирует к BottomUnitBuilderService.
 * Расширяется по мере появления специфичной геометрии (вырезы, крепления и т.д.).
 */
@Injectable({ providedIn: 'root' })
export class EquipmentBuilderService implements IUnitBuilderStrategy {
  private readonly bottom = inject(BottomUnitBuilderService);

  build(config: any): ResolvedUnit {
    return this.bottom.build(config);
  }
}
