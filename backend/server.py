
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

# ============ OBJECT STORAGE (replaces Emergent Object Storage) ============
# Uses Cloudflare R2 (S3-compatible, generous free tier, no egress fees) when
# R2 credentials are set. Falls back to local disk automatically if they're
# not configured yet (handy for local testing) -- but local disk is NOT
# persistent on Render's free tier, so set the R2 env vars for production.
R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')
R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME')

STORAGE_DIR = Path(os.environ.get('STORAGE_DIR', str(ROOT_DIR / 'storage')))

_r2_client = None
USE_R2 = bool(R2_ACCOUNT_ID and R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY and R2_BUCKET_NAME)

if USE_R2:
    import boto3
    from botocore.config import Config as BotoConfig
    _r2_client = boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=BotoConfig(signature_version="s3v4"),
        region_name="auto",
    )
else:
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)

def put_object(path: str, data: bytes, content_type: str = "application/octet-stream") -> dict:
    if USE_R2:
        _r2_client.put_object(Bucket=R2_BUCKET_NAME, Key=path, Body=data, ContentType=content_type)
        return {"path": path, "size": len(data)}
    full_path = STORAGE_DIR / path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    full_path.write_bytes(data)
    return {"path": path, "size": len(data)}

def get_object(path: str):
    if USE_R2:
        try:
            obj = _r2_client.get_object(Bucket=R2_BUCKET_NAME, Key=path)
            return obj["Body"].read(), obj.get("ContentType", "application/octet-stream")
        except _r2_client.exceptions.NoSuchKey:
            raise HTTPException(status_code=404, detail="File not found")
    full_path = STORAGE_DIR / path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    content_type = mimetypes.guess_type(str(full_path))[0] or "application/octet-st
# ============ MODELS ============= 



class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    bio: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    area_code: Optional[str] = None
    preferences: Optional[Dict] = None
    is_verified: bool = False
    is_premium: bool = False
    premium_plan: Optional[str] = None
    residency_proof_url: Optional[str] = None
    approval_status: str = "pending"  # pending, approved, rejected
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    security_question: Optional[str] = None
    created_at: str

class UserRegistration(BaseModel):
    email: EmailStr
    password: str
    name: str
    age: int
    gender: str
    location: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class SessionData(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None

class MessageCreate(BaseModel):
    recipient_id: str
    content: str

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str
    sender_id: str
    recipient_id: str
    content: str
    is_read: bool
    created_at: str

class ForumCreate(BaseModel):
    title: str
    description: str
    category: str

class Forum(BaseModel):
    model_config = ConfigDict(extra="ignore")
    forum_id: str
    title: str
    description: str
    category: str
    created_by: str
    created_at: str

class ForumPostCreate(BaseModel):
    content:
