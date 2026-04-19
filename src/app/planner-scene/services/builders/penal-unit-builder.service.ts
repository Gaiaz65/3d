import {inject, Injectable} from '@angular/core';
import {IUnitBuilderStrategy} from '../../interfaces/unit-builder.interface';
import {ResolvedUnit} from '../../interfaces/unit-config.models';
import {UnitBuildHelpers} from '../unit-build-helpers.service';

/**
 * Пеналы: высокие напольные шкафы.
 * Есть ножки и полки, нет цоколей и столешниц.
 */
@Injectable({ providedIn: 'root' })
export class PenalUnitBuilderService implements IUnitBuilderStrategy {
  private readonly h = inject(UnitBuildHelpers);

  build(config: any): ResolvedUnit {
    const groups = this.h.parseGroups(config.options);
    const { corpus, sizes, sideType, className } = groups;

    const corpusWidth = config.selectedWidth ?? corpus.width;
    const legHeight   = this.h.resolveLegHeight(groups.legs);

    return {
      uid:               config.uid,
      level:             config.level,
      className,
      size:              { x: this.h.helper.toM(corpusWidth), y: this.h.helper.toM(sizes.height), z: this.h.helper.toM(sizes.depth) },
      corpusSize:        { x: this.h.helper.toM(corpusWidth), y: this.h.helper.toM(corpus.height), z: this.h.helper.toM(corpus.depth) },
      corpusCatalogCode: corpus.catalogCode,
      availableWidths:   corpus.availableWidths,
      panels:    this.h.buildPanels(corpusWidth, corpus.height, corpus.depth, corpus.thickness, corpus.backThickness, {legHeight}),
      facades:   this.h.buildFacades(groups.facades, corpusWidth, corpus.height, corpus.depth, legHeight, sideType),
      legs:      this.h.buildLegs(groups.legs, corpusWidth, corpus.depth),
      shelves:   this.h.buildShelves(groups.shelves, corpusWidth, corpus.depth, corpus.height, corpus.thickness, corpus.backThickness, legHeight),
      rods:      this.h.buildRods(groups.rods, corpusWidth, corpus.depth, corpus.height, legHeight),
      plinths:   [],
      tabletops: [],
    };
  }
}
