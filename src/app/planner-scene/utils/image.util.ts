export function updateUrl($event: any): void {
  if ($event.target) {
    $event.target.src = 'assets/fallback-image.png'
  }
}
