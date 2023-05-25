import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function GET() {
  try {
    // Fetch data from the API
    const response = await fetch(
      "https://www.discove.xyz/api/feeds/iammatthias/bookmarks?p=1",
      { next: { revalidate: 60 } }
    );
    const data = await response.json();

    const records: {
      hash: string;
      text: string | null;
      username: string | null;
      thread_hash: string | null;
      display_name: string | null;
      published_at: string | null;
      bookmarked_at: string | null;
    }[] = [];

    // Get existing hashes in the database
    const { data: existingRecords, error: fetchError } = await supabase
      .from("bookmark_casts")
      .select("hash");

    if (fetchError) {
      console.error("Error fetching existing records: ", fetchError);
    }

    const existingHashes = existingRecords?.map((record) => record.hash) || [];

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

      // Prepare the data for insertion into Supabase
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

    // Insert the data into Supabase
    const { error: insertError } = await supabase
      .from("bookmark_casts")
      .insert(records);

    // Check for errors
    if (insertError) {
      console.error("Error inserting data: ", insertError);
    }

    return NextResponse.json({
      status: 200,
      body: { message: "Data successfully processed" },
    });
  } catch (error) {
    console.error("Error fetching data: ", error);
    return NextResponse.json({
      status: 500,
      body: { error: "An error occurred while fetching data" },
    });
  }
}
