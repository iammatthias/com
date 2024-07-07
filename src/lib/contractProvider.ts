import { keccak256 } from "viem";
import { publicClient } from "@lib/viemProvider";
import { analyticsABI } from "@lib/abi";

const CONTRACT_ADDRESS = import.meta.env.PUBLIC_ANALYTICS_CONTRACT;

export const generateSessionId = (input) => {
  return keccak256(input);
};

// Write functions
const sendTransactionViaEndpoint = async (functionName, args) => {
  try {
    const response = await fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ functionName, args }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error in sendTransactionViaEndpoint:", error);
    throw error;
  }
};

export const createSession = (sessionId) => {
  return sendTransactionViaEndpoint("createSession", { sessionId });
};

export const addPageView = (pagePath, sessionId) => {
  return sendTransactionViaEndpoint("addPageView", { pagePath, sessionId });
};

export const addEvent = (eventName, properties, sessionId) => {
  return sendTransactionViaEndpoint("addEvent", {
    eventName,
    properties,
    sessionId,
  });
};

// Read functions
export const getAllEventsData = async () => {
  return publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: analyticsABI,
    functionName: "getAllEventsData",
  });
};

export const getAllPageViewCounts = async () => {
  const [paths, counts] = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: analyticsABI,
    functionName: "getAllPageViewCounts",
  });
  return paths.map((path, index) => ({ path, count: counts[index] }));
};

export const getAllSessions = async () => {
  const [
    ids,
    startBlocks,
    pageViewsArray,
    eventsArray,
    eventPropertiesArray,
    eventBlocksArray,
  ] = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: analyticsABI,
    functionName: "getAllSessions",
  });

  return ids.map((id, index) => ({
    id,
    startBlock: startBlocks[index],
    pageViews: pageViewsArray[index],
    events: eventsArray[index].map((event, eventIndex) => ({
      name: event,
      properties: eventPropertiesArray[index][eventIndex],
      block: eventBlocksArray[index][eventIndex],
    })),
  }));
};

export const getEventCount = (eventName) => {
  return publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: analyticsABI,
    functionName: "getEventCount",
    args: [eventName],
  });
};

export const getPageViewCount = (pagePath) => {
  return publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: analyticsABI,
    functionName: "getPageViewCount",
    args: [pagePath],
  });
};

export const getSession = async (sessionId) => {
  const [id, startBlock, pageViews, events, eventProperties, eventBlocks] =
    await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: analyticsABI,
      functionName: "getSession",
      args: [sessionId],
    });

  return {
    id,
    startBlock,
    pageViews,
    events: events.map((event, index) => ({
      name: event,
      properties: eventProperties[index],
      block: eventBlocks[index],
    })),
  };
};

export const getSessionCount = () => {
  return publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: analyticsABI,
    functionName: "getSessionCount",
  });
};

export const getSessionEvents = async (sessionId) => {
  const [eventNames, eventProperties, eventBlocks] =
    await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: analyticsABI,
      functionName: "getSessionEvents",
      args: [sessionId],
    });
  return eventNames.map((name, index) => ({
    name,
    properties: eventProperties[index],
    block: eventBlocks[index],
  }));
};
