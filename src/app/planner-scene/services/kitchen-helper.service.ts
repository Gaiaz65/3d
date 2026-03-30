import { Injectable } from '@angular/core';
import {SizeExpr} from '../interfaces/unit-config.models';

/**
 * Reproduces KitchenHelper from build.js.
 *
 * Resolves size expressions used in unit configs:
 *   - number   → returned as-is (mm)
 *   - "%N"     → N% of parentSize  (e.g. "%100" = parentSize, "%50" = parentSize/2)
 *   - "=(...)" → arithmetic formula; {%N} tokens are recursively resolved
 *
 * All inputs/outputs are in millimetres.
 */
@Injectable({ providedIn: 'root' })
export class KitchenHelperService {
  /**
   * Evaluate one size expression relative to its parent axis dimension.
   *
   * @param size       Raw value from config (number | string)
   * @param parentSize Dimension of the parent object on the same axis (mm)
   */
  calculateSizeByParent(size: SizeExpr, parentSize: number): number {
    if (typeof size === 'number') return size;

    const str = String(size).trim();
    if (!str) return 0;

    const operator = str[0];

    if (operator === '%') {
      // "%100" → 100% of parent, "%50" → half, etc.
      const pct = parseFloat(str.slice(1));
      return Math.round((pct * parentSize) / 100);
    }

    if (operator === '=') {
      // "=({%100}-50)" → resolve all {…} tokens then eval
      const formula = this.prepareSizeFormula(str.slice(1), parentSize);
      return this.safeEval(formula);
    }

    // Plain numeric string
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
  }

  /**
   * Replace every `{<expr>}` token in a formula string with its numeric value,
   * recursively applying calculateSizeByParent.
   */
  private prepareSizeFormula(template: string, parentSize: number): string {
    return template.replace(/\{([^}]*)\}/g, (_, inner: string) => {
      return String(this.calculateSizeByParent(inner.trim(), parentSize));
    });
  }

  /**
   * Arithmetic-only eval using Function constructor (no global access).
   */
  private safeEval(formula: string): number {
    try {
      // Allow only digits, operators, parens, dots, spaces
      if (!/^[\d\s+\-*/().]+$/.test(formula)) return 0;
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const result = new Function(`return (${formula})`)() as number;
      return isNaN(result) ? 0 : Math.round(result * 100) / 100;
    } catch {
      return 0;
    }
  }

  /** Convert millimetres → Three.js scene units (metres). */
  toM(mm: number): number {
    return mm / 1000;
  }
}
