import { RawJob } from "@/schemas/job.schema";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { inngest } from "../client";

const TELEGRAM_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_TOKEN!
const CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID!

export const sendTelegramMessage = inngest.createFunction(
  { id: "send-telegram-message" },
  { event: "telegram/send-message" },
  async ({ event, step }) => {
    const job = event.data as RawJob;
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

    const postedAtFormatted = `Hace ${formatDistanceToNow(new Date(job.posted_at), {
      locale: es,
      addSuffix: false
    })}`;

    const message = `
*${job.title}*.

💼  ${job.company.name}.
📍  ${job.location}.
🕒  ${postedAtFormatted}.

[Envíar CV](${job.url})
    `;

    await step.run("send-message", async () => {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: "Markdown",
          disable_web_page_preview: false,
        }),
      });
    });
  },
);