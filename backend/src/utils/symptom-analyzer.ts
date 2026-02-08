// Hybrid symptom analysis system (Rule-based + Dataset-based)
import { getDatasetLoader } from "./dataset-loader";

interface Condition {
  name: string;
  requiredSymptoms: string[];
  optionalSymptoms: string[];
  severity: "low" | "medium" | "high";
  recommendations: string[];
  confidence_threshold: number;
}

export interface AnalysisResult {
  condition: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  recommendations: string[];
  matchedSymptoms: string[];
  datasetMatch?: boolean;
  description?: string;
}

// Medical knowledge base - expandable database
const CONDITIONS: Condition[] = [
  {
    name: "Common Cold",
    requiredSymptoms: ["runny nose", "sneezing"],
    optionalSymptoms: [
      "sore throat",
      "cough",
      "congestion",
      "headache",
      "fatigue",
      "mild fever",
    ],
    severity: "low",
    recommendations: [
      "Get plenty of rest (7-9 hours of sleep)",
      "Stay well hydrated (8-10 glasses of water daily)",
      "Use over-the-counter pain relievers if needed",
      "Use saline nasal drops for congestion",
      "Symptoms should improve within 7-10 days",
      "Consult a doctor if symptoms worsen or persist beyond 10 days",
    ],
    confidence_threshold: 0.4,
  },
  {
    name: "Flu (Influenza)",
    requiredSymptoms: ["fever", "fatigue"],
    optionalSymptoms: [
      "body aches",
      "chills",
      "headache",
      "cough",
      "sore throat",
      "runny nose",
      "vomiting",
      "diarrhea",
    ],
    severity: "medium",
    recommendations: [
      "Rest and sleep as much as possible",
      "Drink plenty of fluids to prevent dehydration",
      "Take fever-reducing medications (acetaminophen or ibuprofen)",
      "Antiviral medications may help if taken within 48 hours",
      "Seek medical attention if breathing difficulties occur",
      "Isolate yourself to prevent spreading to others",
      "Recovery typically takes 1-2 weeks",
    ],
    confidence_threshold: 0.5,
  },
  {
    name: "Allergies (Seasonal)",
    requiredSymptoms: ["sneezing", "itchy eyes"],
    optionalSymptoms: [
      "runny nose",
      "congestion",
      "watery eyes",
      "itchy nose",
      "itchy throat",
      "postnasal drip",
    ],
    severity: "low",
    recommendations: [
      "Use antihistamine medications as directed",
      "Keep windows closed during high pollen days",
      "Use air conditioning with HEPA filters",
      "Shower and change clothes after being outdoors",
      "Consider nasal corticosteroid sprays",
      "Consult an allergist for long-term management",
    ],
    confidence_threshold: 0.45,
  },
  {
    name: "Migraine",
    requiredSymptoms: ["severe headache"],
    optionalSymptoms: [
      "nausea",
      "vomiting",
      "light sensitivity",
      "sound sensitivity",
      "visual disturbances",
      "aura",
      "dizziness",
    ],
    severity: "medium",
    recommendations: [
      "Rest in a quiet, dark room",
      "Apply cold compress to forehead or neck",
      "Take prescribed migraine medications early",
      "Stay hydrated",
      "Avoid known triggers (certain foods, stress, lack of sleep)",
      "Keep a headache diary to identify patterns",
      "Consult a neurologist for frequent migraines",
    ],
    confidence_threshold: 0.5,
  },
  {
    name: "Gastroenteritis (Stomach Flu)",
    requiredSymptoms: ["diarrhea", "nausea"],
    optionalSymptoms: [
      "vomiting",
      "stomach cramps",
      "fever",
      "chills",
      "loss of appetite",
      "headache",
      "fatigue",
    ],
    severity: "medium",
    recommendations: [
      "Stay hydrated with clear fluids and oral rehydration solutions",
      "Rest and avoid solid foods initially",
      "Gradually reintroduce bland foods (BRAT diet: bananas, rice, applesauce, toast)",
      "Avoid dairy, fatty foods, caffeine, and alcohol",
      "Practice good hand hygiene to prevent spread",
      "Seek medical attention if severe dehydration or blood in stool",
      "Symptoms usually resolve within 1-3 days",
    ],
    confidence_threshold: 0.5,
  },
  {
    name: "Sinusitis (Sinus Infection)",
    requiredSymptoms: ["facial pain", "congestion"],
    optionalSymptoms: [
      "facial pressure",
      "headache",
      "thick nasal discharge",
      "reduced sense of smell",
      "cough",
      "fatigue",
      "fever",
      "bad breath",
    ],
    severity: "medium",
    recommendations: [
      "Use saline nasal irrigation or spray",
      "Apply warm compresses to face",
      "Stay hydrated to thin mucus",
      "Use a humidifier to moisten air",
      "Take decongestants or pain relievers",
      "Rest and avoid smoking or air pollutants",
      "See a doctor if symptoms persist beyond 10 days or worsen",
    ],
    confidence_threshold: 0.45,
  },
  {
    name: "Anxiety Attack",
    requiredSymptoms: ["rapid heartbeat", "shortness of breath"],
    optionalSymptoms: [
      "chest pain",
      "dizziness",
      "sweating",
      "trembling",
      "feeling of choking",
      "fear",
      "numbness",
      "tingling",
    ],
    severity: "medium",
    recommendations: [
      "Practice deep breathing exercises (4-7-8 technique)",
      "Ground yourself using 5-4-3-2-1 sensory technique",
      "Remove yourself from triggering situation if possible",
      "Use progressive muscle relaxation",
      "Reach out to a trusted person for support",
      "Consider professional therapy (CBT is highly effective)",
      "Seek emergency care if chest pain is severe",
    ],
    confidence_threshold: 0.5,
  },
  {
    name: "Strep Throat",
    requiredSymptoms: ["sore throat", "difficulty swallowing"],
    optionalSymptoms: [
      "fever",
      "swollen lymph nodes",
      "red tonsils",
      "white patches in throat",
      "headache",
      "rash",
      "loss of appetite",
    ],
    severity: "medium",
    recommendations: [
      "See a doctor for throat swab test and diagnosis",
      "Take full course of prescribed antibiotics",
      "Rest your voice and body",
      "Drink warm liquids (tea with honey, broth)",
      "Gargle with warm salt water",
      "Use throat lozenges or spray for pain relief",
      "Replace your toothbrush after starting antibiotics",
    ],
    confidence_threshold: 0.5,
  },
  {
    name: "Dehydration",
    requiredSymptoms: ["thirst", "dry mouth"],
    optionalSymptoms: [
      "dark urine",
      "fatigue",
      "dizziness",
      "headache",
      "dry skin",
      "rapid heartbeat",
      "confusion",
    ],
    severity: "medium",
    recommendations: [
      "Drink water or oral rehydration solutions immediately",
      "Sip fluids slowly if nauseous",
      "Eat water-rich foods (watermelon, cucumbers)",
      "Avoid caffeine and alcohol",
      "Rest in a cool environment",
      "Seek emergency care if severe symptoms or unable to keep fluids down",
      "Monitor urine color (should be light yellow)",
    ],
    confidence_threshold: 0.4,
  },
  {
    name: "Heat Exhaustion",
    requiredSymptoms: ["excessive sweating", "dizziness"],
    optionalSymptoms: [
      "nausea",
      "headache",
      "fatigue",
      "rapid heartbeat",
      "muscle cramps",
      "cool skin",
      "weakness",
    ],
    severity: "high",
    recommendations: [
      "Move to a cool, shaded or air-conditioned location immediately",
      "Remove excess clothing",
      "Drink cool water or sports drinks",
      "Apply cool, wet cloths to body",
      "Rest and elevate legs slightly",
      "DO NOT give aspirin or acetaminophen",
      "Seek emergency care if symptoms worsen or don't improve within 1 hour",
    ],
    confidence_threshold: 0.5,
  },
];
// Normalize symptoms for better matching
function normalizeSymptom(symptom: string): string {
  return symptom
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

// Calculate similarity between two strings (fuzzy matching)
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  // Check if one string contains the other
  if (longer.includes(shorter)) return 0.8;

  // Calculate Levenshtein distance
  const editDistance = levenshteinDistance(str1, str2);
  return (longer.length - editDistance) / longer.length;
}

