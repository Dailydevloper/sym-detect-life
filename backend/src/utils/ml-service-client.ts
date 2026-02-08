// ML Service Client - communicates with Python inference service
import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

export interface MLPrediction {
  disease: string;
  confidence: number;
  rank: number;
}

export interface MLPredictionResponse {
  predictions: MLPrediction[];
  top_prediction: MLPrediction | null;
  symptoms_matched: string[];
}

class MLServiceClient {
  private baseURL: string;
  private timeout: number;
  private isAvailable: boolean = false;

  constructor() {
    this.baseURL = ML_SERVICE_URL;
    this.timeout = 5000; // 5 seconds
    this.checkHealth();
  }

  // Check if ML service is available
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 2000,
      });
      this.isAvailable = response.data.model_loaded === true;
      if (this.isAvailable) {
        console.log("✅ ML Service is available");
      }
      return this.isAvailable;
    } catch (error) {
      this.isAvailable = false;
      console.warn(
        "⚠️  ML Service is not available:",
        (error as Error).message,
      );
      return false;
    }
  }

  // Get ML predictions for symptoms
  async predict(symptoms: string[]): Promise<MLPredictionResponse | null> {
    if (!this.isAvailable) {
      await this.checkHealth();
      if (!this.isAvailable) {
        return null;
      }
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/predict`,
        { symptoms },
        { timeout: this.timeout },
      );
      return response.data;
    } catch (error) {
      console.error("❌ ML prediction error:", (error as Error).message);
      this.isAvailable = false;
      return null;
    }
  }

  // Get all known symptoms from ML model
  async getSymptoms(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseURL}/symptoms`, {
        timeout: this.timeout,
      });
      return response.data.symptoms || [];
    } catch (error) {
      console.error("❌ Error fetching symptoms:", (error as Error).message);
      return [];
    }
  }

  // Get all known diseases from ML model
  async getDiseases(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseURL}/diseases`, {
        timeout: this.timeout,
      });
      return response.data.diseases || [];
    } catch (error) {
      console.error("❌ Error fetching diseases:", (error as Error).message);
      return [];
    }
  }

  getAvailability(): boolean {
    return this.isAvailable;
  }
}

// Singleton instance
let instance: MLServiceClient | null = null;

export function getMLServiceClient(): MLServiceClient {
  if (!instance) {
    instance = new MLServiceClient();
  }
  return instance;
}
