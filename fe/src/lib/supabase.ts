import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://onxsbnsmcluyexwkrawx.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHNibnNtY2x1eWV4d2tyYXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NDY5OTUsImV4cCI6MjA5NjMyMjk5NX0.qqD_fsev8s-5_QjxRJPLeVOn9aldNbxBJl1W-N36-uM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
