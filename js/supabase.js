const SUPABASE_URL = "https://hdvjxevyrgfrbznashkl.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhkdmp4ZXZ5cmdmcmJ6bmFzaGtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MDI3MjcsImV4cCI6MjA5OTk3ODcyN30.DJUa4fZhEdh2o7JblUXqWdf8fFl3eNmhuvu7ewdH5ho";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log("✅ Supabase verbunden");