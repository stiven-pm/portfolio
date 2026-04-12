export const PREVIEWABLE_IMAGE_ACCEPT =
  'image/jpeg,image/png,image/gif,.jpg,.jpeg,.png,.gif';

export const PREVIEWABLE_MODEL_3D_ACCEPT =
  '.glb,.gltf,model/gltf-binary,model/gltf+json';

export function isGltfHttpUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const path = url.split('?')[0].toLowerCase();
  return path.endsWith('.glb') || path.endsWith('.gltf');
}
