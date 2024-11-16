import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { sendTelegramMessage } from "@/inngest/functions/send-telegram-message";
import { getJobs } from "@/inngest/functions/get-jobs";
import { processJobs } from "@/inngest/functions/process-jobs";
import { removeJobs } from "@/inngest/functions/remove-old-jobs";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendTelegramMessage,
    getJobs,
    processJobs,
    removeJobs
  ],
});
