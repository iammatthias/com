import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function GET() {
  try {
    // Fetch data from the first API
    const response1 = await fetch(
      "https://searchcaster.xyz/api/search?text=@perl&username=iammatthias"
    );
    const data1 = await response1.json();

    for (let cast of data1.casts) {
      const replyParentMerkleRoot = cast.body.data.replyParentMerkleRoot;

      // Fetch data from the second API using replyParentMerkleRoot from the first API response
      const response2 = await fetch(
        `https://searchcaster.xyz/api/search?merkleRoot=${replyParentMerkleRoot}&count=1`
      );
      const data2 = await response2.json();

      for (let cast2 of data2.casts) {
        // Prepare the data for insertion into Supabase
        const record = {
          publishedat: cast2.body.publishedAt,
          username: cast2.body.username,
          text: cast2.body.data.text,
          image: cast2.body.data.image,
          replyparentmerkleroot: cast2.body.data.replyParentMerkleRoot,
          threadmerkleroot: cast2.body.data.threadMerkleRoot,
          displayname: cast2.meta.displayName,
          avatar: cast2.meta.avatar,
          isverifiedavatar: cast2.meta.isVerifiedAvatar,
          numreplychildren: cast2.meta.numReplyChildren,
          reactionscount: cast2.meta.reactions.count,
          recastscount: cast2.meta.recasts.count,
          watchescount: cast2.meta.watches.count,
          merkleroot: cast2.merkleRoot,
          uri: cast2.uri,
        };

        // Check if the record already exists
        const { data: existingData, error: existingError } = await supabase
          .from("casts")
          .select("merkleroot")
          .eq("merkleroot", record.merkleroot);

        if (existingError) {
          console.error("Error fetching existing data: ", existingError);
        } else if (existingData && existingData.length > 0) {
          console.log(
            `Data with merkleroot ${record.merkleroot} already exists`
          );
        } else {
          // Insert the data into Supabase
          const { error: insertError } = await supabase
            .from("casts")
            .insert(record);

          // Check for errors
          if (insertError) {
            console.error("Error inserting data: ", insertError);
          }
        }
      }
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
