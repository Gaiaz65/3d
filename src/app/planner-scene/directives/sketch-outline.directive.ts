import {
  Directive,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  effect,
  untracked,
} from '@angular/core';
import * as THREE from 'three';
import {injectStore, beforeRender} from 'angular-three';

// ── Constants ───────────────────────────────────────────────────────────────

/**
 * userData key used to mark THREE.LineSegments objects created by this directive.
 * Prevents double-outline and exclusion from raycasting / AABB utils.
 */
export const SKETCH_OUTLINE_MARKER = 'isSketchOutline' as const;

// ── Types ───────────────────────────────────────────────────────────────────

/** Per-mesh entry stored in the directive's internal Map. */
interface OutlineEntry {
  readonly lines: THREE.LineSegments;
  /**
   * UUID of the source geometry at creation time.
   * Compared on each rebuild to detect geometry swaps without recomputing
   * EdgesGeometry unnecessarily.
   */
  readonly geometryUuid: string;
}

// ── Directive ───────────────────────────────────────────────────────────────

/**
 * SketchOutlineDirective
 *
 * Adds an `EdgesGeometry`-based sketch outline to any THREE.Object3D host:
 * `ngt-group`, `ngt-mesh`, `ngt-primitive` (GLTF scenes), nested groups.
 *
 * Architecture:
 *  - One shared `LineBasicMaterial` — updated reactively, never re-created.
 *  - `outlineMap` is the single source of truth for all cleanup.
 *  - Per-mesh geometry UUID cache avoids redundant `EdgesGeometry` recomputation.
 *  - Outline objects are marked with `userData[SKETCH_OUTLINE_MARKER]` so
 *    raycasting, AABB utilities, and collision services skip them automatically.
 *  - All THREE.js mutations run outside Angular zone for performance.
 *
 * Usage:
 *  <ngt-group   sketchOutline [outlineColor]="0x1a1a1a" [enabled]="show()" />
 *  <ngt-mesh    sketchOutline [outlineThresholdAngle]="20" />
 *  <ngt-primitive *args="[gltf.scene]" sketchOutline />
 */
@Directive({
  selector: '[sketchOutline]',
  standalone: true,
  exportAs: 'sketchOutline',
})
export class SketchOutlineDirective implements OnDestroy {
  // ── Inputs ─────────────────────────────────────────────────────────────────

  /** Edge line color. Accepts any THREE.ColorRepresentation. Default: near-black. */
  readonly outlineColor = input<THREE.ColorRepresentation>(0x1a1a1a);

  /**
   * Opacity of the outline lines [0..1].
   * Values < 1 automatically set `transparent = true` on the material.
   */
  readonly outlineOpacity = input<number>(1.0);

  /**
   * Threshold angle in degrees for edge detection.
   * Lower → more edges (soft creases visible).
   * Higher → only sharp edges.
   * Default: 15°.
   */
  readonly outlineThresholdAngle = input<number>(15);

  /**
   * Uniform scale applied to each LineSegments object.
   * Slightly > 1.0 keeps lines visually outside the mesh surface (z-fight fix).
   * Default: 1.001.
   */
  readonly outlineScale = input<number>(1.001);

  /** Toggle outline without disposing geometry. Default: true. */
  readonly enabled = input<boolean>(true);

  // ── Internal: pending retry ─────────────────────────────────────────────────

  /**
   * Set of meshes whose geometry wasn't ready on first traversal.
   * Checked each frame until all are resolved.
   */
  private pendingMeshes = new Set<THREE.Mesh>();

  // ── DI ─────────────────────────────────────────────────────────────────────

  private readonly host   = inject<ElementRef<THREE.Object3D>>(ElementRef);
  private readonly store  = injectStore();
  private readonly ngZone = inject(NgZone);

  // ── Internal state ──────────────────────────────────────────────────────────

  private readonly root: THREE.Object3D;

  /**
   * Map<mesh → {lines, geometryUuid}>
   * Single source of truth for cleanup. Never mutated outside
   * `buildOutlines()` and `disposeEntry()`.
   */
  private readonly outlineMap = new Map<THREE.Mesh, OutlineEntry>();

  /**
   * Shared material — one instance for all outlines in this directive.
   * Dispose only in `ngOnDestroy`, never per-entry.
   */
  private readonly material: THREE.LineBasicMaterial;

  // ── Constructor ─────────────────────────────────────────────────────────────

