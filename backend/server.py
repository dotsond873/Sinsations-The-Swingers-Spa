
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
# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: str = Header(None), session_token: str = Cookie(None)) -> User:
    token = None
    
    # Check cookie first, then Authorization header
    if session_token:
        token = session_token
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's a JWT token or session token
    try:
        # Try JWT first
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
    except:
        # Check session in database
        session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if not session_doc:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        # Check expiry
        expires_at = session_doc["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        
        user_id = session_doc["user_id"]
    
    # Get user
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    admin_emails = ["admin@bookup.com", "david@swingerssensation.com", "beth@swingerssensation.com"]
    if current_user.email not in admin_emails:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def require_premium(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_premium:
        raise HTTPException(status_code=403, detail="Premium membership required")
    return current_user

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
async def register(user_data: UserRegistration):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_pw = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "password_hash": hashed_pw,
        "name": user_data.name,
        "age": user_data.age,
        "gender": user_data.gender,
        "location": user_data.location,
        "picture": None,
        "bio": None,
        "preferences": {},
        "is_verified": False,
        "is_premium": True,
        "premium_plan": "free",
        "residency_proof_url": None,
        "approval_status": "approved",
        "approved_by": "auto",
    "approved_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create JWT token
    token = create_jwt_token(user_id, user_data.email)
    
    return {"token": token, "user_id": user_id, "message": "Registration successful. Welcome!"}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user_doc["user_id"], user_doc["email"])
    
    response = JSONResponse(content={"token": token, "user_id": user_doc["user_id"]})
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    return response

    
    return response

@api_router.post("/auth/security-question")
async def set_security_question(payload: SecurityQuestionSet, current_user: User = Depends(get_current_user)):
    q = payload.question.strip()
    a = payload.answer.strip().lower()
    if len(q) < 5:
        raise HTTPException(status_code=400, detail="Question is too short")
    if len(a) < 2:
        raise HTTPException(status_code=400, detail="Answer is too short")
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {
            "security_question": q,
            "security_answer_hash": hash_password(a),
        }}
    )
    return {"message": "Security question saved"}

@api_router.post("/auth/forgot-password/lookup")
async def forgot_password_lookup(payload: ResetLookup):
    user_doc = await db.users.find_one({"email": payload.email})
    # Always return the same shape to avoid leaking whether an email exists
    if not user_doc or not user_doc.get("security_question"):
        return {"question": None, "has_question": False}
    return {"question": user_doc["security_question"], "has_question": True}

