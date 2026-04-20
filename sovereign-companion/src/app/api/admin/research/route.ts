import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

// Every Likert field we surface in the Research tab. Grouped by survey section
// so the UI can render them with the right contextual heading.
const LIKERT_FIELDS: { key: string; label: string; section: string }[] = [
  { key: "personaAccuracy", label: "Persona Accuracy", section: "Core Ratings" },
  { key: "replacementWillingness", label: "Replacement Willingness", section: "Core Ratings" },
  { key: "overallExperience", label: "Overall Experience", section: "Core Ratings" },
  { key: "uiEaseOfUse", label: "UI Ease of Use", section: "Core Ratings" },
  { key: "conceptFeasibility", label: "Concept Feasibility", section: "Core Ratings" },

  { key: "priorAiFamiliarity", label: "Prior AI Familiarity", section: "Expectations" },
  { key: "expectationAlignment", label: "Expectation Alignment", section: "Expectations" },

  { key: "customizationDepth", label: "Customization Depth", section: "Creator Studio" },
  { key: "stepFlowIntuitiveness", label: "Step Flow Intuitiveness", section: "Creator Studio" },
  { key: "visualFidelity", label: "Visual Fidelity", section: "Creator Studio" },

  { key: "revealImpact", label: "Reveal Impact", section: "Reveal" },
  { key: "revealMatchedImagination", label: "Reveal Matched Imagination", section: "Reveal" },

  { key: "voiceNaturalness", label: "Voice Naturalness", section: "Encounter" },
  { key: "voiceResponsiveness", label: "Voice Responsiveness", section: "Encounter" },
  { key: "companionPresence", label: "Companion Presence", section: "Encounter" },
  { key: "conversationDepth", label: "Conversation Depth", section: "Encounter" },
  { key: "preferredLongerSession", label: "Preferred Longer Session", section: "Encounter" },

  { key: "ethicalConcernLevel", label: "Ethical Concern Level", section: "Ethics" },
  { key: "impactOnHumanRelations", label: "Impact on Human Relations", section: "Ethics" },
  { key: "socialAcceptancePrediction", label: "Social Acceptance", section: "Ethics" },

  { key: "purchaseIntent", label: "Purchase Intent", section: "Market" },
  { key: "willingnessToPayPremium", label: "Willingness to Pay Premium", section: "Market" },

  { key: "emotionalConnection", label: "Emotional Connection", section: "Emotional" },
  { key: "feltJudgedOrSafe", label: "Felt Judged or Safe", section: "Emotional" },
  { key: "wouldMissCompanion", label: "Would Miss Companion", section: "Emotional" },
  { key: "lonelinessAssist", label: "Loneliness Assist", section: "Emotional" },

  { key: "exhibitionQuality", label: "Exhibition Quality", section: "Recommendation" },
  { key: "willRecommend", label: "Will Recommend", section: "Recommendation" },
];

const SINGLE_CHOICE_FIELDS: { key: string; label: string }[] = [
  { key: "discoverySource", label: "Discovery Source" },
  { key: "customizationTimeFeel", label: "Customization Time Feel" },
  { key: "firstImpression", label: "First Impression" },
  { key: "expectedPriceRange", label: "Expected Price Range" },
  { key: "preferredPricingModel", label: "Preferred Pricing Model" },
  { key: "mostInfluentialFeature", label: "Most Influential Feature" },
];

const MULTI_CHOICE_FIELDS: { key: string; label: string }[] = [
  { key: "revealEmotions", label: "Reveal Emotions" },
  { key: "ethicalConcerns", label: "Ethical Concerns" },
  { key: "primaryUseCase", label: "Primary Use Case" },
  { key: "targetDemographic", label: "Target Demographic" },
];

const QUALITATIVE_FIELDS: { key: string; label: string }[] = [
  { key: "additionalFeedback", label: "Additional Feedback" },
  { key: "missingCustomization", label: "Missing Customization" },
  { key: "biggestConcern", label: "Biggest Concern" },
  { key: "mostMemorableMoment", label: "Most Memorable Moment" },
  { key: "improvementSuggestion", label: "Improvement Suggestion" },
];

const POSITIVE_RE =
  /(love|suka|bagus|amazing|incredible|beautiful|great|perfect|excited|senang|impressive|fantastic|keren|mantap|hebat|indah|wow|luar biasa|menakjubkan)/i;
const NEGATIVE_RE =
  /(hate|worst|bad|terrible|awful|concern|worried|worry|scary|takut|khawatir|kurang|buruk|jelek|creepy|uncomfortable|tidak nyaman|aneh|tidak suka)/i;

