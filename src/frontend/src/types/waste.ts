// Aligned with backend WasteType enum
export type WasteType =
  | "Organic"
  | "Plastic"
  | "Metal"
  | "Glass"
  | "Paper"
  | "Liquid"
  | "Medical"
  | "Ewaste"
  | "Toxic"
  | "Unknown";

// Aligned with backend WasteCategory enum
export type WasteCategory =
  | "Biodegradable"
  | "NonBiodegradable"
  | "Hazardous"
  | "Unknown";

export interface PredictionResult {
  wasteType: string;
  confidence: number;
}

export interface ClassificationResult {
  id: string;
  wasteType: WasteType;
  wasteCategory: WasteCategory;
  confidence: number;
  predictions: PredictionResult[];
  recyclingSuggestion: string;
  disposalMethod: string;
  safetyInstructions: string;
  environmentalImpact: string;
  lowConfidence: boolean;
  imageUrl: string;
  createdAt: number;
}

export interface WasteInfo {
  type: WasteType;
  category: WasteCategory;
  icon: string;
  color: string;
  badgeClass: string;
  suggestions: string[];
  description: string;
  disposalMethod: string;
  safetyInstructions: string;
  environmentalImpact: string;
}

export interface AnalyticsResult {
  totalClassifications: number;
  verifiedCount: number;
  correctCount: number;
  avgConfidence: number;
  byMainCategory: Array<[WasteCategory, number]>;
  bySubcategory: Array<[WasteType, number]>;
}