@api_router.post("/auth/forgot-password/reset")
async def forgot_password_reset(payload: PasswordResetRequest):
    user_doc = await db.users.find_one({"email": payload.email})
    if not user_doc or not user_doc.get("security_answer_hash"):
        # Generic message to avoid leaking which emails exist
        raise HTTPException(status_code=400, detail="Unable to reset. Verify your email and answer.")

    # Rate limit: max 5 failed attempts per hour
    now = datetime.now(timezone.utc)
    failed = user_doc.get("reset_failed_attempts", [])
    recent_failed = [t for t in failed if datetime.fromisoformat(t) > now - timedelta(hours=1)]
    if len(recent_failed) >= 5:
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in an hour.")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    if not verify_password(payload.answer.strip().lower(), user_doc["security_answer_hash"]):
        recent_failed.append(now.isoformat())
        await db.users.update_one(
            {"user_id": user_doc["user_id"]},
            {"$set": {"reset_failed_attempts": recent_failed}}
        )
        raise HTTPException(status_code=400, detail="Unable to reset. Verify your email and answer.")

    # Success — update password, clear failed attempts
    await db.users.update_one(
        {"user_i
@api_router.get("/members")
async def get_members(
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
    gender: Optional[str] = None,
    q: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    area_code: Optional[str] = None,
    orientation: Optional[str] = None,
    age_range: Optional[str] = None,
):
    import re
    query: Dict[str, Any] = {}
    if gender:
        query["gender"] = gender
    if city:
        query["$or"] = [
            {"city": {"$regex": re.escape(city), "$options": "i"}},
            {"location": {"$regex": re.escape(city), "$options": "i"}},
        ]
    if state:
        query["state"] = state.strip().upper()
    if area_code:
        digits = "".join(c for c in str(area_code) if c.isdigit())
        if digits:
            query["area_code"] = digits
    if orientation:
        query["preferences.orientation"] = orientation
    if age_range:
        query["preferences.age_range"] = age_range
    if q:
        rx = {"$regex": re.escape(q), "$options": "i"}
        text_or = [
            {"name": rx},
            {"city": rx},
            {"state": rx},
            {"location": rx},
            {"area_code": rx},
        ]
        # combine with existing $or if needed
        if "$or" in query:
            query = {"$and": [query, {"$or": text_or}]}
        else:
            query["$or"] = text_or

    members = await db.users.find(
        query,
        {"_id
    return media_list

@api_router.get("/media/{media_id}")
async def get_media(media_id: str, authorization: str = Header(None), auth: str = Query(None)):
    # Support query param for img tags
    auth_header = authorization or (f"Bearer {auth}" if auth else None)
    
    # Get current user
    if not auth_header:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = auth_header.replace("Bearer ", "") if auth_header else None
    
    # Verify user
    try:
        user = await get_current_user(authorization=auth_header if authorization else None, session_token=token if not authorization else None)
    except:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    
    # Get media
    media_doc = await db.media.find_one({"media_id": media_id, "is_deleted": False}, {"_id": 0})
    if not media_doc:
        raise HTTPException(status_code=404, detail="Media not found")
    
    # Check access: owner can always access, others need premium for non-public
    if media_doc["user_id"] != user.user_id:
        if not media_doc.get("is_public", False) and not user.is_premium:
            raise HTTPException(status_code=403, detail="Premium membership required")
    
    data, content_type = get_object(media_doc["storage_path"])
    return Response(content=data, media_type=media_doc.get("content_type", content_type))

@api_router.delete("/media/{media_id}")
async def delete_media(media_id: str, current_user: User = Depends(get_current_user)):
    media_doc = await db.media.find_one({"media_id": media_id, "user_id": current_user.user_id})
    if not media_doc:
        raise HTTPException(status_code=404, detail="Media not found")
    
    await db.media.update_one(
        {"media_id": media_id},
        {"$set": {"is_deleted": True}}
    )
    
    return {"message": "Media deleted"}

# ============ MESSAGING ROUTES ============


# ============ MESSAGING ROUTES ============

@api_router.post("/messages")
async def send_message(msg: MessageCreate, current_user: User = Depends(get_current_user)):
    message_doc = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "sender_id": current_user.user_id,
        "recipient_id": msg.recipient_id,
        "content": msg.content,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(message_doc)
    return {"message_id": message_doc["message_id"], "message": "Message sent"}

@api_router.get("/messages")
async def get_messages(current_user: User = Depends(get_current_user)):
    messages = await db.messages.find(
        {"$or": [{"sender_id": current_user.user_id}, {"recipient_id": current_user.user_id}]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return messages

# ============ PAYMENT ROUTES ============

PLANS = {
    "weekly": {"amount": 10.0, "currency": "usd", "name": "Weekly"},
    "monthly": {"amount": 29.99, "currency": "usd", "name": "Monthly"},
    "yearly": {"amount": 99.99, "currency": "usd", "name": "Yearly"},
    "lifetime": {"amount": 199.99, "currency": "usd", "name": "Lifetime"}
}

@api_router.post("/payment/checkout")
async def create_checkout(request: Request, current_user: User = Depends(get_current_user)):
    data = await request.json()
    plan_id = data.get("plan_id")
    origin_url = data.get("origin_url")
    
    if plan_id not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    plan = PLANS[plan_id]
    success_url = f"{origin_url}/payment-success?session_id={{{{CHECKOUT_SESSION_ID}}}}"
    cancel_url = f"{origin_url}/pricing"
    
    metadata = {"user_id": current_user.user_id, "plan_id": plan_id, "email": current_user.email}

    session = await asyncio.to_thread(
        stripe.checkout.Session.create,
        mode="payment",
        line_items=[{
            "price_data": {
            
"currency": plan["currency"],
                "product_data": {"name": f"{plan['name']} Membership"},
                "unit_amount": int(round(plan["amount"] * 100)),
            },
            "quantity": 1,
        }],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    
    transaction_doc = {
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "session_id": session.id,
        "amount": plan["amount"],
        "currency": plan["currency"],
        "plan_type": plan_id,
        "payment_status": "pending",
        "metadata": metadata,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"url": session.url, "session_id": session.id}

# ============ DONATION ROUTES ============

@api_router.post("/donation/checkout")
async def create_donation_checkout(request: Request):
    data = await request.json()
    amount = data.get("amount")
    origin_url = data.get("origin_url")
    
    if not amount or amount < 1:
        raise HTTPException(status_code=400, detail="Invalid donation amount")
    
    success_url = f"{origin_url}/donation-success"
    cancel_url = f"{origin_url}/support-us"
    
    metadata = {"type": "donation", "amount": str(amount)}

    session = await asyncio.to_thread(
        stripe.checkout.Session.create,
        mode="payment",
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": "Donation"},
                "unit_amount": int(round(float(amount) * 100)),
            },
            "quantity": 1,
        }],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    
    # Record donation
    donation_doc = {
        "donation_id": f"donate_{uuid.uuid4().hex[:12]}",
        "session_id": session.id,
        "amount": float(amount),
        "currency": "usd",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.donations.insert_one(donation_doc)
    
    return {"url": session.url, "session_id": session.id}

@api_router.get("/payment/status/{session_id}")
async def get_payment_status(session_id: str, current_user: User = Depends(get_current_user)):
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction["payment_status"] in ["paid", "completed"]:
        return {"status": "paid", "plan": transaction["plan_type"]}
    
    try:
        session = await asyncio.to_thread(stripe.checkout.Session.retrieve, session_id)
        payment_status = session.payment_status  # "paid", "unpaid", "no_payment_required"
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": payment_status}}
        )
        
        if payment_status == "paid":
            user_check = await db.users.find_one({"user_id": current_user.user_id})
            if not user_check.get("is_premium"):
                await db.users.update_one(
                    {"user_id": current_user.user_id},
                    {"$set": {
                        "is_premium": True,
                        "premium_plan": transaction["plan_type"],
                        "premium_activated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
        
        return {"status": payment_status, "plan": transaction["plan_type"]}
    except Exception as e:
        logger.error(f"Payment status check failed: {e}")
        return {"status": transaction["payment_status"], "plan": transaction["plan_type"]}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        event = await asyncio.to_thread(
            stripe.Webhook.construct_event, body, signature, STRIPE_WEBHOOK_SECRET
        )
        session_obj = event["data"]["object"]
        
        if event["type"] == "checkout.session.completed" and session_obj.get("payment_status") == "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_obj["id"]},
                {"$set": {"payment_status": "paid"}}
            )
            
            metadata = session_obj.get("metadata", {}) or {}
            user_id = metadata.get("user_id")
            plan_id = metadata.get("plan_id")
            
            if user_id:
                await db.users.update_one(
                    {"user_id": user_id},
                    {"$set": {
                        "is_premium": True,
                        "premium_plan": plan_id,
                        "premium_activated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Webhook error")

# ============ ADMIN ROUTES ============

@api_router.get("/admin/pending-users")
async def get_pending_users(admin: User = Depends(require_admin)):
    users = await db.users.find(
        {"approval_status": "pending"},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    return users

    @api_router.post("/admin/approve-user/{user_id}")
async def approve_user(user_id: str, admin: User = Depends(require_admin)):
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "approval_status": "approved",
            "is_verified": True,
            "approved_by": admin.user_id,
            "approved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "User approved"}

@api_router.post("/admin/reject-user/{user_id}")
async def reject_user(user_id: str, reason: Dict, admin: User = Depends(require_admin)):
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "approval_status": "rejected",
            "rejection_reason": reason.get("reason"),
            "rejected_by": admin.user_id,
            "rejected_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "User rejected"}

# ============ REFERRAL SYSTEM ============

@api_router.get("/referral/code")
async def get_referral_code(current_user: User = Depends(get_current_user)):
    ref_code = await db.referral_codes.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not ref_code:
        code = f"{current_user.name[:3].upper()}{uuid.uuid4().hex[:6].upper()}"
        ref_doc = {
            "code": code,
            "user_id": current_user.user_id,
            "uses": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.referral_codes.insert_one(ref_doc)
        return {"code": code, "uses": 0}
    return {"code": ref_code["code"], "uses": ref_code.get("uses", 0)}

@api_router.post("/referral/apply")
async def apply_referral(code: str, current_user: User = Depends(get_current_user)):
    ref_code = await db.referral_codes.find_one({"code": code.upper()}, {"_id": 0})
    if not ref_code:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    if ref_code["user_id"] == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot use your own referral code")
    
    existing = await db.referrals.find_one({"referred_user_id": current_user.user_id})
    if existing:
        raise HTTPException(status_code=400, detail="Referral code already applied")
    
    referral_doc = {
        "referral_id": f"ref_{uuid.uuid4().hex[:12]}",
        "referrer_user_id": ref_code["user_id"],
        "referred_user_id": current_user.user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.referrals.insert_one(referral_doc)
    await db.referral_codes.update_one({"code": code.upper()}, {"$inc": {"uses": 1}})
    
    return {"message": "Referral applied successfully"}

@api_router.get("/referral/stats")
async def get_referral_stats(current_user: User = Depends(get_current_user)):
    referrals = await db.referrals.find({"referrer_user_id": current_user.user_id}, {"_id": 0}).to_list(100)
    return {"total_referrals": len(referrals), "referrals": referrals}

# ============ VERIFICATION SYSTEM ============

class VerificationRequest(BaseModel):
    method: str  # "id_selfie" or "custom_task"
    id_photo_path: Optional[str] = None
    selfie_photo_path: Optional[str] = None
    task_photo_path: Optional[str] = None

@api_router.post("/verification/submit")
async def submit_verification(request: Request, current_user: User = Depends(get_current_user)):
    data = await request.json()
    method = data.get("method")  # "id_selfie" or "custom_task"
    
    if current_user.is_verified:
        raise HTTPException(status_code=400, detail="Already verified")
    
    verification_doc = {
        "verification_id": f"verify_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "user_name": current_user.name,
        "user_email": current_user.email,
        "method": method,
        "id_photo_path": data.get("id_photo_path"),
        "selfie_photo_path": data.get("selfie_photo_path"),
        "task_photo_path": data.get("task_photo_path"),
        "custom_task": data.get("custom_task"),
        "status": "pending",
        "admin_notes": None,
        "requested_at": datetime.now(timezone.utc).isoformat()
    }
    await db.verifications.insert_one(verification_doc)
    
    # Create admin notification
    notification_doc = {
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "type": "verification_request",
        "title": "New Verification Request",
        "message": f"{current_user.name} submitted a verification request ({method})",
        "user_id": current_user.user_id,
        "for_admins": True,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification_doc)
    
    return {"message": "Verification submitted for review", "verification_id": verification_doc["verification_id"]}

@api_router.get("/verification/status")
async def get_verification_status(current_user: User = Depends(get_current_user)):
    verification = await db.verifications.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    if not verification:
        return {"status": "not_submitted", "is_verified": current_user.is_verified}
    return {"status": verification["status"], "is_verified": current_user.is_verified, "verification": verification}

@api_router.post("/verification/request-task")
async def request_custom_task(current_user: User = Depends(get_current_user)):
    """Request admin to assign a custom verification task (for users without ID)"""
    existing = await db.verifications.find_one({"user_id": current_user.user_id, "status": "awaiting_task"})
    if existing:
        return {"message": "Task request already submitted", "verification_id": existing["verification_id"]}
    
    verification_doc = {
        "verification_id": f"verify_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "user_name": current_user.name,
        "user_email": current_user.email,
        "method": "custom_task",
        "status": "awaiting_task",
        "custom_task": None,
        "admin_notes": None,
        "requested_at": datetime.now(timezone.utc).isoformat()
    }
    await db.verifications.insert_one(verification_doc)
    
    # Notify admins
    notification_doc = {
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "type": "task_request",
        "title": "Custom Task Needed",
        "message": f"{current_user.name} needs a custom verification task assigned (no ID available)",
        "user_id": current_user.user_id,
        "for_admins": True,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification_doc)
    
    return {"message": "Task request submitted. Admin will assign a verification task.", "verification_id": verification_doc["verification_id"]}

@api_router.get("/admin/verifications")
async def get_pending_verifications(admin: User = Depends(require_admin)):
    verifications = await db.verifications.find(
        {"status": {"$in": ["pending", "awaiting_task"]}},
        {"_id": 0}
    {"_id": 0}
    ).sort("requested_at", -1).to_list(100)
    return verifications

@api_router.post("/admin/assign-task/{verification_id}")
async def assign_verification_task(verification_id: str, request: Request, admin: User = Depends(require_admin)):
    data = await request.json()
    custom_task = data.get("custom_task")  # e.g., "Write the number 32 on a piece of paper and take a selfie holding it"
    
    await db.verifications.update_one(
        {"verification_id": verification_id},
        {"$set": {
            "custom_task": custom_task,
            "status": "task_assigned",
            "assigned_by": admin.user_id,
            "assigned_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Get user to notify
    verification = await db.verifications.find_one({"verification_id": verification_id})
    if verification:
        notification_doc = {
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "type": "task_assigned",
            "title": "Verification Task Assigned",
            "message": f"Your verification task: {custom_task}",
            "user_id": verification["user_id"],
            "for_admins": False,
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification_doc)
    
    return {"message": "Task assigned successfully"}

@api_router.post("/admin/approve-verification/{verification_id}")
async def approve_verification(verification_id: str, admin: User = Depends(require_admin)):
    verification = await db.verifications.find_one({"verification_id": verification_id})
    if not verification:
        raise HTTPException(status_code=404, detail="Verification not found")
    
    # Update verification status
    await db.verifications.update_one(
        {"verification_id": verification_id},
        {"$set": {
            "status": "approved",
            "approved_by": admin.user_id,
            "approved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update user as verified
    await db.users.update_one(
        {"user_id": verification["user_id"]},
        {"$set": {
            "is_verified": True,
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "verified_by": admin.user_id
        }}
    )
    
    # Notify user
    notification_doc = {
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "type": "verification_approved",
        "title": "Verification Approved!",
        "message": "Congratulations! Your identity has been verified. You now have a verified badge!",
        "user_id": verification["user_id"],
        "for_admins": False,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification_doc)
    
    return {"message": "User verified successfully"}

@api_router.post("/admin/reject-verification/{verification_id}")
async def reject_verification(verification_id: str, request: Request, admin: User = Depends(require_admin)):
