import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tjipeqtlxsosfqujphlf.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXBlcXRseHNvc2ZxdWpwaGxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTMwNzQsImV4cCI6MjEwMjUyOTA3NH0.5Jzs2DTC-WSsD6Ia-unRdCK5BHJbzGJ9vmeZ6_slFd8';

export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
