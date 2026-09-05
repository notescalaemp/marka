// Storage is provider-agnostic so we can start without any binary
// dependency and wire Vercel Blob / S3 later without touching callers.
// Every stored object key MUST be namespaced by establishmentId so access
// control can be enforced by path convention, e.g.
// `establishments/{establishmentId}/logo.png`.

export interface StorageProvider {
  upload(key: string, file: Blob | Buffer, contentType: string): Promise<{ url: string }>;
  getUrl(key: string): string;
  delete(key: string): Promise<void>;
}

class UnconfiguredStorageProvider implements StorageProvider {
  async upload(): Promise<{ url: string }> {
    throw new Error(
      "Nenhum storage provider configurado. Configure Vercel Blob/S3 antes de usar upload de arquivos."
    );
  }
  getUrl(key: string): string {
    return key;
  }
  async delete(): Promise<void> {
    // no-op until a real provider is wired
  }
}

export const storageProvider: StorageProvider = new UnconfiguredStorageProvider();

export function establishmentAssetKey(establishmentId: string, filename: string): string {
  return `establishments/${establishmentId}/${filename}`;
}
