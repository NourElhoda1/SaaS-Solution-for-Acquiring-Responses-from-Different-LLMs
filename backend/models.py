from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class ModelProvider(str, Enum):
    """Available Free LLM providers via OpenRouter"""
    
    # Google (Souvent gratuit mais rate-limited, gardez-le)
    GOOGLE_GEMINI = "google/gemini-2.0-flash-exp:free"
    
    # Llama 3.2 (Les petits modèles 1B/3B sont presque toujours gratuits)
    META_LLAMA_3B = "meta-llama/llama-3.2-3b-instruct:free"
    
    # DeepSeek R1 (Très populaire et gratuit en ce moment)
    DEEPSEEK_R1 = "deepseek/deepseek-r1:free"
    
    # Mistral 7B (Le classique, plus stable que Nemo en gratuit)
    MISTRAL_7B = "mistralai/mistral-7b-instruct:free"
    
    # Qwen 2.5 (Excellent modèle open source)
    QWEN_CODER = "qwen/qwen-2.5-coder-32b-instruct:free"
    
    # Phi-3 Mini (Microsoft, petit et gratuit)
    MICROSOFT_PHI = "microsoft/phi-3-mini-128k-instruct:free"

    
class QueryRequest(BaseModel):
    """Request model for submitting a query"""
    prompt: str = Field(..., min_length=1, max_length=5000, description="The user's query")
    models: List[ModelProvider] = Field(..., min_items=1, description="List of models to query")
    user_id: Optional[str] = Field(None, description="Optional user identifier")
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0, description="Temperature for generation")
    max_tokens: Optional[int] = Field(1000, ge=1, le=4000, description="Maximum tokens to generate")


class LLMResponse(BaseModel):
    """Response from a single LLM"""
    model_name: str
    content: str
    tokens_used: Optional[int] = None
    response_time: float
    error: Optional[str] = None
    success: bool = True


class QueryResponse(BaseModel):
    """Complete response with all LLM responses"""
    query_id: str
    prompt: str
    responses: List[LLMResponse]
    created_at: datetime
    total_response_time: float


class RatingRequest(BaseModel):
    """Request to rate a response"""
    query_id: str
    response_model: str
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    feedback: Optional[str] = Field(None, max_length=1000)
    user_id: Optional[str] = None


class ModelStats(BaseModel):
    """Statistics for a specific model"""
    model_name: str
    total_queries: int
    average_rating: float
    average_response_time: float
    success_rate: float
    total_tokens_used: int


class HistoryQuery(BaseModel):
    """Query history item"""
    query_id: str
    prompt: str
    models_used: List[str]
    created_at: datetime
    has_ratings: bool
