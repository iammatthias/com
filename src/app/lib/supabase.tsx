import { createClient } from "@supabase/supabase-js";

// Create a Supabase client
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function fetchSupabaseData() {
  try {
    // Fetch data from the Supabase
    const { data, error } = await supabase.from("bookmark_casts").select("*");

    if (error) {
      console.error("Error fetching data: ", error);
      return null;
    }

    // Return the data
    return data;
  } catch (error) {
    console.error("Error fetching data: ", error);
    return null;
  }
}
