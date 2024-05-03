// apiEndpoint.js
import { addEvent, addPageView, createSession } from "@lib/contractProvider";

export const prerender = false;

export async function POST({ request }) {
  try {
    const requestBody = await request.json();
    const action = requestBody.action;

    switch (action) {
      case "addEvent":
        const {
          properties: { eventName, properties, sessionId: eventSessionId },
        } = requestBody;
        await addEvent(eventName, JSON.stringify(properties), eventSessionId);
        break;

      case "addPageView":
        const {
          properties: { pagePath, sessionId: pageViewSessionId },
        } = requestBody;
        await addPageView(pagePath, pageViewSessionId);
        break;

      case "createSession":
        const {
          properties: { sessionId },
        } = requestBody;
        await createSession(sessionId);
        break;

      default:
        return new Response(
          JSON.stringify({ status: "ERROR", error: "Invalid action" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
    }

    return new Response(JSON.stringify({ status: "OK" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ status: "ERROR", error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
