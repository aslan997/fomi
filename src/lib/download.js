/**
 * Downloads a same-origin asset with a friendly filename. Fetching to a blob
 * (rather than <a download href>) works consistently across browsers.
 */
export async function downloadAsset(url, filename) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed (${response.status})`);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function assetFilename(image) {
  const ext = image.videoUrl ? "webm" : (image.url.split(".").pop() ?? "webp");
  return `fomi-${image.id}.${ext}`;
}