  constructor() {
    this.root = this.host.nativeElement;

    // Created once — properties synced reactively via `syncMaterial()`.
    this.material = new THREE.LineBasicMaterial({
      depthTest:  false, // visible through mesh faces
      toneMapped: false, // preserves exact color regardless of renderer tone mapping
    });

    /**
     * Reactive update loop.
     * Runs after construction (first CD cycle) and on every input change.
     * Reads all inputs as reactive signals → Angular tracks them automatically.
     */
    effect(() => {
      const enabled   = this.enabled();
      const color     = this.outlineColor();
      const opacity   = this.outlineOpacity();
      const threshold = this.outlineThresholdAngle();
      const scale     = this.outlineScale();

      // All THREE.js mutations outside Angular zone.
      this.ngZone.runOutsideAngular(() => {
        this.syncMaterial(color, opacity);

        if (enabled) {
          this.buildOutlines(threshold, scale);
        } else {
          this.removeAllOutlines();
        }

        // `store()` is a signal — read it outside the effect's tracking context
        // to prevent the effect from re-running on store changes.
        untracked(() => this.store().invalidate());
      });
    });

    // Retry pending meshes whose geometry wasn't ready on first traversal.
    // Stops checking as soon as pendingMeshes is empty.
    beforeRender(() => {
      if (this.pendingMeshes.size === 0 || !this.enabled()) return;

      let resolved = false;
      for (const mesh of this.pendingMeshes) {
        const positionAttr = mesh.geometry?.attributes['position'];
        if (!positionAttr || positionAttr.count === 0) continue;

        const lines = this.createLines(
          mesh.geometry,
          this.outlineThresholdAngle(),
          this.outlineScale(),
        );
        mesh.add(lines);
        this.outlineMap.set(mesh, {lines, geometryUuid: mesh.geometry.uuid});
        this.pendingMeshes.delete(mesh);
        resolved = true;
      }

      if (resolved) this.store().invalidate();
    });
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Force-rebuild all outline segments.
   *
   * Call after:
   *  - Programmatically swapping `mesh.geometry`
   *  - Adding children to the host group at runtime
   *  - GLTF scenes that populate asynchronously after initial render
   */
  rebuild(): void {
    this.ngZone.runOutsideAngular(() => {
      this.removeAllOutlines();
      if (this.enabled()) {
        this.buildOutlines(this.outlineThresholdAngle(), this.outlineScale());
      }
      this.store().invalidate();
    });
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnDestroy(): void {
    this.removeAllOutlines();
    this.material.dispose();
  }

  // ── Material ────────────────────────────────────────────────────────────────

  private syncMaterial(
    color:   THREE.ColorRepresentation,
    opacity: number,
  ): void {
    this.material.color.set(color);
    this.material.opacity     = opacity;
    this.material.transparent = opacity < 1;
    this.material.needsUpdate = true;
  }

  // ── Outline building ────────────────────────────────────────────────────────

  /**
   * Traverse host subtree → create/update/prune LineSegments for each Mesh.
   *
   * Cheap path  (geometry unchanged): only scale is synced — O(1) per mesh.
   * Expensive path (geometry swapped): stale entry disposed, new one created.
   * Prune path  (mesh left subtree):  entry disposed after traversal.
   */
  private buildOutlines(thresholdAngle: number, scale: number): void {
    const visited = new Set<THREE.Mesh>();

    this.root.traverse((child) => {
      // Only process Mesh instances.
      if (!(child instanceof THREE.Mesh)) return;

      // InstancedMesh is a Mesh subclass but outlines per-instance
      // are not supported — skip to avoid misleading single-mesh outline.
      if (child instanceof THREE.InstancedMesh) return;

      // Skip outline objects created by this directive (prevent recursion).
      if (child.userData[SKETCH_OUTLINE_MARKER] === true) return;

      // Skip meshes without geometry (SkinnedMesh before bone binding, etc.).
      if (!child.geometry) return;

      // Skip geometries whose position attribute isn't ready yet.
      // Happens when the directive effect runs before angular-three finishes
      // populating BufferGeometry attributes (first render race condition).
      const positionAttr = child.geometry.attributes['position'];
      if (!positionAttr || positionAttr.count === 0) {
        this.pendingMeshes.add(child);
        return;
      }

      visited.add(child);

      const geometryUuid = child.geometry.uuid;
      const existing     = this.outlineMap.get(child);

      if (existing) {
        if (existing.geometryUuid === geometryUuid) {
          // ── Cheap path: geometry unchanged, sync scale only ──
          if (existing.lines.scale.x !== scale) {
            existing.lines.scale.setScalar(scale);
          }
          return;
        }
        // ── Geometry swapped: dispose stale entry before re-creating ──
        this.disposeEntry(child, existing);
      }

      // ── Create new outline for this mesh ──
      const lines = this.createLines(child.geometry, thresholdAngle, scale);
      child.add(lines);
      this.outlineMap.set(child, {lines, geometryUuid});
    });

    // Prune outlines whose parent meshes left the subtree.
    for (const [mesh, entry] of this.outlineMap) {
      if (!visited.has(mesh)) {
        this.disposeEntry(mesh, entry);
      }
    }
  }

  // ── LineSegments factory ────────────────────────────────────────────────────

  private createLines(
    sourceGeometry: THREE.BufferGeometry,
    thresholdAngle: number,
    scale:          number,
  ): THREE.LineSegments {
    const edgesGeo = new THREE.EdgesGeometry(sourceGeometry, thresholdAngle);
    const lines    = new THREE.LineSegments(edgesGeo, this.material);

    // Mark as outline so raycasters, AABB utils, and collision services skip it.
    lines.userData[SKETCH_OUTLINE_MARKER] = true;

    // Render after all opaque geometry (consistent with SelectionBox / Ghost).
    lines.renderOrder = 999;

    // Slight scale moves lines just outside the mesh surface — avoids z-fighting
    // without needing polygon offset (which is unreliable across drivers).
    lines.scale.setScalar(scale);

    // Outline lines must never intercept pointer or raycaster events.
    lines.raycast = SketchOutlineDirective.noopRaycast;

    return lines;
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  private removeAllOutlines(): void {
    for (const [mesh, entry] of this.outlineMap) {
      this.disposeEntry(mesh, entry);
    }
    this.pendingMeshes.clear();
  }

  /**
   * Detach + dispose one outline entry.
   * The shared material is intentionally NOT disposed here — only in ngOnDestroy.
   */
  private disposeEntry(mesh: THREE.Mesh, entry: OutlineEntry): void {
    mesh.remove(entry.lines);
    entry.lines.geometry.dispose();
    this.outlineMap.delete(mesh);
  }

  // ── Static helpers ──────────────────────────────────────────────────────────

  /**
   * Typed no-op raycast replacement.
   * THREE.Raycaster calls `object.raycast(raycaster, intersects)` — replacing
   * with this function silently skips the object without affecting other geometry.
   * Strictly typed to avoid `any`.
   */
  private static noopRaycast(
    _raycaster:  THREE.Raycaster,
    _intersects: THREE.Intersection[],
  ): void {}
}
