import httpx
import asyncio
import time
from typing import List, Dict, Any
from config import settings
from models import ModelProvider, LLMResponse
import logging

logger = logging.getLogger(__name__)


class OpenRouterService:
    """Service to interact with OpenRouter API"""
    
    def __init__(self):
        self.base_url = settings.OPENROUTER_BASE_URL
        self.api_key = settings.OPENROUTER_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",  
            "X-Title": settings.APP_NAME,  
        }
    
    async def query_model(
        self,
        model: ModelProvider,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> LLMResponse:
        """Query a single model via OpenRouter"""
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                payload = {
                    "model": model.value,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
                
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json=payload
                )
                
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    tokens_used = data.get("usage", {}).get("total_tokens", 0)
                    
                    logger.info(f"Successfully queried {model.value}")
                    
                    return LLMResponse(
                        model_name=model.value,
                        content=content,
                        tokens_used=tokens_used,
                        response_time=response_time,
                        success=True
                    )
                else:
                    error_msg = f"Error {response.status_code}: {response.text}"
                    logger.error(f"Failed to query {model.value}: {error_msg}")
                    
                    return LLMResponse(
                        model_name=model.value,
                        content="",
                        response_time=response_time,
                        error=error_msg,
                        success=False
                    )
                    
        except Exception as e:
            response_time = time.time() - start_time
            error_msg = f"Exception: {str(e)}"
            logger.error(f"Exception querying {model.value}: {error_msg}")
            
            return LLMResponse(
                model_name=model.value,
                content="",
                response_time=response_time,
                error=error_msg,
                success=False
            )
    
    async def query_multiple_models(
        self,
        models: List[ModelProvider],
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> List[LLMResponse]:
        """Query multiple models concurrently"""
        tasks = [
            self.query_model(model, prompt, temperature, max_tokens)
            for model in models
        ]
        
        responses = await asyncio.gather(*tasks)
        return list(responses)
    
    async def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available models from OpenRouter"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/models",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("data", [])
                else:
                    logger.error(f"Failed to get models: {response.status_code}")
                    return []
                    
        except Exception as e:
            logger.error(f"Exception getting models: {e}")
            return []


# Global service instance
openrouter_service = OpenRouterService()
