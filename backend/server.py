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

# Storage
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY')
APP_NAME = os.environ.get('APP_NAME', 'bookup-hookup')
storage_key = None

# Stripe
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

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
    content: str

class ChatroomCreate(BaseModel):
    name: str
    description: str

class PersonalCreate(BaseModel):
    title: str
    content: str
    category: str

class SecurityQuestionSet(BaseModel):
    question: str
    answer: str

class ResetLookup(BaseModel):
    email: EmailStr

class PasswordResetRequest(BaseModel):
    email: EmailStr
    answer: str
    new_password: str

class ContestEntryCreate(BaseModel):
    media_id: str
    caption: Optional[str] = ""

class HotwifePostCreate(BaseModel):
    content: str
    media_id: Optional[str] = None




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

@api_router.post("/auth/google/session")
async def google_session(request: Request):
    data = await request.json()
    session_id = data.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth API
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    try:
        resp = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=10
        )
        resp.raise_for_status()
        session_data = resp.json()
    except Exception as e:
        logger.error(f"Emergent Auth failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check if user exists
    user_doc = await db.users.find_one({"email": session_data["email"]})
    
    if user_doc:
        # Update existing user
        await db.users.update_one(
            {"email": session_data["email"]},
            {"$set": {
                "name": session_data["name"],
                "picture": session_data["picture"]
            }}
        )
        user_id = user_doc["user_id"]
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": session_data["email"],
            "name": session_data["name"],
            "picture": session_data["picture"],
            "bio": None,
            "age": None,
            "gender": None,
            "location": None,
            "preferences": {},
            "is_verified": False,
            "is_premium": True,
            "premium_plan": "free",
            "residency_proof_url": None,
            "approval_status": "approved",
            "approved_by": "auto",
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    # Create session
    session_token = session_data["session_token"]
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    response = JSONResponse(content={"user_id": user_id, "message": "Login successful"})
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
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
        {"user_id": user_doc["user_id"]},
        {"$set": {
            "password_hash": hash_password(payload.new_password),
            "reset_failed_attempts": []
        }}
    )
    return {"message": "Password reset successful. Please log in."}

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/auth/logout")
async def logout(current_user: User = Depends(get_current_user), session_token: str = Cookie(None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("session_token")
    return response

# ============ USER ROUTES ============

@api_router.get("/users/profile/{user_id}")
async def get_user_profile(user_id: str, current_user: User = Depends(get_current_user)):
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's media
    media_list = await db.media.find({"user_id": user_id, "is_deleted": False}, {"_id": 0}).to_list(100)
    
    return {"user": user_doc, "media": media_list}

@api_router.put("/users/profile")
async def update_profile(updates: Dict, current_user: User = Depends(get_current_user)):
    allowed_fields = ["name", "bio", "age", "gender", "location", "city", "state", "area_code", "preferences"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    # Normalise location fields
    if "city" in update_data and update_data["city"]:
        update_data["city"] = update_data["city"].strip()
    if "state" in update_data and update_data["state"]:
        update_data["state"] = update_data["state"].strip().upper()
    if "area_code" in update_data and update_data["area_code"]:
        update_data["area_code"] = "".join(c for c in str(update_data["area_code"]) if c.isdigit())[:5]
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": update_data}
    )
    
    return {"message": "Profile updated"}

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
        {"_id": 0, "password_hash": 0, "residency_proof_url": 0}
    ).skip(skip).limit(limit).to_list(limit)

    return members

@api_router.get("/members/stats/new-this-week")
async def new_members_this_week(
    current_user: User = Depends(get_current_user),
    area_code: Optional[str] = None,
    state: Optional[str] = None,
):
    """Count of members created in the last 7 days, optionally scoped to the requester's area_code/state."""
    now = datetime.now(timezone.utc)
    week_ago = (now - timedelta(days=7)).isoformat()
    query: Dict[str, Any] = {
        "created_at": {"$gte": week_ago},
        "user_id": {"$ne": current_user.user_id},
    }
    if area_code:
        digits = "".join(c for c in str(area_code) if c.isdigit())
        if digits:
            query["area_code"] = digits
    elif state:
        query["state"] = state.strip().upper()
    total = await db.users.count_documents(query)
    return {"count": total, "scope": "area_code" if area_code else ("state" if state else "all")}

# ============ MEDIA ROUTES (Photos & Videos) ============

@api_router.post("/media/upload")
async def upload_media(
    file: UploadFile = File(...), 
    is_public: bool = False, 
    media_type: str = Query(default="photo"),
    current_user: User = Depends(get_current_user)
):
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    folder = "videos" if media_type == "video" else "photos"
    path = f"{APP_NAME}/media/{current_user.user_id}/{folder}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    
    media_doc = {
        "media_id": f"media_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result["size"],
        "media_type": media_type,
        "is_public": is_public,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.media.insert_one(media_doc)
    
    return {"media_id": media_doc["media_id"], "path": result["path"], "media_type": media_type}

@api_router.get("/media/user/{user_id}")
async def get_user_media(user_id: str, media_type: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"user_id": user_id, "is_deleted": False}
    if media_type:
        query["media_type"] = media_type
    
    media_list = await db.media.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
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
    
    webhook_url = f"{origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=plan["amount"],
        currency=plan["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"user_id": current_user.user_id, "plan_id": plan_id, "email": current_user.email}
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    transaction_doc = {
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "session_id": session.session_id,
        "amount": plan["amount"],
        "currency": plan["currency"],
        "plan_type": plan_id,
        "payment_status": "pending",
        "metadata": {"user_id": current_user.user_id, "plan_id": plan_id},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"url": session.url, "session_id": session.session_id}

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
    
    webhook_url = f"{origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=float(amount),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"type": "donation", "amount": str(amount)}
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Record donation
    donation_doc = {
        "donation_id": f"donate_{uuid.uuid4().hex[:12]}",
        "session_id": session.session_id,
        "amount": float(amount),
        "currency": "usd",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.donations.insert_one(donation_doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payment/status/{session_id}")
async def get_payment_status(session_id: str, current_user: User = Depends(get_current_user)):
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction["payment_status"] in ["paid", "completed"]:
        return {"status": "paid", "plan": transaction["plan_type"]}
    
    webhook_url = f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": status.payment_status}}
        )
        
        if status.payment_status == "paid":
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
        
        return {"status": status.payment_status, "plan": transaction["plan_type"]}
    except Exception as e:
        logger.error(f"Payment status check failed: {e}")
        return {"status": transaction["payment_status"], "plan": transaction["plan_type"]}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    webhook_url = f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        event = await stripe_checkout.handle_webhook(body, signature)
        
        if event.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": event.session_id},
                {"$set": {"payment_status": "paid"}}
            )
            
            user_id = event.metadata.get("user_id")
            plan_id = event.metadata.get("plan_id")
            
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
    data = await request.json()
    reason = data.get("reason", "Verification rejected")
    
    verification = await db.verifications.find_one({"verification_id": verification_id})
    if not verification:
        raise HTTPException(status_code=404, detail="Verification not found")
    
    await db.verifications.update_one(
        {"verification_id": verification_id},
        {"$set": {
            "status": "rejected",
            "rejection_reason": reason,
            "rejected_by": admin.user_id,
            "rejected_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notify user
    notification_doc = {
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "type": "verification_rejected",
        "title": "Verification Not Approved",
        "message": f"Your verification was not approved. Reason: {reason}. Please try again.",
        "user_id": verification["user_id"],
        "for_admins": False,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification_doc)
    
    return {"message": "Verification rejected"}

# ============ NOTIFICATIONS ============

@api_router.get("/notifications")
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user.user_id, "for_admins": False},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return notifications

@api_router.get("/admin/notifications")
async def get_admin_notifications(admin: User = Depends(require_admin)):
    notifications = await db.notifications.find(
        {"for_admins": True},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return notifications

@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: User = Depends(get_current_user)):
    await db.notifications.update_one(
        {"notification_id": notification_id},
        {"$set": {"is_read": True}}
    )
    return {"message": "Notification marked as read"}

# ============ LIKES / FAVORITES ============

@api_router.post("/members/{user_id}/like")
async def like_member(user_id: str, current_user: User = Depends(get_current_user)):
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot like yourself")
    
    existing = await db.likes.find_one({
        "liker_id": current_user.user_id,
        "liked_id": user_id
    })
    
    if existing:
        # Unlike
        await db.likes.delete_one({"liker_id": current_user.user_id, "liked_id": user_id})
        return {"message": "Unliked", "liked": False}
    else:
        # Like
        like_doc = {
            "like_id": f"like_{uuid.uuid4().hex[:12]}",
            "liker_id": current_user.user_id,
            "liked_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.likes.insert_one(like_doc)
        
        # Notify the liked user
        notification_doc = {
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "type": "new_like",
            "title": "Someone likes you!",
            "message": f"{current_user.name} liked your profile",
            "user_id": user_id,
            "from_user_id": current_user.user_id,
            "for_admins": False,
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification_doc)
        
        return {"message": "Liked", "liked": True}

@api_router.get("/members/{user_id}/is-liked")
async def check_if_liked(user_id: str, current_user: User = Depends(get_current_user)):
    existing = await db.likes.find_one({
        "liker_id": current_user.user_id,
        "liked_id": user_id
    })
    return {"liked": existing is not None}

@api_router.get("/likes/received")
async def get_received_likes(current_user: User = Depends(get_current_user)):
    likes = await db.likes.find({"liked_id": current_user.user_id}, {"_id": 0}).to_list(100)
    # Get liker details
    liker_ids = [l["liker_id"] for l in likes]
    likers = await db.users.find({"user_id": {"$in": liker_ids}}, {"_id": 0, "password_hash": 0}).to_list(100)
    return {"likes": likes, "likers": likers}

@api_router.get("/likes/given")
async def get_given_likes(current_user: User = Depends(get_current_user)):
    likes = await db.likes.find({"liker_id": current_user.user_id}, {"_id": 0}).to_list(100)
    liked_ids = [l["liked_id"] for l in likes]
    liked_users = await db.users.find({"user_id": {"$in": liked_ids}}, {"_id": 0, "password_hash": 0}).to_list(100)
    return {"likes": likes, "liked_users": liked_users}

# ============ PROFILE PHOTO UPLOAD ============

@api_router.post("/users/upload-photo")
async def upload_profile_photo(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    path = f"{APP_NAME}/profiles/{current_user.user_id}/photo.{ext}"
    data = await file.read()
    
    try:
        result = put_object(path, data, file.content_type or "image/jpeg")
        
        # Update user picture
        await db.users.update_one(
            {"user_id": current_user.user_id},
            {"$set": {"picture": result["path"]}}
        )
        
        return {"message": "Photo uploaded", "path": result["path"]}
    except Exception as e:
        logger.error(f"Photo upload failed: {e}")
        raise HTTPException(status_code=500, detail="Photo upload failed")

@api_router.post("/verification/upload-photo")
async def upload_verification_photo(
    file: UploadFile = File(...),
    photo_type: str = Query(...),  # "id", "selfie", or "task"
    current_user: User = Depends(get_current_user)
):
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    path = f"{APP_NAME}/verifications/{current_user.user_id}/{photo_type}_{uuid.uuid4().hex[:8]}.{ext}"
    data = await file.read()
    
    try:
        result = put_object(path, data, file.content_type or "image/jpeg")
        return {"message": "Photo uploaded", "path": result["path"], "photo_type": photo_type}
    except Exception as e:
        logger.error(f"Verification photo upload failed: {e}")
        raise HTTPException(status_code=500, detail="Photo upload failed")

# ============ CHATROOMS ROUTES ============

@api_router.get("/chatrooms")
async def list_chatrooms(current_user: User = Depends(get_current_user)):
    rooms = await db.chatrooms.find({"is_deleted": {"$ne": True}}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return rooms

@api_router.post("/chatrooms")
async def create_chatroom(payload: ChatroomCreate, current_user: User = Depends(get_current_user)):
    room_doc = {
        "room_id": f"room_{uuid.uuid4().hex[:12]}",
        "name": payload.name.strip(),
        "description": (payload.description or "").strip(),
        "created_by": current_user.user_id,
        "created_by_name": current_user.name,
        "members": [current_user.user_id],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chatrooms.insert_one(room_doc)
    room_doc.pop("_id", None)
    return room_doc

@api_router.post("/chatrooms/{room_id}/join")
async def join_chatroom(room_id: str, current_user: User = Depends(get_current_user)):
    room = await db.chatrooms.find_one({"room_id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="Chatroom not found")
    await db.chatrooms.update_one(
        {"room_id": room_id},
        {"$addToSet": {"members": current_user.user_id}}
    )
    return {"message": "Joined", "room_id": room_id}

@api_router.get("/chatrooms/{room_id}/messages")
async def get_chatroom_messages(room_id: str, current_user: User = Depends(get_current_user), limit: int = 100):
    room = await db.chatrooms.find_one({"room_id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="Chatroom not found")
    msgs = await db.chatroom_messages.find({"room_id": room_id}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return msgs

@api_router.post("/chatrooms/{room_id}/messages")
async def send_chatroom_message(room_id: str, payload: ForumPostCreate, current_user: User = Depends(get_current_user)):
    room = await db.chatrooms.find_one({"room_id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="Chatroom not found")
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    msg_doc = {
        "message_id": f"cmsg_{uuid.uuid4().hex[:12]}",
        "room_id": room_id,
        "user_id": current_user.user_id,
        "user_name": current_user.name,
        "content": payload.content.strip(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chatroom_messages.insert_one(msg_doc)
    msg_doc.pop("_id", None)
    return msg_doc

# ============ FORUMS ROUTES ============

@api_router.get("/forums")
async def list_forums(current_user: User = Depends(get_current_user), category: Optional[str] = None):
    query = {"is_deleted": {"$ne": True}}
    if category:
        query["category"] = category
    forums = await db.forums.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return forums

@api_router.post("/forums")
async def create_forum(payload: ForumCreate, current_user: User = Depends(get_current_user)):
    forum_doc = {
        "forum_id": f"forum_{uuid.uuid4().hex[:12]}",
        "title": payload.title.strip(),
        "description": (payload.description or "").strip(),
        "category": payload.category,
        "created_by": current_user.user_id,
        "created_by_name": current_user.name,
        "post_count": 0,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.forums.insert_one(forum_doc)
    forum_doc.pop("_id", None)
    return forum_doc

@api_router.get("/forums/{forum_id}")
async def get_forum(forum_id: str, current_user: User = Depends(get_current_user)):
    forum = await db.forums.find_one({"forum_id": forum_id}, {"_id": 0})
    if not forum:
        raise HTTPException(status_code=404, detail="Forum not found")
    posts = await db.forum_posts.find({"forum_id": forum_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return {"forum": forum, "posts": posts}

@api_router.post("/forums/{forum_id}/posts")
async def create_forum_post(forum_id: str, payload: ForumPostCreate, current_user: User = Depends(get_current_user)):
    forum = await db.forums.find_one({"forum_id": forum_id})
    if not forum:
        raise HTTPException(status_code=404, detail="Forum not found")
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Post cannot be empty")
    post_doc = {
        "post_id": f"post_{uuid.uuid4().hex[:12]}",
        "forum_id": forum_id,
        "user_id": current_user.user_id,
        "user_name": current_user.name,
        "content": payload.content.strip(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.forum_posts.insert_one(post_doc)
    await db.forums.update_one({"forum_id": forum_id}, {"$inc": {"post_count": 1}})
    post_doc.pop("_id", None)
    return post_doc

# ============ PERSONALS ROUTES ============

@api_router.get("/personals")
async def list_personals(current_user: User = Depends(get_current_user), category: Optional[str] = None):
    query = {"is_deleted": {"$ne": True}}
    if category:
        query["category"] = category
    personals = await db.personals.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return personals

@api_router.post("/personals")
async def create_personal(payload: PersonalCreate, current_user: User = Depends(get_current_user)):
    personal_doc = {
        "personal_id": f"prs_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "user_name": current_user.name,
        "title": payload.title.strip(),
        "content": payload.content.strip(),
        "category": payload.category,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.personals.insert_one(personal_doc)
    personal_doc.pop("_id", None)
    return personal_doc

@api_router.delete("/personals/{personal_id}")
async def delete_personal(personal_id: str, current_user: User = Depends(get_current_user)):
    personal = await db.personals.find_one({"personal_id": personal_id})
    if not personal:
        raise HTTPException(status_code=404, detail="Personal not found")
    if personal["user_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    await db.personals.update_one({"personal_id": personal_id}, {"$set": {"is_deleted": True}})
    return {"message": "Deleted"}

# ============ CONTEST ROUTES (Pretty Pussy of the Week) ============

def _current_week_key() -> str:
    now = datetime.now(timezone.utc)
    iso = now.isocalendar()
    return f"{iso[0]}-W{iso[1]:02d}"

@api_router.get("/contest/entries")
async def list_contest_entries(current_user: User = Depends(get_current_user)):
    week = _current_week_key()
    entries = await db.contest_entries.find(
        {"week": week, "is_deleted": {"$ne": True}}, {"_id": 0}
    ).sort("votes", -1).to_list(200)
    return entries

@api_router.post("/contest/entries")
async def create_contest_entry(payload: ContestEntryCreate, current_user: User = Depends(get_current_user)):
    media = await db.media.find_one({"media_id": payload.media_id, "user_id": current_user.user_id, "is_deleted": False})
    if not media:
        raise HTTPException(status_code=404, detail="Media not found in your library")
    week = _current_week_key()
    existing = await db.contest_entries.find_one({"week": week, "user_id": current_user.user_id, "is_deleted": {"$ne": True}})
    if existing:
        raise HTTPException(status_code=400, detail="You already submitted this week")
    entry_doc = {
        "entry_id": f"entry_{uuid.uuid4().hex[:12]}",
        "week": week,
        "user_id": current_user.user_id,
        "user_name": current_user.name,
        "media_id": payload.media_id,
        "caption": (payload.caption or "").strip(),
        "votes": 0,
        "voters": [],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.contest_entries.insert_one(entry_doc)
    entry_doc.pop("_id", None)
    return entry_doc

@api_router.post("/contest/entries/{entry_id}/vote")
async def vote_contest_entry(entry_id: str, current_user: User = Depends(get_current_user)):
    week = _current_week_key()
    entry = await db.contest_entries.find_one({"entry_id": entry_id, "week": week})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry["user_id"] == current_user.user_id:
        raise HTTPException(status_code=400, detail="You cannot vote for your own entry")
    # Check if user already voted this week
    already = await db.contest_entries.find_one({"week": week, "voters": current_user.user_id})
    if already:
        raise HTTPException(status_code=400, detail="You have already voted this week")
    await db.contest_entries.update_one(
        {"entry_id": entry_id},
        {"$inc": {"votes": 1}, "$addToSet": {"voters": current_user.user_id}}
    )
    return {"message": "Vote recorded"}

@api_router.get("/contest/winner")
async def get_contest_winner(current_user: User = Depends(get_current_user)):
    # Last completed week winner
    now = datetime.now(timezone.utc)
    last_week_dt = now - timedelta(days=7)
    iso = last_week_dt.isocalendar()
    last_week = f"{iso[0]}-W{iso[1]:02d}"
    winner = await db.contest_entries.find_one(
        {"week": last_week, "is_deleted": {"$ne": True}},
        {"_id": 0},
        sort=[("votes", -1)]
    )
    if not winner:
        return {"winner": None, "week": last_week}
    return {"winner": winner, "week": last_week}

@api_router.get("/contest/my-vote")
async def get_my_vote(current_user: User = Depends(get_current_user)):
    week = _current_week_key()
    voted = await db.contest_entries.find_one({"week": week, "voters": current_user.user_id}, {"_id": 0})
    return {"voted_entry_id": voted["entry_id"] if voted else None}

# ============ HOT WIFE ROUTES ============

@api_router.get("/hotwife/posts")
async def list_hotwife_posts(current_user: User = Depends(get_current_user)):
    posts = await db.hotwife_posts.find({"is_deleted": {"$ne": True}}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return posts

@api_router.post("/hotwife/posts")
async def create_hotwife_post(payload: HotwifePostCreate, current_user: User = Depends(get_current_user)):
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Post cannot be empty")
    post_doc = {
        "post_id": f"hw_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "user_name": current_user.name,
        "content": payload.content.strip(),
        "media_id": payload.media_id,
        "likes": 0,
        "liked_by": [],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.hotwife_posts.insert_one(post_doc)
    post_doc.pop("_id", None)
    return post_doc

@api_router.post("/hotwife/posts/{post_id}/like")
async def like_hotwife_post(post_id: str, current_user: User = Depends(get_current_user)):
    post = await db.hotwife_posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if current_user.user_id in post.get("liked_by", []):
        await db.hotwife_posts.update_one(
            {"post_id": post_id},
            {"$inc": {"likes": -1}, "$pull": {"liked_by": current_user.user_id}}
        )
        return {"liked": False}
    await db.hotwife_posts.update_one(
        {"post_id": post_id},
        {"$inc": {"likes": 1}, "$addToSet": {"liked_by": current_user.user_id}}
    )
    return {"liked": True}

@api_router.delete("/hotwife/posts/{post_id}")
async def delete_hotwife_post(post_id: str, current_user: User = Depends(get_current_user)):
    post = await db.hotwife_posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["user_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    await db.hotwife_posts.update_one({"post_id": post_id}, {"$set": {"is_deleted": True}})
    return {"message": "Deleted"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

 

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
