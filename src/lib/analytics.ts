import { publicClient } from "@lib/viemClients";
import {
  sessionCountABI,
  getAllPageViewsABI,
  getAllSessionHashesABI,
} from "@lib/abi";

const contractAddress = await import.meta.env.PUBLIC_HIT_COUNTER_CONTRACT;

function safelyUpdateTextContent(id, text) {
  const element = document.getElementById(id);
  if (element) {
    element.innerText = text;
    return true;
  }
  console.error(`Element with id '${id}' not found.`);
  return false;
}

async function updateSessionCount() {
  try {
    const data = await publicClient.readContract({
      address: contractAddress,
      abi: sessionCountABI,
      functionName: "sessionCount",
    });
    safelyUpdateTextContent("sessionCount", `${Number(data)}`);
  } catch (error) {
    console.error("Failed to fetch session count:", error);
  }
}

async function updatePageCounts() {
  try {
    const data = await publicClient.readContract({
      address: contractAddress,
      abi: getAllPageViewsABI,
      functionName: "getAllPageViews",
    });
    const pageData = data[0].map((page, index) => ({
      page: page,
      count: BigInt(data[1][index]),
    }));
    pageData.sort((a, b) =>
      a.count > b.count ? -1 : a.count < b.count ? 1 : 0,
    );
    pageData.forEach((item, index) => {
      if (index < 5) {
        safelyUpdateTextContent(`page${index}`, item.page);
        safelyUpdateTextContent(`views${index}`, item.count.toString());
      }
    });
  } catch (error) {
    console.error("Failed to fetch page counts:", error);
  }
}

async function updateSessionIDs() {
  try {
    const data = await publicClient.readContract({
      address: contractAddress,
      abi: getAllSessionHashesABI,
      functionName: "getAllSessionHashes",
    });
    const sessionIDs = document.getElementById("sessionIDs")!;
    sessionIDs.innerHTML = ""; // Clear previous entries
    data.reverse(); // Show the latest session IDs first
    data.forEach((hash) => {
      const hashSpan = document.createElement("span");
      hashSpan.className = "sessionHash";
      hashSpan.innerText = hash;

      const hashLink = document.createElement("a");
      hashLink.href = `/onchain-analytics/${hash}`;
      hashLink.appendChild(hashSpan);

      sessionIDs.appendChild(hashLink);
      sessionIDs.appendChild(document.createTextNode(" "));
    });
  } catch (error) {
    console.error("Failed to fetch session IDs:", error);
  }
}

document.addEventListener(
  "astro:page-load",
  async () => {
    // Execute all async operations in parallel
    await Promise.all([
      updateSessionCount(),
      updatePageCounts(),
      updateSessionIDs(),
    ]).catch((error) => {
      console.error("Error updating data:", error);
    });
  },
  { once: true },
);

const unwatch = publicClient.watchBlocks({
  onBlock: async () => {
    await Promise.all([
      updateSessionCount(),
      updatePageCounts(),
      updateSessionIDs(),
    ]).catch((error) => console.error("Error watching blocks:", error));
  },
  onError: (error) => console.error("Error watching blocks:", error),
});

window.addEventListener("unload", unwatch);
