from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Optional
import uuid
import logging

from config import settings
from database import mongodb
from auth_utils import (
    hash_password, 
    verify_password, 
    create_access_token, 
    get_current_user
)
from models import (
    UserRegister, UserLogin, Token,
    QueryRequest, QueryResponse, RatingRequest,
    ModelStats, HistoryQuery, LLMResponse
)
from openrouter_service import openrouter_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    # Startup
    logger.info("Starting up application...")
    await mongodb.connect()
    yield
    # Shutdown
    logger.info("Shutting down application...")
    await mongodb.close()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTES AUTHENTIFICATION ---

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    existing_user = await mongodb.db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")
    
    new_user = {
        "username": user_data.username,
        "email": user_data.email,
        "hashed_password": hash_password(user_data.password),
        "created_at": datetime.utcnow()
    }
    await mongodb.db.users.insert_one(new_user)
    return {"message": "Utilisateur créé avec succès"}

@app.post("/api/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await mongodb.db.users.find_one({"email": credentials.email})
    
    # Vérification de l'utilisateur et du mot de passe
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        
    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Mot de passe incorrect")
    
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

# --- ROUTES PROTÉGÉES (Nécessitent une connexion) ---

@app.post("/api/query", response_model=QueryResponse)
async def submit_query(
    request: QueryRequest, 
    current_user: dict = Depends(get_current_user) 
):
    try:
        query_id = str(uuid.uuid4())
        start_time = datetime.utcnow()
        
        responses = await openrouter_service.query_multiple_models(
            models=request.models,
            prompt=request.prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        end_time = datetime.utcnow()
        total_time = (end_time - start_time).total_seconds()
        
        # Sauvegarde liée à l'ID réel de l'utilisateur connecté
        query_doc = {
            "_id": query_id,
            "prompt": request.prompt,
            "models": [model.value for model in request.models],
            "user_id": current_user["id"],
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "created_at": start_time,
            "total_response_time": total_time
        }
        await mongodb.db.queries.insert_one(query_doc)
        
        # (Sauvegarde des réponses - identique à votre code)
        for response in responses:
            await mongodb.db.responses.insert_one({
                "_id": str(uuid.uuid4()),
                "query_id": query_id,
                "model_name": response.model_name,
                "content": response.content,
                "success": response.success,
                "created_at": start_time
            })
        
        return QueryResponse(
            query_id=query_id,
            prompt=request.prompt,
            responses=responses,
            created_at=start_time,
            total_response_time=total_time
        )
    except Exception as e:
        logger.error(f"Query error: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@app.get("/api/history", response_model=List[HistoryQuery])
async def get_history(
    current_user: dict = Depends(get_current_user), 
    limit: int = 50
):
    """Récupère uniquement l'historique de l'utilisateur connecté"""
    cursor = mongodb.db.queries.find({"user_id": current_user["id"]}).sort("created_at", -1).limit(limit)
    queries = await cursor.to_list(length=limit)
    
    history = []
    for q in queries:
        history.append(HistoryQuery(
            query_id=q["_id"],
            prompt=q["prompt"],
            models_used=q["models"],
            created_at=q["created_at"],
            has_ratings=False
        ))
    return history

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test MongoDB connection
        await mongodb.client.admin.command('ping')
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unhealthy: {str(e)}"
        )


@app.post("/api/query", response_model=QueryResponse)
async def submit_query(request: QueryRequest):
    """Submit a query to multiple LLMs"""
    try:
        # Generate unique query ID
        query_id = str(uuid.uuid4())
        start_time = datetime.utcnow()
        
        logger.info(f"Processing query {query_id} with {len(request.models)} models")
        
        # Query all models concurrently
        responses = await openrouter_service.query_multiple_models(
            models=request.models,
            prompt=request.prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        end_time = datetime.utcnow()
        total_time = (end_time - start_time).total_seconds()
        
        # Save query to database
        query_doc = {
            "_id": query_id,
            "prompt": request.prompt,
            "models": [model.value for model in request.models],
            "user_id": request.user_id,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "created_at": start_time,
            "total_response_time": total_time
        }
        await mongodb.db.queries.insert_one(query_doc)
        
        # Save responses to database
        for response in responses:
            response_doc = {
                "_id": str(uuid.uuid4()),
                "query_id": query_id,
                "model_name": response.model_name,
                "content": response.content,
                "tokens_used": response.tokens_used,
                "response_time": response.response_time,
                "error": response.error,
                "success": response.success,
                "created_at": start_time
            }
            await mongodb.db.responses.insert_one(response_doc)
        
        logger.info(f"Query {query_id} completed in {total_time:.2f}s")
        
        return QueryResponse(
            query_id=query_id,
            prompt=request.prompt,
            responses=responses,
            created_at=start_time,
            total_response_time=total_time
        )
        
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process query: {str(e)}"
        )


@app.post("/api/rate", status_code=status.HTTP_201_CREATED)
async def rate_response(rating: RatingRequest):
    """Rate a specific model's response"""
    try:
        # Check if query exists
        query = await mongodb.db.queries.find_one({"_id": rating.query_id})
        if not query:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Query not found"
            )
        
        # Check if response exists
        response = await mongodb.db.responses.find_one({
            "query_id": rating.query_id,
            "model_name": rating.response_model
        })
        if not response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Response not found"
            )
        
        # Save rating
        rating_doc = {
            "_id": str(uuid.uuid4()),
            "query_id": rating.query_id,
            "response_id": response["_id"],
            "model_name": rating.response_model,
            "rating": rating.rating,
            "feedback": rating.feedback,
            "user_id": rating.user_id,
            "created_at": datetime.utcnow()
        }
        await mongodb.db.ratings.insert_one(rating_doc)
        
        logger.info(f"Rating saved for query {rating.query_id}, model {rating.response_model}")
        
        return {"message": "Rating saved successfully", "rating_id": rating_doc["_id"]}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving rating: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save rating: {str(e)}"
        )


