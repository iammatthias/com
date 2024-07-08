// src/scripts/session.js
import { keccak256 } from "viem";
import { createSession, addPageView } from "../lib/sessionContractProvider";

const defaultExpirationTime = 60 * 60 * 1000; // 1 hour in milliseconds

async function generateSessionId() {
  const userAgent = navigator.userAgent;
  const ipResponse = await fetch("https://api.ipify.org?format=json");
  const { ip } = await ipResponse.json();
  const currentTime = Date.now();
  return keccak256(`0x${ip + userAgent + currentTime}`);
}

async function setSession() {
  const currentTime = Date.now();
  let sessionId = localStorage.getItem("sessionId");
  const expirationTime = localStorage.getItem("expirationTime");

  if (!sessionId || currentTime > Number(expirationTime)) {
    sessionId = await generateSessionId();
    localStorage.setItem("sessionId", sessionId);
    await createSession(sessionId); // Create session in the smart contract
  }

  localStorage.setItem(
    "expirationTime",
    (currentTime + defaultExpirationTime).toString(),
  );
}

function getSession() {
  const sessionId = localStorage.getItem("sessionId");
  const expirationTime = localStorage.getItem("expirationTime");
  return { sessionId, expirationTime };
}

function resetSessionExpiration() {
  const currentTime = Date.now();
  localStorage.setItem(
    "expirationTime",
    (currentTime + defaultExpirationTime).toString(),
  );
}

async function recordPageView() {
  const { sessionId, expirationTime } = getSession();
  const currentTime = Date.now();
  if (sessionId && currentTime <= Number(expirationTime)) {
    const pagePath = window.location.pathname;
    await addPageView(sessionId, pagePath); // Record page view in the smart contract
  }
}

function handleUnload() {
  const currentTime = Date.now();
  const expirationTime = Number(localStorage.getItem("expirationTime"));

  // Check if the session has expired
  if (currentTime > expirationTime) {
    localStorage.removeItem("sessionId");
    localStorage.removeItem("expirationTime");
  }
}

function initializeSession() {
  setSession().then(() => {
    recordPageView(); // Record the initial page view when session is set
  });

  const events = ["mousemove", "keydown", "scroll", "click"];
  events.forEach((event) => {
    window.addEventListener(event, resetSessionExpiration);
  });

  window.addEventListener("unload", handleUnload);
}

export { initializeSession, getSession };
