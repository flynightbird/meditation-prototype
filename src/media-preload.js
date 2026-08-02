export function syncPreloadSource(video, source) {
  video.muted = true;
  const currentSource = video.getAttribute("src");

  if (!source) {
    if (currentSource === null) return false;
    video.removeAttribute("src");
    video.load();
    return true;
  }

  if (currentSource === source) return false;
  video.setAttribute("src", source);
  video.load();
  return true;
}
