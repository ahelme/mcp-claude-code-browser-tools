// Create Browser Tools panel in DevTools
chrome.devtools.panels.create(
  "Browser Tools",
  "icons/icon16.png", // Optional icon
  "panel.html",
  (panel) => {
    console.log("Browser Tools panel created successfully");

    // Panel is ready
    panel.onShown.addListener((panelWindow) => {
      console.log("Browser Tools panel shown");
      // Panel window is available here
    });

    panel.onHidden.addListener(() => {
      console.log("Browser Tools panel hidden");
    });
  }
);