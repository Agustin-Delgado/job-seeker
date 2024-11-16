import { createClient } from "@/supabase/server";
import { inngest } from "../client";

export const removeJobs = inngest.createFunction(
  { id: "remove-jobs" },
  { event: "jobs/remove" },
  async () => {
    const supabase = await createClient();

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    await supabase
      .from("jobs")
      .delete()
      .lt("posted_at", twentyFourHoursAgo.toISOString())
  },
);