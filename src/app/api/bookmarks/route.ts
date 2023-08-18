import { NextResponse } from "next/server";
import Airtable from "airtable";

export const runtime = "edge";
export const revalidate = 60;

// Create an Airtable client
const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY as string;
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE as string;
const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

export async function GET() {
  console.log("Starting data fetch..."); // Start logging
  try {
    // Fetch data from the API
    const response = await fetch("https://www.discove.xyz/api/feeds/iammatthias/bookmarks?p=1");
    const data = await response.json();

    console.log("Data fetched from API, processing..."); // Data fetched log

    const records: {
      hash: string;
      text: string;
      username: string;
      thread_hash: string;
      display_name: string;
      published_at: string;
      bookmarked_at: string;
    }[] = [];

    // Get existing hashes in the database
    const existingRecords = await airtable("bookmarks").select().firstPage();

    console.log("Existing records fetched from Airtable, processing..."); // Data fetched from Airtable log

    const existingHashes = existingRecords.map((record) => record.get("hash"));

    // Extract the data from the response
    data.feed.results.forEach((cast: any) => {
      // Skip the cast if reply_to_data is not present
      if (!cast.reply_to_data) {
        return;
      }

      // Check if the cast already exists in the database and skip if it does
      if (existingHashes.includes(cast.reply_to_data.hash)) {
        return;
      }

      // Prepare the data for insertion into Airtable
      const record = {
        hash: cast.reply_to_data.hash || null,
        text: cast.reply_to_data.text || null,
        username: cast.reply_to_data.username || null,
        thread_hash: cast.reply_to_data.thread_hash || null,
        display_name: cast.reply_to_data.display_name || null,
        published_at: cast.reply_to_data.published_at || null,
        bookmarked_at: cast.published_at || null,
      };

      records.push(record);
    });

    console.log("Data prepared for Airtable, inserting..."); // Data prepared for Airtable log

    // Insert the data into Airtable
    await Promise.all(
      records.map((record) => {
        return airtable("bookmarks").create(record);
      })
    );

    console.log("Data successfully processed and inserted into Airtable"); // Successful insertion log

    return NextResponse.json({
      status: 200,
      body: { message: "Data successfully processed", data: records },
    });
  } catch (error) {
    console.error("Error fetching data: ", error);
    return NextResponse.json({
      status: 500,
      body: {
        error: "An error occurred while fetching data",
        errorDetails: error,
      },
    });
  }
}
