import { useState, useEffect } from 'react';

// Custom hook
function usePromise(promise) {
  const [state, setState] = useState('pending');
  const [value, setValue] = useState(null);
  useEffect(() => {
    promise.then((result) => {
      setValue(result);
      setState('resolved');
    });
  }, [promise]);
  return [state, value];
}
