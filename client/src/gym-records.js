import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';

export function useGymCollection(db, collectionName, enabled) {
  const [value, setValue] = useState({ records: null, error: '' });
  useEffect(() => {
    setValue({ records: null, error: '' });
    if (!enabled) return;
    let done = false;
    const timeout = setTimeout(() => {
      if (!done) setValue({ records: null, error: 'Database did not respond. Retry after checking your connection.' });
    }, 10000);
    const unsubscribe = onSnapshot(collection(db, collectionName), { includeMetadataChanges: true }, snapshot => {
      if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
      done = true;
      clearTimeout(timeout);
      setValue({ records: snapshot.docs.map(item => ({ ...item.data(), id: item.id })), error: '' });
    }, error => {
      done = true;
      clearTimeout(timeout);
      setValue({ records: null, error: error.code === 'permission-denied'
        ? 'Staff account is not authorized to access ' + collectionName + '. Contact your administrator.'
        : 'Unable to load ' + collectionName + '. Please check your connection.' });
    });
    return () => { clearTimeout(timeout); unsubscribe(); };
  }, [db, collectionName, enabled]);
  return value;
}
