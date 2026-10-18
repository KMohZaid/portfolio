export function isPreviewableAttachment(file: { name: string; mimeType: string }) {
  return file.mimeType.startsWith("text/") || /\.(pdf|docx?|xlsx?|pptx?|odt|ods|odp|md|csv|json|xml|ya?ml|zip|jpe?g|png|gif|webp|svg|bmp|avif|heic|mp4|webm|ogg|mov|avi|mkv|mp3|wav|m4a|aac|flac)$/i.test(file.name);
}
