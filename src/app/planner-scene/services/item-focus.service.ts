import {Injectable, signal} from '@angular/core';

@Injectable({providedIn: 'root'})
export class ItemFocusService {
  readonly focusedItemId = signal<number | null>(null);
  readonly screenPosition = signal<{ x: number; y: number } | null>(null);
  readonly isDragging = signal(false);
  readonly copyRequest = signal<number | null>(null);
  readonly rotationRequest = signal<{ id: number; rotation: number } | null>(null);
  readonly rotationResult = signal<'approved' | 'rejected' | null>(null);

  setFocus(id: number, pos: { x: number; y: number }): void {
    this.focusedItemId.set(id);
    this.screenPosition.set(pos);
  }

  updatePosition(pos: { x: number; y: number }): void {
    this.screenPosition.set(pos);
  }

  setDragging(value: boolean): void {
    this.isDragging.set(value);
  }

  requestCopy(id: number): void {
    this.copyRequest.set(id);
  }

  requestRotation(id: number, rotation: number): void {
    this.rotationResult.set(null);
    this.rotationRequest.set({id, rotation});
  }

  clearFocus(): void {
    this.focusedItemId.set(null);
    this.screenPosition.set(null);
    this.isDragging.set(false);
  }
}
