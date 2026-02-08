import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { query } from "../db";
import { authenticate } from "../middleware/auth";
import { AuthRequest } from "../types";
import { analyzeSymptoms } from "../utils/symptom-analyzer";
import { getMLServiceClient } from "../utils/ml-service-client";
import { getDatasetLoader } from "../utils/dataset-loader";

const router = Router();

// Get user's symptom checks
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      "SELECT * FROM symptom_checks WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user!.id],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get symptom checks error:", error);
    res.status(500).json({ error: "Failed to fetch symptom checks" });
  }
});

// Get single symptom check
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      "SELECT * FROM symptom_checks WHERE id = $1 AND user_id = $2",
      [id, req.user!.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Symptom check not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get symptom check error:", error);
    res.status(500).json({ error: "Failed to fetch symptom check" });
  }
});

// Create symptom check with ML + Hybrid Analysis
router.post(
  "/",
  authenticate,
  [body("symptoms").isArray({ min: 1 })],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { symptoms } = req.body;

      // STEP 1: Hybrid analysis (rules + dataset)
      const hybridDiagnosis = analyzeSymptoms(symptoms);

      // STEP 2: Try ML prediction (if available)
      let finalDiagnosis = hybridDiagnosis;
      let mlPrediction = null;

      try {
        const mlClient = getMLServiceClient();
        const mlResult = await mlClient.predict(symptoms);

        if (mlResult && mlResult.top_prediction) {
          mlPrediction = mlResult.top_prediction;

          // If ML confidence is higher than hybrid AND meets minimum threshold, use ML
          // Only prefer ML if: confident enough (>45%) AND notably better than hybrid (>8%)
          const mlSignificantlyBetter =
            mlPrediction.confidence > hybridDiagnosis.confidence + 8;
          const mlConfidentEnough = mlPrediction.confidence > 45;

          if (mlSignificantlyBetter && mlConfidentEnough) {
            console.log(
              `🤖 Using ML prediction: ${mlPrediction.disease} (${mlPrediction.confidence}%)`,
            );

            // Get additional info from dataset
            const datasetLoader = getDatasetLoader();
            const description = datasetLoader.getDiseaseDescription(
              mlPrediction.disease,
            );
            const precautions = datasetLoader.getDiseasePrecautions(
              mlPrediction.disease,
            );

            // Map precautions to recommendations
            const recommendations =
              precautions.length > 0
                ? precautions
                : [
                    "Consult a healthcare provider for proper diagnosis",
                    "Monitor your symptoms closely",
                    "Seek immediate medical attention if symptoms worsen",
                  ];

            // Determine severity based on confidence
            const severity: "low" | "medium" | "high" =
              mlPrediction.confidence >= 70
                ? "high"
                : mlPrediction.confidence >= 50
                  ? "medium"
                  : "low";

            finalDiagnosis = {
              condition: mlPrediction.disease,
              severity,
              confidence: mlPrediction.confidence,
              recommendations,
              matchedSymptoms: mlResult.symptoms_matched,
              datasetMatch: false, // ML model used
              description,
            };
          } else {
            console.log(
              `📊 Preferring hybrid analysis (confidence: ${hybridDiagnosis.confidence}%) over ML (${mlPrediction.confidence}%)`,
            );
          }
        }
      } catch (mlError) {
        console.warn(
          "⚠️  ML prediction failed, using hybrid analysis:",
          (mlError as Error).message,
        );
      }

      // Store in database
      const result = await query(
        `INSERT INTO symptom_checks (user_id, symptoms, ai_diagnosis, recommendations, severity_level)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          req.user!.id,
          symptoms,
          finalDiagnosis.condition,
          (finalDiagnosis.recommendations || []).join("; "),
          finalDiagnosis.severity,
        ],
      );

      // Return result with additional diagnosis info
      res.status(201).json({
        ...result.rows[0],
        confidence: finalDiagnosis.confidence,
        matched_symptoms: finalDiagnosis.matchedSymptoms,
        description: finalDiagnosis.description,
        ml_prediction: mlPrediction,
        analysis_method: mlPrediction
          ? "ml"
          : hybridDiagnosis.datasetMatch
            ? "dataset"
            : "rule-based",
      });
    } catch (error) {
      console.error("Create symptom check error:", error);
      res.status(500).json({ error: "Failed to create symptom check" });
    }
  },
);

export default router;
