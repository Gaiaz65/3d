import {inject, Injectable} from '@angular/core';
import {IUnitBuilderStrategy} from '../../interfaces/unit-builder.interface';
import {ResolvedUnit} from '../../interfaces/unit-config.models';
import {UnitBuildHelpers} from '../unit-build-helpers.service';

/**
 * Аксессуары, фасады, доборы.
 * Строит только корпус и фасады — без ножек, полок, цоколей.
 */
@Injectable({ providedIn: 'root' })
export class AccessoryBuilderService implements IUnitBuilderStrategy {
  private readonly h = inject(UnitBuildHelpers);

  build(config: any): ResolvedUnit {
    const groups = this.h.parseGroups(config.options);
    const { corpus, sizes, sideType, className } = groups;

    const corpusWidth = config.selectedWidth ?? corpus.width;

    return {
      uid:               config.uid,
      level:             config.level,
      className,
      size:              { x: this.h.helper.toM(corpusWidth), y: this.h.helper.toM(sizes.height), z: this.h.helper.toM(sizes.depth) },
      corpusSize:        { x: this.h.helper.toM(corpusWidth), y: this.h.helper.toM(corpus.height), z: this.h.helper.toM(corpus.depth) },
      corpusCatalogCode: corpus.catalogCode,
      availableWidths:   corpus.availableWidths,
      panels:    this.h.buildPanels(corpusWidth, corpus.height, corpus.depth, corpus.thickness, corpus.backThickness, 0),
      facades:   this.h.buildFacades(groups.facades, corpusWidth, corpus.height, corpus.depth, 0, sideType),
      legs:      [],
      shelves:   [],
      rods:      [],
      plinths:   [],
      tabletops: [],
    };
  }
}
