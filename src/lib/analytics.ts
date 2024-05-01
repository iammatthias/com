import { publicClient } from "@lib/viemClients";
import {
  sessionCountABI,
  getAllPageViewsABI,
  getAllSessionHashesABI,
} from "@lib/abi";

const contractAddress = await import.meta.env.PUBLIC_HIT_COUNTER_CONTRACT;
const topPagesCount = 5;

function createTableSkeleton() {
  const pagesTable = document.getElementById("pageCounts");
  if (pagesTable && pagesTable.innerHTML.trim() === "") {
    let tableHTML = "<table><tr><th>Page</th><th>Views</th></tr>";
    for (let i = 0; i < topPagesCount; i++) {
      tableHTML += `<tr><td id="page${i}"></td><td id="views${i}"></td></tr>`;
    }
    tableHTML += "</table>";
    pagesTable.innerHTML = tableHTML;
    return true;
  }
  return false;
}

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
      if (index < topPagesCount) {
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
    const sessionIDs = document.getElementById("sessionIDs");
    sessionIDs!.innerHTML = ""; // Clear previous entries
    data.reverse(); // Show the latest session IDs first
    data.forEach((hash) => {
      const hashSpan = document.createElement("span");
      hashSpan.className = "sessionHash";
      hashSpan.innerText = hash;

      const hashLink = document.createElement("a");
      hashLink.href = `/onchain-analytics/${hash}`;
      hashLink.appendChild(hashSpan);

      sessionIDs!.appendChild(hashLink);
      sessionIDs!.appendChild(document.createTextNode(" "));
    });
  } catch (error) {
    console.error("Failed to fetch session IDs:", error);
  }
}

async function updateData() {
  if (!createTableSkeleton()) {
    return; // Exit if the table cannot be created or is already there
  }

  // Execute all async operations in parallel
  const sessionCountPromise = updateSessionCount();
  const pageCountsPromise = updatePageCounts();
  const sessionIDsPromise = updateSessionIDs();

  try {
    // Wait for all promises to resolve
    await Promise.all([
      sessionCountPromise,
      pageCountsPromise,
      sessionIDsPromise,
    ]);
  } catch (error) {
    console.error("Error updating data:", error);
  }
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          if (node.id === "pageCounts" || node.querySelector("#pageCounts")) {
            observer.disconnect(); // Stop observing after finding and handling the target
            updateData();
          }
        }
      });
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });

document.addEventListener("visibilitychange", () => {
  if (
    document.visibilityState === "visible" &&
    document.getElementById("pageCounts")
  ) {
    updateData();
  }
});

const unwatch = publicClient.watchBlocks({
  onBlock: updateData,
  onError: (error) => console.error("Error watching blocks:", error),
});

window.addEventListener("unload", unwatch);