@app.get("/api/history", response_model=List[HistoryQuery])
async def get_history(user_id: Optional[str] = None, limit: int = 50):
    """Get query history"""
    try:
        query_filter = {}
        if user_id:
            query_filter["user_id"] = user_id
        
        cursor = mongodb.db.queries.find(query_filter).sort("created_at", -1).limit(limit)
        queries = await cursor.to_list(length=limit)
        
        # Check which queries have ratings
        history = []
        for query in queries:
            ratings_count = await mongodb.db.ratings.count_documents({"query_id": query["_id"]})
            
            history.append(HistoryQuery(
                query_id=query["_id"],
                prompt=query["prompt"],
                models_used=query["models"],
                created_at=query["created_at"],
                has_ratings=ratings_count > 0
            ))
        
        return history
        
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch history: {str(e)}"
        )


@app.get("/api/query/{query_id}", response_model=QueryResponse)
async def get_query_details(query_id: str):
    """Get details of a specific query"""
    try:
        # Get query
        query = await mongodb.db.queries.find_one({"_id": query_id})
        if not query:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Query not found"
            )
        
        # Get responses
        cursor = mongodb.db.responses.find({"query_id": query_id})
        responses_docs = await cursor.to_list(length=None)
        
        responses = [
            LLMResponse(
                model_name=r["model_name"],
                content=r["content"],
                tokens_used=r.get("tokens_used"),
                response_time=r["response_time"],
                error=r.get("error"),
                success=r["success"]
            )
            for r in responses_docs
        ]
        
        return QueryResponse(
            query_id=query["_id"],
            prompt=query["prompt"],
            responses=responses,
            created_at=query["created_at"],
            total_response_time=query["total_response_time"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching query details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch query details: {str(e)}"
        )


@app.get("/api/stats", response_model=List[ModelStats])
async def get_statistics():
    """Get statistics for all models"""
    try:
        # Aggregate statistics
        pipeline = [
            {
                "$lookup": {
                    "from": "ratings",
                    "localField": "_id",
                    "foreignField": "response_id",
                    "as": "ratings"
                }
            },
            {
                "$group": {
                    "_id": "$model_name",
                    "total_queries": {"$sum": 1},
                    "avg_response_time": {"$avg": "$response_time"},
                    "success_count": {
                        "$sum": {"$cond": ["$success", 1, 0]}
                    },
                    "total_tokens": {"$sum": {"$ifNull": ["$tokens_used", 0]}},
                    "ratings": {"$push": "$ratings"}
                }
            }
        ]
        
        cursor = mongodb.db.responses.aggregate(pipeline)
        results = await cursor.to_list(length=None)
        
        stats = []
        for result in results:
            # Calculate average rating
            all_ratings = [r["rating"] for ratings_list in result["ratings"] for r in ratings_list]
            avg_rating = sum(all_ratings) / len(all_ratings) if all_ratings else 0
            
            # Calculate success rate
            success_rate = (result["success_count"] / result["total_queries"]) * 100
            
            stats.append(ModelStats(
                model_name=result["_id"],
                total_queries=result["total_queries"],
                average_rating=round(avg_rating, 2),
                average_response_time=round(result["avg_response_time"], 2),
                success_rate=round(success_rate, 2),
                total_tokens_used=result["total_tokens"]
            ))
        
        return stats
        
    except Exception as e:
        logger.error(f"Error fetching statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch statistics: {str(e)}"
        )


@app.get("/api/models")
async def get_available_models():
    """Get list of available models"""
    try:
        models = await openrouter_service.get_available_models()
        return {"models": models}
    except Exception as e:
        logger.error(f"Error fetching models: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch models: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
