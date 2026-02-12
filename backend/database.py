from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from config import settings
import logging

logger = logging.getLogger(__name__)


class MongoDB:
    """MongoDB connection manager"""
    
    def __init__(self):
        self.client: AsyncIOMotorClient = None
        self.db = None
    
    async def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URI)
            self.db = self.client[settings.MONGODB_DB_NAME]
            
            # Test the connection
            await self.client.admin.command('ping')
            logger.info(f"Connected to MongoDB: {settings.MONGODB_DB_NAME}")
            
            # Create indexes
            await self.create_indexes()
            
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    async def create_indexes(self):
        """Create necessary indexes"""
        # Index for queries collection
        await self.db.queries.create_index("created_at")
        await self.db.queries.create_index("user_id")
        
        # Index for responses collection
        await self.db.responses.create_index("query_id")
        await self.db.responses.create_index([("query_id", 1), ("model_name", 1)])
        
        # Index for ratings collection
        await self.db.ratings.create_index([("query_id", 1), ("response_id", 1)])
        
        logger.info("MongoDB indexes created successfully")
    
    async def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    def get_collection(self, collection_name: str):
        """Get a collection from the database"""
        return self.db[collection_name]


# Global MongoDB instance
mongodb = MongoDB()
