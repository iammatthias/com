import { keccak256 } from "viem";
import { getSession } from "@lib/contractProvider";

export async function track(action, properties = {}) {
  const defaultExpirationTime = 60 * 60 * 1000; // 1 hour in milliseconds
  const currentTime = Date.now();
  let sessionId = localStorage.getItem("sessionId");
  const expirationTime = localStorage.getItem("expirationTime");

  if (!sessionId || currentTime > Number(expirationTime)) {
    // If no session ID exists in local storage or it's expired, generate a new session ID
    sessionId = await generateSessionId();
    localStorage.setItem("sessionId", sessionId);
    localStorage.setItem(
      "expirationTime",
      (currentTime + defaultExpirationTime).toString(),
    );
  }

  // Check if the session exists on the blockchain
  let sessionExists = false;
  try {
    const sessionData = await getSession(sessionId);
    if (sessionData) {
      sessionExists = true;
    }
  } catch (error) {
    if (error.message.includes("Session doesn't exist")) {
      // Session doesn't exist, proceed to create a new session
    } else {
      // Handle other errors
      console.error("Error checking session existence:", error);
      // You can choose to rethrow the error or handle it in a different way
      // throw error;
    }
  }

  if (!sessionExists) {
    // If the session doesn't exist on the blockchain, create a new session
    await createSession(sessionId);
  }

  // Prepare the data object for the tracking event
  const data = {
    action,
    properties: {
      ...properties,
      sessionId,
      timestamp: currentTime,
      path: properties.pagePath || window.location.pathname || "",
    },
  };

  // Send the tracking event data to the analytics endpoint
  await fetch("/api/analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

async function generateSessionId() {
  const userAgent = navigator.userAgent;
  const ipResponse = await fetch("https://api.ipify.org?format=json");
  const { ip } = await ipResponse.json();
  const currentTime = Date.now();
  return keccak256(`0x${ip + userAgent + currentTime}`);
}

async function createSession(sessionId) {
  // Send a request to create the session on the blockchain
  await fetch("/api/analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "createSession",
      properties: {
        sessionId,
      },
    }),
  });
}
