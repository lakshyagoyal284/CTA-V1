from fastapi import APIRouter, HTTPException
import json
from pathlib import Path
from backend.evaluate_engine import run_evaluation_benchmark, BENCHMARK_PATH
from backend.app.schemas import BenchmarkEvaluationResponse

router = APIRouter(prefix="/evaluation", tags=["evaluation"])

@router.get("/benchmark", response_model=BenchmarkEvaluationResponse)
def execute_live_benchmark():
    """
    Run reproducible quantitative evaluation live against the synthetic ground-truth corpus.
    Calculates precision, recall, F1, ARI, and processing time.
    """
    try:
        results = run_evaluation_benchmark()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Benchmark execution failed: {str(e)}")

@router.get("/test-cases")
def get_benchmark_test_cases():
    """Retrieve the labeled benchmark test cases for evaluator inspection."""
    if not BENCHMARK_PATH.exists():
        raise HTTPException(status_code=404, detail="Benchmark dataset not found")

    with open(BENCHMARK_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    return {
        "metadata": data.get("benchmark_metadata", {}),
        "test_cases": data.get("test_cases", [])
    }
