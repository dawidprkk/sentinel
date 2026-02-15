import { randomUUID } from "crypto";
import type { SendRequestInput } from "@/schemas/send-request";
import { simulatorConfig } from "./config";
import { pick } from "./utils";



export type PersonaType = "legitimate" | "bad_actor" | "high_legit";

export interface Persona {
  id: string;
  accountId: string;
  email: string;
  domain: string;
  ip: string;
  type: PersonaType;
  profileKey: string;
  currentRate: number;
  targetRate: number;
  contentProfile: {
    subjects: string[];
    hasLinks: boolean;
    linkCount: number;
    hasAttachments: boolean;
    bodyLengthBytes: number;
    suspiciousKeywords: string[];
  };
}

export interface PersonaManager {
  personas: Map<string, Persona>;
  addPersona(persona: Persona): void;
  removePersona(id: string): void;
  tick(): SendRequestInput[];
  getActivePersonas(): Persona[];
  reset(): void;
}


const BAD_ACTOR_PROFILES = [
  {
    prefix: "bad_actor_phishing",
    domain: "security-alerts.net",
    ip: "185.220.101.42",
    subjects: [
      "Please verify your account immediately",
      "Action required: verify your account",
      "Verify your account to avoid suspension",
      "Security notice - verify your account now",
    ],
    suspiciousKeywords: ["verify", "account", "security", "immediately"],
    hasLinks: true,
    linkCount: 2,
    bodyLengthBytes: 800,
    hasAttachments: false,
  },
  {
    prefix: "bad_actor_spoofing",
    domain: "paypa1-secure.com",
    ip: "91.234.99.15",
    subjects: [
      "Your PayPal account has been limited",
      "Important: Update your payment information",
      "Suspicious activity on your account",
      "Complete your verification to restore access",
    ],
    suspiciousKeywords: ["paypal", "account", "limited", "verification"],
    hasLinks: true,
    linkCount: 3,
    bodyLengthBytes: 650,
    hasAttachments: false,
  },
  {
    prefix: "bad_actor_highvolume",
    domain: "newsletter-blast.com",
    ip: "198.51.100.77",
    subjects: [
      "Daily newsletter - Edition #",
      "Your morning digest",
      "Breaking news update",
      "Weekly roundup inside",
    ],
    suspiciousKeywords: [],
    hasLinks: true,
    linkCount: 2,
    bodyLengthBytes: 1200,
    hasAttachments: false,
  },
  {
    prefix: "bad_actor_suspicious",
    domain: "best-deals-today.biz",
    ip: "45.153.160.88",
    subjects: [
      "Check out these amazing deals!",
      "Limited time offers inside",
      "Click to claim your rewards",
      "Exclusive discounts just for you",
    ],
    suspiciousKeywords: ["deals", "click", "free", "limited"],
    hasLinks: true,
    linkCount: 8,
    bodyLengthBytes: 350,
    hasAttachments: true,
  },
  {
    prefix: "bad_actor_credential",
    domain: "secure-login-portal.net",
    ip: "103.75.190.22",
    subjects: [
      "Your login credentials need updating",
      "Login attempt from unknown device",
      "Reset your login password now",
      "New login detected - verify identity",
    ],
    suspiciousKeywords: ["login", "credential", "password", "reset"],
    hasLinks: true,
    linkCount: 1,
    bodyLengthBytes: 550,
    hasAttachments: false,
  },
];


const HIGH_THROUGHPUT_LEGITIMATE_PROFILES = [
  {
    prefix: "high_legit_blackfriday_promo",
    domain: "promo.bigstore.com",
    ip: "54.210.155.90",
    subjects: [
      "Black Friday: 50% off everything!",
      "Flash sale starts now",
      "Limited time offer inside",
      "Your exclusive deals are waiting",
    ],
  },
  {
    prefix: "high_legit_product_launch",
    domain: "launch.techstartup.io",
    ip: "35.168.112.44",
    subjects: [
      "Introducing our new product",
      "You're invited: product launch event",
      "Early access for subscribers",
      "Be the first to try our new feature",
    ],
  },
];


const LEGITIMATE_PROFILES = [
  { prefix: "legit_shopify", domain: "notifications.shopify.com", ip: "23.227.38.32", subjects: ["Your order has been shipped", "Order confirmation #", "Delivery update"] },
  { prefix: "legit_amazon_seller", domain: "seller.amazon.com", ip: "54.239.28.85", subjects: ["Your item has shipped", "Buyer message received", "Payment received"] },
  { prefix: "legit_etsy", domain: "mail.etsy.com", ip: "104.92.95.44", subjects: ["New order received", "Your item was favorited", "Shop stats update"] },
  { prefix: "legit_stripe_billing", domain: "billing.stripe.com", ip: "54.187.174.169", subjects: ["Invoice paid", "Subscription renewed", "Payment successful"] },
  { prefix: "legit_square", domain: "messages.square.com", ip: "74.125.195.27", subjects: ["Daily sales summary", "New transaction", "Deposit completed"] },
];

