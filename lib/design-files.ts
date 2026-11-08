const databaseName = 'aprintz-design-files';
const storeName = 'files';

function openDesignDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('File desain gagal disimpan di browser.'));
  });
}

async function withStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDesignDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      const request = action(transaction.objectStore(storeName));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('File desain gagal diproses.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Penyimpanan file desain dibatalkan.'));
    });
  } finally {
    database.close();
  }
}

export function saveDesignFile(key: string, file: File): Promise<IDBValidKey> {
  return withStore('readwrite', store => store.put(file, key));
}

export async function getDesignFile(key: string): Promise<File | undefined> {
  return withStore('readonly', store => store.get(key));
}

export async function removeDesignFile(key: string): Promise<void> {
  await withStore('readwrite', store => store.delete(key));
}
