// src/scripts/appendUTM.ts

// Define your UTM parameters
const utmParams = {
  utm_source: "iammatthias.com",
  utm_medium: "referral",
  utm_campaign: "site_referral",
};

// Function to append UTM parameters to a URL
function appendUTMParams(
  url: string,
  params: { [key: string]: string },
): string {
  const urlObj = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    urlObj.searchParams.set(key, value);
  }
  return urlObj.toString();
}

// Function to process all outbound links
export function processOutboundLinks(): void {
  // Get all links on the page
  const links = document.querySelectorAll("a");

  // Iterate through each link
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (
      href &&
      href.startsWith("http") &&
      !href.includes(window.location.hostname)
    ) {
      // If it's an outbound link, append the UTM parameters
      const newHref = appendUTMParams(href, utmParams);
      link.setAttribute("href", newHref);
    }
  });
}

// Execute the function after the DOM is fully loaded
document.addEventListener("DOMContentLoaded", processOutboundLinks);
