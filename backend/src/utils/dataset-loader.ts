import fs from "fs";
import path from "path";

export interface DiseaseSymptoms {
  disease: string;
  symptoms: string[];
}

export interface SymptomSeverity {
  symptom: string;
  weight: number;
}

export interface DiseaseInfo {
  disease: string;
  description: string;
  precautions: string[];
}

// Parse CSV helper
function parseCSV(filepath: string): string[][] {
  const content = fs.readFileSync(filepath, "utf-8");
  const lines = content.trim().split("\n");
  return lines.map((line) => {
    // Handle CSV with quoted fields
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    return fields;
  });
}

class DatasetLoader {
  private datasetPath: string;
  private diseaseSymptoms: Map<string, string[]> = new Map();
  private symptomSeverity: Map<string, number> = new Map();
  private diseaseDescriptions: Map<string, string> = new Map();
  private diseasePrecautions: Map<string, string[]> = new Map();
  private allSymptoms: Set<string> = new Set();
  private loaded = false;

  constructor() {
    this.datasetPath = path.join(process.cwd(), "dataset");
  }

  // Load all dataset files
  load(): void {
    if (this.loaded) return;

    try {
      this.loadDiseaseSymptoms();
      this.loadSymptomSeverity();
      this.loadDiseaseDescriptions();
      this.loadDiseasePrecautions();
      this.loaded = true;
      console.log("✅ Dataset loaded successfully");
      console.log(`📊 Diseases: ${this.diseaseSymptoms.size}`);
      console.log(`📊 Unique symptoms: ${this.allSymptoms.size}`);
    } catch (error) {
      console.error("❌ Error loading dataset:", error);
      throw error;
    }
  }

  // Load disease -> symptoms mapping from dataset.csv
  private loadDiseaseSymptoms(): void {
    const filepath = path.join(this.datasetPath, "dataset.csv");
    const rows = parseCSV(filepath);

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const disease = row[0];
      const symptoms: string[] = [];

      // Extract symptoms from Symptom_1 to Symptom_17 columns
      for (let j = 1; j < row.length; j++) {
        const symptom = row[j].trim();
        if (symptom && symptom !== "") {
          const cleanSymptom = symptom.replace(/_/g, " ").toLowerCase();
          symptoms.push(cleanSymptom);
          this.allSymptoms.add(cleanSymptom);
        }
      }

      if (symptoms.length > 0) {
        this.diseaseSymptoms.set(disease, symptoms);
      }
    }
  }

  // Load symptom severity weights
  private loadSymptomSeverity(): void {
    const filepath = path.join(this.datasetPath, "Symptom-severity.csv");
    if (!fs.existsSync(filepath)) {
      console.warn(
        "⚠️  Symptom severity file not found, using default weights",
      );
      return;
    }

    const rows = parseCSV(filepath);

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 2) {
        const symptom = row[0].replace(/_/g, " ").toLowerCase().trim();
        const weight = parseInt(row[1]) || 1;
        this.symptomSeverity.set(symptom, weight);
      }
    }
  }

  // Load disease descriptions
  private loadDiseaseDescriptions(): void {
    const filepath = path.join(this.datasetPath, "symptom_Description.csv");
    const rows = parseCSV(filepath);

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 2) {
        const disease = row[0].trim();
        const description = row[1].trim();
        this.diseaseDescriptions.set(disease, description);
      }
    }
  }

  // Load disease precautions
  private loadDiseasePrecautions(): void {
    const filepath = path.join(this.datasetPath, "symptom_precaution.csv");
    const rows = parseCSV(filepath);

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 2) {
        const disease = row[0].trim();
        const precautions: string[] = [];

        // Extract precautions from columns 1-4
        for (let j = 1; j <= 4 && j < row.length; j++) {
          const precaution = row[j].trim();
          if (precaution && precaution !== "") {
            precautions.push(precaution);
          }
        }

        this.diseasePrecautions.set(disease, precautions);
      }
    }
  }

  // Get all symptoms for a disease
  getSymptomsForDisease(disease: string): string[] {
    return this.diseaseSymptoms.get(disease) || [];
  }

  // Get severity weight for a symptom
  getSymptomSeverity(symptom: string): number {
    const normalized = symptom.toLowerCase().trim();
    return this.symptomSeverity.get(normalized) || 1;
  }

  // Get description for a disease
  getDiseaseDescription(disease: string): string | undefined {
    return this.diseaseDescriptions.get(disease);
  }

  // Get precautions for a disease
  getDiseasePrecautions(disease: string): string[] {
    return this.diseasePrecautions.get(disease) || [];
  }

  // Get all diseases
  getAllDiseases(): string[] {
    return Array.from(this.diseaseSymptoms.keys());
  }

  // Get all symptoms
  getAllSymptoms(): string[] {
    return Array.from(this.allSymptoms);
  }

  // Find diseases matching given symptoms
  findMatchingDiseases(userSymptoms: string[]): Array<{
    disease: string;
    matchScore: number;
    matchedSymptoms: string[];
    totalSymptoms: number;
  }> {
    const normalizedUserSymptoms = userSymptoms.map((s) =>
      s
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " "),
    );

    const matches: Array<{
      disease: string;
      matchScore: number;
      matchedSymptoms: string[];
      totalSymptoms: number;
    }> = [];

    for (const [disease, symptoms] of this.diseaseSymptoms.entries()) {
      const matchedSymptoms: string[] = [];
      let matchScore = 0;

      for (const diseaseSymptom of symptoms) {
        const normalizedDiseaseSymptom = diseaseSymptom
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s]/g, "")
          .replace(/\s+/g, " ");

        for (const userSymptom of normalizedUserSymptoms) {
          // Check for exact match or substring match
          if (
            userSymptom === normalizedDiseaseSymptom ||
            userSymptom.includes(normalizedDiseaseSymptom) ||
            normalizedDiseaseSymptom.includes(userSymptom) ||
            this.calculateSimilarity(userSymptom, normalizedDiseaseSymptom) >
              0.7
          ) {
            matchedSymptoms.push(diseaseSymptom);
            const severity = this.getSymptomSeverity(diseaseSymptom);
            matchScore += severity;
            break;
          }
        }
      }

      if (matchedSymptoms.length > 0) {
        matches.push({
          disease,
          matchScore,
          matchedSymptoms,
          totalSymptoms: symptoms.length,
        });
      }
    }

    // Sort by match score (descending)
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  // Calculate string similarity (Levenshtein-based)
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;
    if (longer.includes(shorter)) return 0.8;

    const editDistance = this.levenshteinDistance(str1, str2);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
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
}

// Singleton instance
let instance: DatasetLoader | null = null;

export function getDatasetLoader(): DatasetLoader {
  if (!instance) {
    instance = new DatasetLoader();
    instance.load();
  }
  return instance;
}
