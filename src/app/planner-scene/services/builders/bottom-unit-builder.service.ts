import {inject, Injectable} from '@angular/core';
import {IUnitBuilderStrategy} from '../../interfaces/unit-builder.interface';
import {ResolvedPanel, ResolvedUnit} from '../../interfaces/unit-config.models';
import {UnitBuildHelpers} from '../unit-build-helpers.service';
import {GROUP_BOTTOM_ANGLE_UNITS} from '../../constants';

/**
 * Нижние тумбы: normal, angle, end.
 * Полный пайплайн — корпус, фасады, ножки, полки, штанги, цоколи, столешница.
 */
@Injectable({ providedIn: 'root' })
export class BottomUnitBuilderService implements IUnitBuilderStrategy {
  private readonly helper = inject(UnitBuildHelpers);

  build(config: any): ResolvedUnit {
    const legLess = ['N_SM'];
    const groups = this.helper.parseGroups(config.options);
    const { corpus, sizes, sideType, className } = groups;

    // selectedWidth используется только для фасадов; панели корпуса строятся по corpus.width из options
    const facadeWidth = config.selectedWidth ?? corpus.width;
    console.log(groups.legs, corpus, config)
    const legHeight   = legLess.includes(corpus.catalogCode) ?0 :this.helper.resolveLegHeight(groups.legs, corpus.bottomGap);
    const isAngle     = config.sectionId === GROUP_BOTTOM_ANGLE_UNITS;

    const facades = isAngle
      ? this.normalizeFacadesForAngle(groups.facades)
      : groups.facades;

    const panels = this.helper.buildPanels(corpus.width, corpus.height, corpus.depth, corpus.thickness, corpus.backThickness, legHeight, corpus.catalogCode);
    if (corpus.frontPanel) {
      panels.push(...this.buildFrontPanel(corpus.frontPanel.length, corpus.width, corpus.height, corpus.thickness, legHeight, sideType));
    }

    return {
      uid:               config.uid,
      level:             config.level,
      className,
      size:              { x: this.helper.helper.toM(facadeWidth), y: this.helper.helper.toM(sizes.height), z: this.helper.helper.toM(sizes.depth) },
      corpusSize:        { x: this.helper.helper.toM(corpus.width), y: this.helper.helper.toM(corpus.height), z: this.helper.helper.toM(corpus.depth) },
      corpusCatalogCode: corpus.catalogCode,
      availableWidths:   corpus.availableWidths,
      panels,
      facades:    this.helper.buildFacades(facades, facadeWidth, corpus.height, corpus.depth, legHeight, sideType),
      legs:       this.helper.buildLegs(groups.legs, corpus.width, corpus.depth),
      shelves:    this.helper.buildShelves(groups.shelves, corpus.width, corpus.depth, corpus.height, corpus.thickness, corpus.backThickness, legHeight),
      rods:       this.helper.buildRods(groups.rods, corpus.width, corpus.depth, corpus.height, legHeight),
      plinths:    this.helper.buildPlinths(groups.plinths, corpus.width, corpus.depth, legHeight),
      tabletops:  this.helper.buildTabletops(groups.tabletops, corpus.width, corpus.depth, corpus.height, legHeight),
    };
  }

  /**
   * Передняя панель угловой тумбы — закрывает переднюю грань со стороны,
   * противоположной основному фасаду.
   *
   * sideType 'left'  → фасад справа, передняя панель слева (x отрицательный)
   * sideType 'right' → фасад слева,  передняя панель справа (x положительный)
   */
  private buildFrontPanel(
    length: number,
    corpusWidth: number,
    corpusHeight: number,
    thickness: number,
    legHeight: number,
    sideType: string,
  ): ResolvedPanel[] {
    const m    = (v: number) => this.helper.helper.toM(v);
    const sign = sideType === 'right' ? 1 : -1;
    const x    = sign * (corpusWidth / 2 - length / 2);
    const y    = legHeight + corpusHeight / 2;
    const z    = -thickness / 2;

    return [{
      name:     'front',
      size:     { x: m(length), y: m(corpusHeight), z: m(thickness) },
      position: { x: m(x), y: m(y), z: m(z) },
    }];
  }

  /**
   * Для нижних угловых тумб временно игнорируем:
   * - reverseSideType   — логика зеркалирования фасада по sideType не применяется
   * - notCheckOfferModelType — каталожный флаг, не влияет на геометрию
   *
   * TODO: реализовать полноценную угловую раскладку фасадов.
   */
  private normalizeFacadesForAngle(facades: any[]): any[] {
    return facades.map(({ reverseSideType: _, notCheckOfferModelType: __, ...rest }) => rest);
  }
}
