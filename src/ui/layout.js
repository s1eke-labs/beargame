// 让可交互区域与实际可见布局一致，并给瞬时消息留出资源栏空间。
export function syncPresentationLayout(app, ui, viewportWidth = globalThis.innerWidth) {
  const managing = !['home', 'map'].includes(ui.page);
  const hiddenWorld = managing && (viewportWidth < 1000 || ui.managementMapCollapsed);
  const world = app.querySelector('.world-board');
  if (world) {
    world.inert = !!hiddenWorld;
    if (hiddenWorld) world.setAttribute('aria-hidden', 'true');
    else world.removeAttribute('aria-hidden');
    if (hiddenWorld && world.contains(app.ownerDocument?.activeElement)) {
      app.querySelector('#main-content')?.focus({preventScroll:true});
    }
  }
  const homeControls = app.querySelector('.home-controls');
  if (homeControls) homeControls.inert = managing;
  const hud = app.querySelector('#resource-bar');
  const bottom = hud?.getBoundingClientRect?.().bottom;
  if (Number.isFinite(bottom)) {
    app.ownerDocument?.documentElement?.style?.setProperty('--hud-bottom', `${Math.ceil(bottom)}px`);
  }
}
