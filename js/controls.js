const CONTROL_ZOOM_STEP = 0.25;
const zoomInButton = document.getElementById("zoom-in");
const zoomOutButton = document.getElementById("zoom-out");
const zoomEventOptions = { capture: true, passive: false };

function swallowBrowserZoom(event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function useGameZoom(amount, event) {
  swallowBrowserZoom(event);
  changeZoom(amount);
}


["gesturestart", "gesturechange", "gestureend", "dblclick"].forEach((eventName) => {
  document.addEventListener(eventName, swallowBrowserZoom, zoomEventOptions);
});

let lastTouchEnd = 0;
document.addEventListener("touchend", (event) => {
  const now = Date.now();

  if (now - lastTouchEnd <= 320) {
    swallowBrowserZoom(event);
  }

  lastTouchEnd = now;
}, zoomEventOptions);
if (zoomInButton && zoomOutButton) {
  zoomInButton.addEventListener(
    "pointerdown",
    (event) => useGameZoom(CONTROL_ZOOM_STEP, event),
    zoomEventOptions
  );

  zoomOutButton.addEventListener(
    "pointerdown",
    (event) => useGameZoom(-CONTROL_ZOOM_STEP, event),
    zoomEventOptions
  );

  zoomInButton.addEventListener("click", swallowBrowserZoom, zoomEventOptions);
  zoomOutButton.addEventListener("click", swallowBrowserZoom, zoomEventOptions);
}

