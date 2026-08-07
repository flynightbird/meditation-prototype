const SUPPORTED_VIEWS = new Set(["coach", "trainer"]);

export function isEmbedMode(search = window.location.search) {
  return new URLSearchParams(search).get("embed") === "1";
}

export function isTrainerDemoMode(search = window.location.search) {
  const params = new URLSearchParams(search);
  return params.get("embed") === "1" && params.get("demo") === "trainer";
}

export function isDemoControlMessage(data) {
  return (
    data?.source === "growth-base-portfolio" &&
    data?.type === "growth-base:demo-control" &&
    (data.action === "play" || data.action === "pause")
  );
}

export function createEmbedMessage(view) {
  if (!SUPPORTED_VIEWS.has(view)) {
    throw new Error(`Unsupported embedded view: ${view}`);
  }

  return {
    source: "growth-base-prototype",
    type: "growth-base:view",
    view,
  };
}

export function notifyEmbeddedView(view, target = window.parent) {
  if (!isEmbedMode() || target === window) return;
  target.postMessage(createEmbedMessage(view), "*");
}
