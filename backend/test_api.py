"""
Script de test pour le backend LLM Comparison

Ce script teste les endpoints principaux de l'API
"""

import asyncio
import httpx
import json
from datetime import datetime


BASE_URL = "http://localhost:8000"


async def test_health():
    """Test l'endpoint health"""
    print("🔍 Test de l'endpoint /health...")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}\n")


async def test_query():
    """Test l'endpoint de requête"""
    print("🔍 Test de l'endpoint /api/query...")
    
    query_data = {
        "prompt": "Qu'est-ce que l'intelligence artificielle? Réponds en 2 phrases.",
        "models": [
            "google/gemini-pro",
            "meta-llama/llama-3.1-70b-instruct"
        ],
        "temperature": 0.7,
        "max_tokens": 200
    }
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(
                f"{BASE_URL}/api/query",
                json=query_data
            )
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Query ID: {data['query_id']}")
                print(f"   Total time: {data['total_response_time']:.2f}s")
                print(f"   Responses received: {len(data['responses'])}")
                
                for resp in data['responses']:
                    print(f"\n   Model: {resp['model_name']}")
                    print(f"   Success: {resp['success']}")
                    print(f"   Response time: {resp['response_time']:.2f}s")
                    if resp['success']:
                        print(f"   Content preview: {resp['content'][:100]}...")
                    else:
                        print(f"   Error: {resp['error']}")
                
                return data['query_id']
            else:
                print(f"   Error: {response.text}")
                return None
        except Exception as e:
            print(f"   Exception: {e}")
            return None


async def test_rate(query_id: str):
    """Test l'endpoint de rating"""
    print(f"\n🔍 Test de l'endpoint /api/rate...")
    
    rating_data = {
        "query_id": query_id,
        "response_model": "google/gemini-pro",
        "rating": 5,
        "feedback": "Excellente réponse!",
        "user_id": "test_user"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{BASE_URL}/api/rate",
                json=rating_data
            )
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.json()}\n")
        except Exception as e:
            print(f"   Exception: {e}\n")


async def test_history():
    """Test l'endpoint d'historique"""
    print("🔍 Test de l'endpoint /api/history...")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/api/history?limit=5")
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Queries found: {len(data)}")
                
                for query in data[:2]:  # Show first 2
                    print(f"\n   Query ID: {query['query_id']}")
                    print(f"   Prompt: {query['prompt'][:50]}...")
                    print(f"   Models: {', '.join(query['models_used'])}")
                    print(f"   Has ratings: {query['has_ratings']}")
            else:
                print(f"   Error: {response.text}")
        except Exception as e:
            print(f"   Exception: {e}")


async def test_stats():
    """Test l'endpoint de statistiques"""
    print("\n🔍 Test de l'endpoint /api/stats...")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/api/stats")
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Models tracked: {len(data)}")
                
                for stat in data:
                    print(f"\n   Model: {stat['model_name']}")
                    print(f"   Total queries: {stat['total_queries']}")
                    print(f"   Avg rating: {stat['average_rating']}")
                    print(f"   Avg response time: {stat['average_response_time']}s")
                    print(f"   Success rate: {stat['success_rate']}%")
            else:
                print(f"   Error: {response.text}")
        except Exception as e:
            print(f"   Exception: {e}")


async def main():
    """Fonction principale de test"""
    print("=" * 60)
    print("🚀 Tests du Backend LLM Comparison SaaS")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}\n")
    
    try:
        # Test 1: Health check
        await test_health()
        
        # Test 2: Submit query
        query_id = await test_query()
        
        if query_id:
            # Test 3: Rate response
            await test_rate(query_id)
        
        # Test 4: Get history
        await test_history()
        
        # Test 5: Get statistics
        await test_stats()
        
        print("\n" + "=" * 60)
        print("✅ Tests terminés!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Erreur lors des tests: {e}")


if __name__ == "__main__":
    asyncio.run(main())
