export async function kvGet<T>(key: string): Promise<T | null> {
  const body = JSON.stringify(["GET", key]);

  const response = await fetch(`${process.env.KV_REST_API_URL}/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
    },
    body,
  });

  if (!response.ok) {
    console.error(`Error fetching key ${key}: ${response.statusText}`);
    return null;
  }

  try {
    // Get the response and parse the first layer of JSON.
    const wrapper = await response.json();
    // Check if 'result' is a property and then parse the inner JSON.
    const data = wrapper && wrapper.result ? JSON.parse(wrapper.result) : null;
    return data as T;
  } catch (error) {
    console.error(`Error parsing response for key ${key}:`, error);
    return null;
  }
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  // The expiration time is set directly in the array, following the Redis command syntax for `SET`.
  const body = JSON.stringify(["SET", key, JSON.stringify(value), "EX", 60 * 60 * 24 * 30]); // Expires in 30 days

  const response = await fetch(`${process.env.KV_REST_API_URL}/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
    },
    body: body,
  });

  if (!response.ok) {
    console.error(`Error setting key ${key}: ${response.statusText}`);
  }
}
