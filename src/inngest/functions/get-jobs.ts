import { RawJob } from "@/schemas/job.schema";
import { inngest } from "../client";
import { createClient } from "@/supabase/server";

const UNIPILE_URL = process.env.NEXT_PUBLIC_UNIPILE_URL!;
const UNIPILE_API_KEY = process.env.NEXT_PUBLIC_UNIPILE_API_KEY!;
const UNIPILE_ACCOUNT_ID = process.env.NEXT_PUBLIC_UNIPILE_ACCOUNT_ID!;

export const getJobs = inngest.createFunction(
  { id: "get-jobs" },
  { event: "jobs/get" },
  async ({ step }) => {
    const supabase = await createClient();

    let hasMore: boolean = true;
    let cursor: string | null = null;

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const newJobs: RawJob[] = [];

    while (hasMore) {
      let url = `${UNIPILE_URL}/api/v1/linkedin/search?account_id=${UNIPILE_API_KEY}`;
      if (cursor) {
        url += `&cursor=${encodeURIComponent(cursor)}`;
      }

      const jobs = await step.run("get-new-jobs", async () => {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "X-API-KEY": UNIPILE_ACCOUNT_ID,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api: "classic",
            category: "jobs",
            keywords: "Desarrollador de front-end",
            sort_by: "date",
            presence: ["remote"],
            easy_apply: true,
          }),
        });

        const data = await response.json();
        return data
      });

      const recentJobs = (jobs.items as RawJob[]).filter((item) => {
        const postedAt = new Date(item.posted_at);
        return postedAt >= twentyFourHoursAgo;
      });

      if (recentJobs.length === 0) {
        hasMore = false;
        break;
      }

      const recentJobIds = recentJobs.map((job) => job.id);

      const jobsToAdd = await step.run("get-existing-jobs", async () => {
        const { data: existingJobsData, error: fetchError } = await supabase
          .from("jobs")
          .select("id")
          .in("id", recentJobIds);

        if (fetchError) {
          console.error("Error al obtener trabajos existentes:", fetchError);
          throw new Error("Error al obtener trabajos existentes");
        }

        const existingJobIdsSet = new Set(existingJobsData.map((job) => job.id));
        const jobsToAdd = recentJobs.filter((job) => !existingJobIdsSet.has(job.id));

        return jobsToAdd;
      });


      if (jobsToAdd.length > 0) {
        await step.run("add-new-jobs", async () => {
          const { error: insertError } = await supabase.from("jobs").insert(jobsToAdd);

          if (insertError) {
            console.error("Error al insertar trabajos nuevos:", insertError);
            throw new Error("Error al insertar trabajos nuevos");
          }
        });

        newJobs.push(...jobsToAdd);
      }

      if (jobs.paging && jobs.paging.total_count > jobs.paging.start + jobs.paging.page_count) {
        cursor = jobs.cursor;
      } else {
        hasMore = false;
      }

      const lastJob = jobs.items[jobs.items.length - 1];
      if (lastJob) {
        const lastPostedAt = new Date(lastJob.posted_at);
        if (lastPostedAt < twentyFourHoursAgo) {
          hasMore = false;
        }
      }
    }

    const jobsToSend = newJobs.map((job) =>
      step.sendEvent("send-job-message", {
        name: "telegram/send-message",
        data: job,
      })
    );

    await Promise.all(jobsToSend);

    return newJobs;
  }
);