const MAX_LEGITIMATE_PERSONAS = 5;

function normalizeIndex(index: number, length: number): number {
  return ((index % length) + length) % length;
}

function hasProfileKey(profileKey: string): boolean {
  return personaManager
    .getActivePersonas()
    .some((persona) => persona.profileKey === profileKey);
}

function getActiveLegitimateCount(): number {
  return personaManager
    .getActivePersonas()
    .filter((persona) => persona.type === "legitimate").length;
}

function getNextAvailableProfileIndex(
  type: PersonaType,
  profileCount: number,
  preferredIndex = 0,
): number | null {
  for (let offset = 0; offset < profileCount; offset++) {
    const index = normalizeIndex(preferredIndex + offset, profileCount);
    const profileKey = `${type}:${index}`;
    if (!hasProfileKey(profileKey)) {
      return index;
    }
  }
  return null;
}

function createBadActorPersona(profileIndex: number): Persona {
  const normalizedIndex = normalizeIndex(profileIndex, BAD_ACTOR_PROFILES.length);
  const profile = BAD_ACTOR_PROFILES[normalizedIndex];
  const uniqueId = Math.floor(Math.random() * 1000);
  const targetRate = simulatorConfig.badActorRatePerMinute / 60;

  return {
    id: randomUUID(),
    accountId: `${profile.prefix}_${uniqueId}`,
    email: `sender${uniqueId}@${profile.domain}`,
    domain: profile.domain,
    ip: profile.ip,
    type: "bad_actor",
    profileKey: `bad_actor:${normalizedIndex}`,
    currentRate: targetRate,
    targetRate,
    contentProfile: {
      subjects: profile.subjects,
      hasLinks: profile.hasLinks,
      linkCount: profile.linkCount,
      hasAttachments: profile.hasAttachments,
      bodyLengthBytes: profile.bodyLengthBytes,
      suspiciousKeywords: profile.suspiciousKeywords,
    },
  };
}

function createLegitimatePersona(profileIndex: number): Persona {
  const normalizedIndex = normalizeIndex(profileIndex, LEGITIMATE_PROFILES.length);
  const profile = LEGITIMATE_PROFILES[normalizedIndex];
  const uniqueId = Math.floor(Math.random() * 1000);
  const rate = simulatorConfig.legitimateRatePerMinute / 60;

  return {
    id: randomUUID(),
    accountId: `${profile.prefix}_${uniqueId}`,
    email: `noreply@${profile.domain}`,
    domain: profile.domain,
    ip: profile.ip,
    type: "legitimate",
    profileKey: `legitimate:${normalizedIndex}`,
    currentRate: rate,
    targetRate: rate,
    contentProfile: {
      subjects: profile.subjects,
      hasLinks: true,
      linkCount: 1,
      hasAttachments: false,
      bodyLengthBytes: 1500,
      suspiciousKeywords: [],
    },
  };
}

function buildBody(subject: string, suspiciousKeywords: string[]): string {
  const keywordPhrase =
    suspiciousKeywords.length > 0
      ? `Important keywords: ${suspiciousKeywords.join(" ")}.`
      : "General account update for your records.";
  return `${subject}\n\n${keywordPhrase}\nPlease review the details and proceed as needed.`;
}

