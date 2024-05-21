// contractProvider.js
import { publicClient } from "@lib/viemProvider";
import {
  getSessionABI,
  getAllEventsDataABI,
  getAllPageViewCountsABI,
  getAllSessionsABI,
  getEventCountABI,
  getPageViewCountABI,
  getSessionCountABI,
  getSessionEventsABI,
} from "@lib/abi";

const SYNDICATE_KEY = import.meta.env.SYNDICATE_KEY;
const SYNDICATE_ID = import.meta.env.SYNDICATE_ID;
const CONTRACT_ADDRESS = import.meta.env.PUBLIC_ANALYTICS_CONTRACT;
const CHAIN_ID = 84532;

async function sendSyndicateTransaction(functionSignature, args) {
  const response = await fetch(
    "https://api.syndicate.io/transact/sendTransaction",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SYNDICATE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: SYNDICATE_ID,
        contractAddress: CONTRACT_ADDRESS,
        chainId: CHAIN_ID,
        functionSignature,
        args,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Failed to send transaction:", errorData);
    throw new Error(errorData);
  }

  const data = await response.json();
  return data;
}

// Read functions
export async function getSession(sessionId) {
  const data = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: getSessionABI,
    functionName: "getSession",
    args: [sessionId],
  });
  return data;
}

export async function getAllEventsData() {
  const data = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: getAllEventsDataABI,
    functionName: "getAllEventsData",
  });
  return data;
}

export async function getAllPageViewCounts() {
  const data = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: getAllPageViewCountsABI,
    functionName: "getAllPageViewCounts",
  });
  return data;
}

export async function getAllSessions() {
  try {
    const data = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: getAllSessionsABI,
      functionName: "getAllSessions",
    });
    return data;
  } catch (error) {
    console.error("Failed to retrieve sessions:", error);
    throw error; // Re-throw the error if you want to handle it further up the call stack
  }
}

export async function getEventCount(eventName) {
  const data = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: getEventCountABI,
    functionName: "getEventCount",
    args: [eventName],
  });
  return data;
}

export async function getPageViewCount(pagePath) {
  const data = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: getPageViewCountABI,
    functionName: "getPageViewCount",
    args: [pagePath],
  });
  return data;
}

export async function getSessionCount() {
  const data = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: getSessionCountABI,
    functionName: "getSessionCount",
  });
  return data;
}

export async function getSessionEvents(sessionId) {
  const data = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: getSessionEventsABI,
    functionName: "getSessionEvents",
    args: [sessionId],
  });
  return data;
}

// Write functions
export async function addEvent(eventName, properties, sessionId) {
  const functionSignature =
    "addEvent(string eventName, string properties, bytes32 sessionId)";
  const args = { eventName, properties, sessionId };
  await sendSyndicateTransaction(functionSignature, args);
}

export async function addPageView(pagePath, sessionId) {
  const functionSignature = "addPageView(string path, bytes32 sessionId)";
  const args = { path: pagePath, sessionId };
  await sendSyndicateTransaction(functionSignature, args);
}

export async function createSession(sessionId) {
  const functionSignature = "createSession(bytes32 sessionId)";
  const args = { sessionId };
  await sendSyndicateTransaction(functionSignature, args);
}

export async function authorizeAddress(address) {
  const functionSignature = "authorizeAddress(address addr)";
  const args = { addr: address };
  await sendSyndicateTransaction(functionSignature, args);
}

export async function deauthorizeAddress(address) {
  const functionSignature = "deauthorizeAddress(address addr)";
  const args = { addr: address };
  await sendSyndicateTransaction(functionSignature, args);
}