// Levenshtein distance algorithm for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Match user symptoms with condition symptoms
function matchSymptoms(
  userSymptoms: string[],
  conditionSymptoms: string[],
): { matchCount: number; matchedSymptoms: string[] } {
  const normalizedUserSymptoms = userSymptoms.map(normalizeSymptom);
  let matchCount = 0;
  const matchedSymptoms: string[] = [];

  for (const condSymptom of conditionSymptoms) {
    const normalizedCondSymptom = normalizeSymptom(condSymptom);

    for (const userSymptom of normalizedUserSymptoms) {
      const similarity = calculateSimilarity(
        userSymptom,
        normalizedCondSymptom,
      );

      // If similarity is above 70%, consider it a match
      if (similarity > 0.7) {
        matchCount++;
        matchedSymptoms.push(condSymptom);
        break;
      }
    }
  }

  return { matchCount, matchedSymptoms };
}

// Main hybrid analysis function (combines rules + dataset)
export function analyzeSymptoms(symptoms: string[]): AnalysisResult {
  if (!symptoms || symptoms.length === 0) {
    return {
      condition: "No Symptoms Provided",
      severity: "low",
      confidence: 0,
      recommendations: [
        "Please add at least one symptom to receive a diagnosis",
        "Describe what you are feeling as specifically as possible",
      ],
      matchedSymptoms: [],
    };
  }

  let bestMatch: AnalysisResult | null = null;
  let highestConfidence = 0;

  // STEP 1: Rule-based analysis
  for (const condition of CONDITIONS) {
    // Match required symptoms
    const requiredMatch = matchSymptoms(symptoms, condition.requiredSymptoms);

    // If not enough required symptoms match, skip this condition
    const requiredMatchRate =
      requiredMatch.matchCount / condition.requiredSymptoms.length;
    if (requiredMatchRate < 0.5) {
      continue; // Need at least 50% of required symptoms
    }

    // Match optional symptoms
    const optionalMatch = matchSymptoms(symptoms, condition.optionalSymptoms);

    // Calculate confidence score
    const totalPossibleMatches =
      condition.requiredSymptoms.length + condition.optionalSymptoms.length;
    const totalMatches = requiredMatch.matchCount + optionalMatch.matchCount;

    let confidence = totalMatches / totalPossibleMatches;

    // Boost confidence if required symptoms match well
    if (requiredMatchRate >= 0.8) {
      confidence += 0.1;
    }

    // Cap at 95% (never 100% certain without proper medical diagnosis)
    confidence = Math.min(confidence, 0.95);

    // Only consider if confidence meets threshold
    if (
      confidence >= condition.confidence_threshold &&
      confidence > highestConfidence
    ) {
      highestConfidence = confidence;
      bestMatch = {
        condition: condition.name,
        severity: condition.severity,
        confidence: Math.round(confidence * 100),
        recommendations: condition.recommendations,
        matchedSymptoms: [
          ...requiredMatch.matchedSymptoms,
          ...optionalMatch.matchedSymptoms,
        ],
        datasetMatch: false,
      };
    }
  }

  // STEP 2: Dataset-based analysis
  try {
    const datasetLoader = getDatasetLoader();
    const datasetMatches = datasetLoader.findMatchingDiseases(symptoms);

    if (datasetMatches.length > 0) {
      const topMatch = datasetMatches[0];

      // Improved confidence calculation
      const matchCount = topMatch.matchedSymptoms.length;
      const userSymptomCount = symptoms.length;
      const diseaseSymptomCount = topMatch.totalSymptoms;

      // Score based on: how many user symptoms matched / total disease symptoms
      // Higher scores if few symptoms match a disease with few symptoms (more specific)
      const matchRatio = matchCount / diseaseSymptomCount;
      const userCoverageRatio = matchCount / userSymptomCount;

      // Weighted combination (0-100 scale)
      let datasetConfidence = (matchRatio * 0.6 + userCoverageRatio * 0.4) * 100;

      // Boost if majority of user symptoms matched
      if (userCoverageRatio >= 0.8) {
        datasetConfidence = Math.min(datasetConfidence + 15, 90);
      } else if (userCoverageRatio >= 0.6) {
        datasetConfidence = Math.min(datasetConfidence + 10, 85);
      }

      // Cap at 90% for dataset matches
      datasetConfidence = Math.min(datasetConfidence, 90);

      // Use dataset match if better than rule-based
      if (datasetConfidence > highestConfidence) {
        const description = datasetLoader.getDiseaseDescription(
          topMatch.disease,
        );
        const precautions = datasetLoader.getDiseasePrecautions(
          topMatch.disease,
        );

        // Map precautions to recommendations format
        const recommendations =
          precautions.length > 0
            ? precautions.map((p) => capitalizeFirst(p))
            : [
                "Consult a healthcare provider for proper diagnosis",
                "Monitor your symptoms closely",
                "Keep a record of symptom changes",
                "Seek immediate medical attention if symptoms worsen",
              ];

        // Determine severity based on match quality
        const severity: "low" | "medium" | "high" =
          datasetConfidence >= 75 ? "high"
          : datasetConfidence >= 50 ? "medium"
          : "low";

        bestMatch = {
          condition: topMatch.disease,
          severity,
          confidence: Math.round(datasetConfidence),
          recommendations,
          matchedSymptoms: topMatch.matchedSymptoms,
          datasetMatch: true,
          description,
        };
        highestConfidence = datasetConfidence;
      }
    }
  } catch (error) {
    console.warn(
      "⚠️  Dataset analysis failed, using rule-based only:",
      error,
    );
  }
        };
        highestConfidence = datasetConfidence * 100;
      }
    }
  } catch (error) {
    console.warn("⚠️  Dataset analysis failed, using rule-based only:", error);
  }

  // If no good match found, return general advice
  if (!bestMatch) {
    return {
      condition: "Unable to Determine",
      severity: "low",
      confidence: 0,
      recommendations: [
        "Your symptoms don't match our condition database",
        "Keep monitoring your symptoms and note any changes",
        "Stay hydrated and get adequate rest",
        "Consult a healthcare provider for proper diagnosis",
        "Seek immediate medical attention if symptoms worsen or include severe pain, high fever, difficulty breathing, or chest pain",
      ],
      matchedSymptoms: [],
    };
  }

  return bestMatch;
}

// Helper to capitalize first letter
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Get common symptoms for autocomplete feature (combines rules + dataset)
export function getCommonSymptoms(): string[] {
  const symptomsSet = new Set<string>();

  // Add rule-based symptoms
  CONDITIONS.forEach((condition) => {
    condition.requiredSymptoms.forEach((s) => symptomsSet.add(s));
    condition.optionalSymptoms.forEach((s) => symptomsSet.add(s));
  });

  // Add dataset symptoms
  try {
    const datasetLoader = getDatasetLoader();
    const datasetSymptoms = datasetLoader.getAllSymptoms();
    datasetSymptoms.forEach((s) => symptomsSet.add(s));
  } catch (error) {
    console.warn("⚠️  Could not load dataset symptoms:", error);
  }

  return Array.from(symptomsSet).sort();
}