function generateEventForPersona(persona: Persona): SendRequestInput {
  const subject = pick(persona.contentProfile.subjects);
  const body = buildBody(subject, persona.contentProfile.suspiciousKeywords);
  const recipientDomain = "example.com";

  return {
    eventId: randomUUID(),
    timestamp: new Date().toISOString(),
    sender: {
      accountId: persona.accountId,
      email: persona.email,
      domain: persona.domain,
      ip: persona.ip,
    },
    recipient: {
      email: `user${Math.floor(Math.random() * 10000)}@${recipientDomain}`,
      domain: recipientDomain,
    },
    content: {
      subject,
      body,
      hasLinks: persona.contentProfile.hasLinks,
      linkCount: persona.contentProfile.linkCount,
      hasAttachments: persona.contentProfile.hasAttachments,
      bodyLengthBytes: persona.contentProfile.bodyLengthBytes,
    },
    metadata: {
      region: pick(["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]),
      userAgent: "resend-node/2.0",
    },
  };
}

class PersonaManagerImpl implements PersonaManager {
  personas: Map<string, Persona> = new Map();
  private lastTickTime: number = Date.now();
  private accumulatedEvents: Map<string, number> = new Map();

  addPersona(persona: Persona): void {
    this.personas.set(persona.id, persona);
    this.accumulatedEvents.set(persona.id, 0);
  }

  removePersona(id: string): void {
    this.personas.delete(id);
    this.accumulatedEvents.delete(id);
  }

  getActivePersonas(): Persona[] {
    return Array.from(this.personas.values());
  }

  reset(): void {
    this.personas.clear();
    this.accumulatedEvents.clear();
    this.lastTickTime = Date.now();
  }

  
  tick(): SendRequestInput[] {
    const now = Date.now();
    const deltaSeconds = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    const events: SendRequestInput[] = [];

    for (const persona of this.personas.values()) {
      const accumulated = (this.accumulatedEvents.get(persona.id) || 0) + persona.currentRate * deltaSeconds;
      const eventsToSend = Math.floor(accumulated);
      this.accumulatedEvents.set(persona.id, accumulated - eventsToSend);
      for (let i = 0; i < eventsToSend; i++) {
        events.push(generateEventForPersona(persona));
      }
    }

    return events;
  }
}
export const personaManager = new PersonaManagerImpl();


export function initializePersonas(options: {
  legitimateCount?: number;
  badActorCount?: number;
  highThroughputCount?: number;
} = {}): void {
  const {
    legitimateCount = 1,
    badActorCount = 1,
    highThroughputCount = 1,
  } = options;

  personaManager.reset();
  for (let i = 0; i < legitimateCount; i++) {
    const persona = spawnLegitimate(i);
    if (!persona) break;
  }
  for (let i = 0; i < badActorCount; i++) {
    const persona = spawnBadActor(i);
    if (!persona) break;
  }
  for (let i = 0; i < highThroughputCount; i++) {
    const persona = spawnHighThroughputLegitimate(i);
    if (!persona) break;
  }
}


export function spawnBadActor(profileIndex = 0): Persona | null {
  const normalizedIndex = normalizeIndex(profileIndex, BAD_ACTOR_PROFILES.length);
  const profileKey = `bad_actor:${normalizedIndex}`;
  if (hasProfileKey(profileKey)) return null;

  const persona = createBadActorPersona(normalizedIndex);
  personaManager.addPersona(persona);
  return persona;
}


export function spawnLegitimate(profileIndex?: number): Persona | null {
  if (getActiveLegitimateCount() >= MAX_LEGITIMATE_PERSONAS) {
    return null;
  }

  const preferredIndex = profileIndex ?? 0;
  const availableIndex = getNextAvailableProfileIndex(
    "legitimate",
    LEGITIMATE_PROFILES.length,
    preferredIndex,
  );
  if (availableIndex === null) return null;

  const persona = createLegitimatePersona(availableIndex);
  personaManager.addPersona(persona);
  return persona;
}


function createHighThroughputLegitimatePersona(profileIndex: number): Persona {
  const normalizedIndex = normalizeIndex(
    profileIndex,
    HIGH_THROUGHPUT_LEGITIMATE_PROFILES.length,
  );
  const profile = HIGH_THROUGHPUT_LEGITIMATE_PROFILES[normalizedIndex];
  const uniqueId = Math.floor(Math.random() * 1000);
  const rate = simulatorConfig.highThroughputRatePerMinute / 60;

  return {
    id: randomUUID(),
    accountId: `${profile.prefix}_${uniqueId}`,
    email: `noreply@${profile.domain}`,
    domain: profile.domain,
    ip: profile.ip,
    type: "high_legit",
    profileKey: `high_legit:${normalizedIndex}`,
    currentRate: rate,
    targetRate: rate,
    contentProfile: {
      subjects: profile.subjects,
      hasLinks: true,
      linkCount: 2,
      hasAttachments: false,
      bodyLengthBytes: 1800,
      suspiciousKeywords: [],
    },
  };
}


export function spawnHighThroughputLegitimate(profileIndex = 0): Persona | null {
  const normalizedIndex = normalizeIndex(
    profileIndex,
    HIGH_THROUGHPUT_LEGITIMATE_PROFILES.length,
  );
  const profileKey = `high_legit:${normalizedIndex}`;
  if (hasProfileKey(profileKey)) return null;

  const persona = createHighThroughputLegitimatePersona(normalizedIndex);
  personaManager.addPersona(persona);
  return persona;
}

export function getPersonasSummary(): {
  total: number;
  byType: Record<PersonaType, number>;
  totalRate: number;
  personas: Array<{
    id: string;
    accountId: string;
    type: PersonaType;
    currentRate: number;
  }>;
} {
  const personas = personaManager.getActivePersonas();

  const byType: Record<PersonaType, number> = { legitimate: 0, bad_actor: 0, high_legit: 0 };
  let totalRate = 0;

  for (const p of personas) {
    byType[p.type]++;
    totalRate += p.currentRate;
  }

  return {
    total: personas.length,
    byType,
    totalRate,
    personas: personas.map((p) => ({
      id: p.id,
      accountId: p.accountId,
      type: p.type,
      currentRate: p.currentRate,
    })),
  };
}