export const WASTE_INFO: Record<WasteType, WasteInfo> = {
  Plastic: {
    type: "Plastic",
    category: "NonBiodegradable",
    icon: "♻️",
    color: "text-blue-600 dark:text-blue-400",
    badgeClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    suggestions: [
      "Rinse containers before recycling",
      "Remove caps and labels",
      "Place in designated plastic recycling bin",
      "Avoid single-use plastics where possible",
    ],
    description:
      "Plastics (PET, HDPE, PVC) can be recycled at most municipal facilities. Check the resin code on the bottom.",
    disposalMethod:
      "Recycle in dry/plastic waste bin at municipal recycling facility",
    safetyInstructions:
      "Wear gloves when handling sharp plastic edges. No special hazard otherwise.",
    environmentalImpact:
      "Plastic takes 100–500 years to decompose. Recycling reduces oil consumption by up to 70%.",
  },
  Paper: {
    type: "Paper",
    category: "Biodegradable",
    icon: "📄",
    color: "text-amber-600 dark:text-amber-400",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    suggestions: [
      "Keep paper dry and clean",
      "Remove staples and plastic windows from envelopes",
      "Flatten cardboard boxes before recycling",
      "Separate newspaper, office paper, and cardboard",
    ],
    description:
      "Paper and cardboard are among the most recyclable materials. Avoid contaminating with food or grease.",
    disposalMethod:
      "Deposit in paper/cardboard recycling bin or community paper collection point",
    safetyInstructions:
      "No special safety precautions needed. Keep dry to maintain recyclability.",
    environmentalImpact:
      "Recycling one tonne of paper saves 17 trees and 7,000 gallons of water.",
  },
  Metal: {
    type: "Metal",
    category: "NonBiodegradable",
    icon: "🔩",
    color: "text-secondary dark:text-secondary",
    badgeClass:
      "bg-secondary/10 text-secondary-foreground border-secondary/20 dark:bg-secondary/20 dark:border-secondary/30",
    suggestions: [
      "Rinse cans and tins before recycling",
      "Take scrap metal to a certified metal recycler",
      "Aluminum cans are infinitely recyclable",
      "Separate ferrous and non-ferrous metals if possible",
    ],
    description:
      "Metals like aluminum and steel are highly valuable recyclables. Scrap metal collection centers accept most metals.",
    disposalMethod:
      "Deposit in metal/dry waste bin or take to a scrap metal collection center",
    safetyInstructions:
      "Wear gloves to avoid cuts from sharp metal edges. Rinse food residue to prevent odors.",
    environmentalImpact:
      "Recycling aluminum saves 95% of the energy needed to produce new aluminum from bauxite ore.",
  },
  Organic: {
    type: "Organic",
    category: "Biodegradable",
    icon: "🌱",
    color: "text-primary dark:text-primary",
    badgeClass:
      "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:border-primary/30",
    suggestions: [
      "Compost food scraps and yard waste",
      "Use a home compost bin or community drop-off",
      "Avoid composting meat, dairy, or oily foods",
      "Finished compost enriches garden soil naturally",
    ],
    description:
      "Organic waste like food scraps and garden trimmings can be composted to create nutrient-rich soil amendments.",
    disposalMethod:
      "Compost bin or wet/organic waste collection. Suitable for municipal composting programs.",
    safetyInstructions:
      "No special precautions needed. Wash hands after handling food waste.",
    environmentalImpact:
      "Composting organic waste reduces landfill methane emissions — methane is 25× more potent than CO₂.",
  },
  Glass: {
    type: "Glass",
    category: "NonBiodegradable",
    icon: "🍾",
    color: "text-cyan-600 dark:text-cyan-400",
    badgeClass:
      "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800",
    suggestions: [
      "Rinse glass containers before disposal",
      "Sort by color: clear, green, brown",
      "Never put broken glass in regular recycling bags",
      "Wrap broken glass in newspaper before binning",
    ],
    description:
      "Glass is 100% recyclable and can be recycled endlessly without quality loss. Color sorting improves recyclability.",
    disposalMethod:
      "Deposit in glass recycling bank or designated glass collection bin",
    safetyInstructions:
      "Handle with care — wear gloves when dealing with broken glass to avoid cuts.",
    environmentalImpact:
      "Recycling glass reduces energy use by 30% and cuts CO₂ emissions significantly per tonne.",
  },
  Liquid: {
    type: "Liquid",
    category: "Hazardous",
    icon: "💧",
    color: "text-sky-600 dark:text-sky-400",
    badgeClass:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
    suggestions: [
      "Never pour chemicals or oils down the drain",
      "Take used cooking oil to community collection points",
      "Store liquid waste in sealed, labelled containers",
      "Contact local council for liquid waste disposal options",
    ],
    description:
      "Liquid waste includes used oils, solvents, and other non-solid materials requiring special handling to prevent contamination.",
    disposalMethod:
      "Take to designated liquid waste collection or hazardous waste facility",
    safetyInstructions:
      "Wear gloves and eye protection. Do NOT mix different liquid wastes. Store in sealed containers.",
    environmentalImpact:
      "One litre of used oil can contaminate up to 1 million litres of groundwater if improperly disposed.",
  },
  Medical: {
    type: "Medical",
    category: "Hazardous",
    icon: "🏥",
    color: "text-rose-600 dark:text-rose-400",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
    suggestions: [
      "Never dispose of sharps in regular bins",
      "Use designated sharps containers",
      "Return unused medications to pharmacies",
      "Use color-coded medical waste bags per local regulations",
    ],
    description:
      "Medical waste includes sharps, bandages, medications, and biohazardous materials requiring strict regulated disposal.",
    disposalMethod:
      "Use certified medical waste disposal services or return-to-pharmacy programs",
    safetyInstructions:
      "Wear gloves and mask. Do NOT recap needles. Use puncture-resistant sharps containers only.",
    environmentalImpact:
      "Improper medical waste disposal spreads pathogens and contaminates soil and water systems.",
  },
  Ewaste: {
    type: "Ewaste",
    category: "Hazardous",
    icon: "💻",
    color: "text-destructive dark:text-destructive",
    badgeClass:
      "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:border-destructive/30",
    suggestions: [
      "Never throw electronics in regular trash",
      "Find a certified e-waste recycling center near you",
      "Donate working devices to charities or schools",
      "Wipe personal data before disposal",
    ],
    description:
      "Electronics contain hazardous materials like lead and mercury. Always use certified e-waste recycling programs.",
    disposalMethod:
      "Take to certified e-waste recycling center or manufacturer take-back program",
    safetyInstructions:
      "Do NOT disassemble unless trained. Wear gloves to avoid heavy metal exposure.",
    environmentalImpact:
      "E-waste leaches lead, cadmium, and mercury into soil and groundwater for decades.",
  },
  Toxic: {
    type: "Toxic",
    category: "Hazardous",
    icon: "☠️",
    color: "text-orange-600 dark:text-orange-400",
    badgeClass:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800",
    suggestions: [
      "Store in original labelled container",
      "Keep away from children and open flames",
      "Take to designated hazardous waste facility",
      "Never mix with other chemicals or waste streams",
    ],
    description:
      "Toxic chemicals and hazardous substances require special handling and must be taken to certified disposal facilities.",
    disposalMethod:
      "Dispose at a certified hazardous waste facility — check your local council for collection points",
    safetyInstructions:
      "Wear gloves, goggles, and a mask. Ensure good ventilation. Never eat or drink near toxic waste.",
    environmentalImpact:
      "Toxic chemicals can persist in ecosystems for decades, entering food chains and causing long-term harm.",
  },
  Unknown: {
    type: "Unknown",
    category: "Unknown",
    icon: "❓",
    color: "text-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground border-border",
    suggestions: [
      "Try uploading a clearer, well-lit image",
      "Ensure the waste item fills most of the frame",
      "Avoid blurry or dark photos",
    ],
    description:
      "Classification was not confident enough. Please try again with a clearer image.",
    disposalMethod:
      "Unable to determine — please re-upload a clearer image for accurate advice.",
    safetyInstructions:
      "Treat as potentially hazardous until identified. Avoid direct skin contact.",
    environmentalImpact:
      "Unidentified waste risks improper disposal — accurate classification helps protect the environment.",
  },
};
