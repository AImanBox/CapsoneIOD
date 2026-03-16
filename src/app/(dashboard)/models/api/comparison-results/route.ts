/**
 * @file route.ts
 * @description API endpoint for model comparison results
 * @module src/app/(dashboard)/models/api/comparison-results/route
 * @category Story10/ModelComparison
 */

import { NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';

/**
 * GET /api/comparison-results
 *
 * Returns comparison metrics between models trained on:
 * - machine_failure.csv (10K samples)
 * - train.csv (7K samples)
 *
 * @returns Comparison data with metrics and differences
 */
export async function GET() {
  try {
    // Path to comparison results JSON
    const comparisonPath = path.join(process.cwd(), 'ml/models/model_comparison_results.json');

    // Check if file exists
    if (!fs.existsSync(comparisonPath)) {
      console.warn('Comparison results file not found at:', comparisonPath);
      
      // Return mock data for development
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        xgboost: {
          machine_failure: {
            model: 'XGBoost',
            rocAuc: 0.9969,
            precision: 1.0,
            recall: 0.9706,
            f1Score: 0.9851,
            accuracy: 0.999,
            confusionMatrix: {
              tn: 1932,
              fp: 0,
              fn: 2,
              tp: 66,
            },
          },
          train: {
            model: 'XGBoost',
            rocAuc: 0.9753,
            precision: 1.0,
            recall: 0.9362,
            f1Score: 0.967,
            accuracy: 0.9979,
            confusionMatrix: {
              tn: 1353,
              fp: 0,
              fn: 3,
              tp: 44,
            },
          },
          differences: {
            rocAuc: -0.0216,
            precision: 0.0,
            recall: -0.0344,
            f1Score: -0.0181,
            accuracy: -0.0011,
          },
        },
        lightgbm: {
          machine_failure: {
            model: 'LightGBM',
            rocAuc: 0.9916,
            precision: 1.0,
            recall: 0.9706,
            f1Score: 0.9851,
            accuracy: 0.999,
            confusionMatrix: {
              tn: 1932,
              fp: 0,
              fn: 2,
              tp: 66,
            },
          },
          train: {
            model: 'LightGBM',
            rocAuc: 0.9655,
            precision: 1.0,
            recall: 0.9362,
            f1Score: 0.967,
            accuracy: 0.9979,
            confusionMatrix: {
              tn: 1353,
              fp: 0,
              fn: 3,
              tp: 44,
            },
          },
          differences: {
            rocAuc: -0.0261,
            precision: 0.0,
            recall: -0.0344,
            f1Score: -0.0181,
            accuracy: -0.0011,
          },
        },
      });
    }

    // Read and return comparison results
    const comparisonData = await fs.readJson(comparisonPath);
    return NextResponse.json(comparisonData);
  } catch (error) {
    console.error('Error loading comparison results:', error);
    return NextResponse.json(
      { error: 'Failed to load comparison results' },
      { status: 500 }
    );
  }
}
