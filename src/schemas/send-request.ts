import { z } from "zod/v4";

export const SenderSchema = z.object({
  accountId: z.string().min(1),
  email: z.email(),
  domain: z.string().min(1),
  ip: z.string().min(1),
});

export const RecipientSchema = z.object({
  email: z.email(),
  domain: z.string().min(1),
});

export const ContentSchema = z.object({
  subject: z.string(),
  body: z.string().default(""),
  hasLinks: z.boolean(),
  linkCount: z.int().min(0),
  hasAttachments: z.boolean(),
  bodyLengthBytes: z.int().min(0),
  suspiciousKeywords: z.array(z.string()),
});

export const IngestContentSchema = ContentSchema.omit({
  suspiciousKeywords: true,
}).strict();

export const MetadataSchema = z.object({
  region: z.string(),
  userAgent: z.string(),
});

export const SendRequestSchema = z.object({
  eventId: z.uuid(),
  timestamp: z.iso.datetime(),
  sender: SenderSchema,
  recipient: RecipientSchema,
  content: ContentSchema,
  metadata: MetadataSchema,
});

export const IngestSendRequestSchema = SendRequestSchema.extend({
  content: IngestContentSchema,
});

export type SendRequest = z.infer<typeof SendRequestSchema>;
export type SendRequestInput = z.infer<typeof IngestSendRequestSchema>;
