
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File, Response, Query, Request, Cookie
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import requests
import mimetypes
import stripe

import asyncio
import httpx

async def keep_alive():
    await asyncio.sleep(60)  # wait 1 min after startup
    while True:
        try:
            async with httpx.AsyncClient() as client:
                await client.get("https://app-backend-6nhy.onrender.com/api/health")
        except:
            pass
        await asyncio.sleep(600)  # ping every 10 minutes




ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-super-secret-jwt-key')
JWT_ALGORITHM = "HS256"

# App name (used to namespace stored file paths)
APP_NAME = os.environ.get('APP_NAME', 'sinsations')

# Stripe
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
stripe.api_key = STRIPE_API_KEY
