'use client';

import { useState, useEffect } from 'react';

export default function FormatedDateTime({ dateTime }: any) {
  const [formattedDateTime, setFormattedDateTime] = useState('');

  useEffect(() => {
    const pstTimestamp = new Date(dateTime).toLocaleString(`en-US`, {
      timeZone: `America/Los_Angeles`,
    });

    setFormattedDateTime(new Date(pstTimestamp).toLocaleDateString());
  });

  return <>{formattedDateTime}</>;
}
