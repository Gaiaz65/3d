import {inject, Injectable} from '@angular/core';
import {ResolvedUnit, UnitConfig} from '../interfaces/unit-config.models';
import {IUnitBuilderStrategy} from '../interfaces/unit-builder.interface';
import {BottomUnitBuilderService} from './builders/bottom-unit-builder.service';
import {TopUnitBuilderService} from './builders/top-unit-builder.service';
import {PenalUnitBuilderService} from './builders/penal-unit-builder.service';
import {EquipmentBuilderService} from './builders/equipment-builder.service';
import {AccessoryBuilderService} from './builders/accessory-builder.service';
import {
  GROUP_ACCESSORIES,
  GROUP_BOTTOM_ANGLE_UNITS, GROUP_BOTTOM_CONSTRUCTIVE, GROUP_BOTTOM_END_UNITS,
  GROUP_BOTTOM_NORMAL_UNITS,
  GROUP_BUILTIN_EQUIPMENTS,
  GROUP_DOBORY,
  GROUP_EQUIPMENTS,
  GROUP_FACADES,
  GROUP_PENAL_UNITS,
  GROUP_TOP_ANGLE_UNITS, GROUP_TOP_CONSTRUCTIVE,
  GROUP_TOP_END_UNITS,
  GROUP_TOP_NORMAL_UNITS,
  GROUP_TOP_VITRINA_UNITS,
} from '../constants';

/**
 * UnitBuilderService — диспетчер.
 *
 * Выбирает нужную стратегию построения по `config.sectionId`
 * и делегирует ей вызов `build()`.
 *
 * sectionId проставляется в конфиг при загрузке секций из init.json
 * (см. ConfigurationUtilObjects.ngOnInit).
 */
@Injectable({ providedIn: 'root' })
export class UnitBuilderService {
  private readonly bottom    = inject(BottomUnitBuilderService);
  private readonly top       = inject(TopUnitBuilderService);
  private readonly penal     = inject(PenalUnitBuilderService);
  private readonly equipment = inject(EquipmentBuilderService);
  private readonly accessory = inject(AccessoryBuilderService);

  private readonly strategyMap: Record<string, IUnitBuilderStrategy>;

  constructor() {
    this.strategyMap = {
      [GROUP_BOTTOM_NORMAL_UNITS]:   this.bottom,
      [GROUP_BOTTOM_ANGLE_UNITS]:    this.bottom,
      [GROUP_BOTTOM_END_UNITS]:      this.bottom,
      [GROUP_BOTTOM_CONSTRUCTIVE]:   this.bottom,

      [GROUP_TOP_NORMAL_UNITS]:      this.top,
      [GROUP_TOP_ANGLE_UNITS]:       this.top,
      [GROUP_TOP_VITRINA_UNITS]:     this.top,
      [GROUP_TOP_END_UNITS]:         this.top,
      [GROUP_TOP_CONSTRUCTIVE]:      this.top,

      [GROUP_PENAL_UNITS]:           this.penal,

      [GROUP_EQUIPMENTS]:            this.equipment,
      [GROUP_BUILTIN_EQUIPMENTS]:    this.equipment,

      [GROUP_FACADES]:               this.accessory,
      [GROUP_DOBORY]:                this.accessory,
      [GROUP_ACCESSORIES]:           this.accessory,
    };
  }

  /**
   * Строит ResolvedUnit из каталожного конфига.
   *
   * @param config        Объект конфига из init.json (должен содержать `sectionId`)
   * @param selectedWidth Переопределяет ширину корпуса (мм)
   */
  build(config: UnitConfig & { sectionId?: string }, selectedWidth?: number): ResolvedUnit {
    const strategy = this.strategyMap[config.sectionId ?? ''] ?? this.bottom;
    return strategy.build(selectedWidth ? { ...config, selectedWidth } : config);
  }
}