function sentimentOf(text: string): "positive" | "negative" | "neutral" {
  const pos = POSITIVE_RE.test(text);
  const neg = NEGATIVE_RE.test(text);
  if (pos && !neg) return "positive";
  if (neg && !pos) return "negative";
  return "neutral";
}

export async function GET(req: Request) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const surveys = await prisma.surveyResult.findMany({
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          age: true,
          relationshipStatus: true,
          companionConfig: { select: { role: true, gender: true } },
        },
      },
    },
  });

  // Likert histograms (1..5)
  const likertHistograms = LIKERT_FIELDS.map((f) => {
    const buckets = Array.from({ length: 5 }, (_, i) => ({
      score: i + 1,
      count: 0,
    }));
    const values: number[] = [];
    for (const s of surveys) {
      const raw = (s as unknown as Record<string, unknown>)[f.key];
      if (typeof raw === "number" && raw >= 1 && raw <= 5) {
        buckets[raw - 1].count++;
        values.push(raw);
      }
    }
    const mean =
      values.length > 0 ? values.reduce((a, v) => a + v, 0) / values.length : 0;
    const sorted = [...values].sort((a, b) => a - b);
    const median =
      sorted.length === 0
        ? 0
        : sorted.length % 2
          ? sorted[(sorted.length - 1) / 2]
          : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    return {
      ...f,
      buckets,
      mean,
      median,
      n: values.length,
    };
  });

  // Single-choice distributions
  const singleChoice = SINGLE_CHOICE_FIELDS.map((f) => {
    const counts = new Map<string, number>();
    for (const s of surveys) {
      const v = (s as unknown as Record<string, unknown>)[f.key];
      if (typeof v === "string" && v.trim() !== "") {
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
    }
    return {
      ...f,
      buckets: Array.from(counts, ([label, count]) => ({ label, count })).sort(
        (a, b) => b.count - a.count,
      ),
    };
  });

  // Multi-choice (JSON arrays stored as strings)
  const multiChoice = MULTI_CHOICE_FIELDS.map((f) => {
    const counts = new Map<string, number>();
    for (const s of surveys) {
      const raw = (s as unknown as Record<string, unknown>)[f.key];
      if (typeof raw !== "string" || !raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const v of parsed) {
            if (typeof v === "string" && v.trim() !== "") {
              counts.set(v, (counts.get(v) ?? 0) + 1);
            }
          }
        }
      } catch {
        // ignore malformed row
      }
    }
    return {
      ...f,
      buckets: Array.from(counts, ([label, count]) => ({ label, count })).sort(
        (a, b) => b.count - a.count,
      ),
    };
  });

  // Qualitative responses with lightweight sentiment tagging
  const qualitative = QUALITATIVE_FIELDS.map((f) => {
    const items: {
      userId: string;
      fullName: string;
      content: string;
      sentiment: "positive" | "negative" | "neutral";
      createdAt: string;
      role: string | null;
    }[] = [];
    for (const s of surveys) {
      const content = (s as unknown as Record<string, unknown>)[f.key];
      if (typeof content === "string" && content.trim().length > 2) {
        items.push({
          userId: s.user.id,
          fullName: s.user.fullName,
          content: content.trim(),
          sentiment: sentimentOf(content),
          createdAt: s.createdAt.toISOString(),
          role: s.user.companionConfig?.role ?? null,
        });
      }
    }
    const sentimentCounts = {
      positive: items.filter((i) => i.sentiment === "positive").length,
      negative: items.filter((i) => i.sentiment === "negative").length,
      neutral: items.filter((i) => i.sentiment === "neutral").length,
    };
    return { ...f, items, sentimentCounts };
  });

  // Cross-tab: overall experience by role (average)
  const experienceByRole = new Map<string, { sum: number; n: number }>();
  for (const s of surveys) {
    const role = s.user.companionConfig?.role ?? "unknown";
    if (typeof s.overallExperience === "number") {
      const b = experienceByRole.get(role) ?? { sum: 0, n: 0 };
      b.sum += s.overallExperience;
      b.n++;
      experienceByRole.set(role, b);
    }
  }
  const experienceByRoleArr = Array.from(experienceByRole, ([role, b]) => ({
    role,
    avg: b.n > 0 ? b.sum / b.n : 0,
    n: b.n,
  }));

  return Response.json({
    totalSurveys: surveys.length,
    likertHistograms,
    singleChoice,
    multiChoice,
    qualitative,
    experienceByRole: experienceByRoleArr,
  });
}
