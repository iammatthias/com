const API_ENDPOINT = "/api/analytics";

interface TransactionResponse {
  error?: string;
  [key: string]: any;
}

async function sendTransaction(functionName: string, args: any[]) {
  const requestBody = {
    functionName: functionName,
    args: args,
  };

  const jsonBody = JSON.stringify(requestBody);
  // console.log("Stringified request body:", jsonBody);

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: jsonBody,
  };

  // console.log("Sending Transaction with options:", options);

  try {
    const response = await fetch(API_ENDPOINT, options);
    // console.log("Response status:", response.status);
    const text = await response.text();
    // console.log("Raw response text:", text);

    let data: TransactionResponse;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      // console.error("Failed to parse response as JSON:", parseError);
      throw new Error(`Invalid JSON response: ${text}`);
    }

    // console.log("Parsed response data:", data);

    if (!response.ok) {
      throw new Error(data.error || "Transaction failed");
    }
    return data;
  } catch (error) {
    // console.error("Error sending transaction:", error);
    throw error;
  }
}

async function createSession(sessionId: `0x${string}`) {
  const functionName = "createSession(bytes32)";
  const args = [sessionId];
  return await sendTransaction(functionName, args);
}

async function addPageView(sessionId: `0x${string}`, pagePath: string) {
  const functionName = "addPageView(bytes32,string)";
  const args = [sessionId, pagePath];
  return await sendTransaction(functionName, args);
}

async function addEvent(sessionId: `0x${string}`, eventName: string, eventData: string) {
  const functionName = "addEvent(bytes32,string,string)";
  const args = [sessionId, eventName, eventData];
  return await sendTransaction(functionName, args);
}

export { createSession, addPageView, addEvent };
