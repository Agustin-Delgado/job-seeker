import { z } from "zod";

const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  public_identifier: z.string(),
  profile_url: z.string().url(),
  profile_picture_url: z.string().url(),
});

const jobSchema = z.object({
  type: z.literal("JOB"),
  id: z.string(),
  reference_id: z.string(),
  title: z.string(),
  location: z.string(),
  posted_at: z.string().datetime(),
  reposted: z.boolean(),
  url: z.string().url(),
  company: companySchema,
});

export type RawJob = z.infer<typeof jobSchema>;
