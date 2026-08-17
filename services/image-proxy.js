// Constrói a URL do endpoint que baixa a imagem no servidor em vez de o
// navegador carregá-la direto do marketplace (ver models/link-preview.js).

function proxiedImageUrl(originalUrl) {
  if (!originalUrl) {
    return null;
  }

  return `/api/v1/link-previews/image?url=${encodeURIComponent(originalUrl)}`;
}

const imageProxy = {
  proxiedImageUrl,
};

export default imageProxy;
