import { inngest } from "../client";

export const processJobs = inngest.createFunction(
  { id: "process-jobs" },
  { cron: "TZ=America/Argentina/Buenos_Aires 0 10-17 * * *" },
  async ({ step }) => {
    await step.sendEvent("get-new-jobs", {
      name: "jobs/get",
    });
    await step.sendEvent("remove-old-jobs", {
      name: "jobs/remove",
    });
  },
);