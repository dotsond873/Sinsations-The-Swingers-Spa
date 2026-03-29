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
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

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
    preferences: Optional[Dict] = None
    is_verified: bool = False
    is_premium: bool = False
    premium_plan: Optional[str] = None
    residency_proof_url: Optional[str] = None
    approval_status: str = "pending"  # pending, approved, rejected
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
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

# ============ STORAGE FUNCTIONS ============

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(
            f"{STORAGE_URL}/init",
            json={"emergent_key": EMERGENT_KEY},
            timeout=30
        )
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        raise

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

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
    admin_emails = ["admin@bookup.com"]  # Can be expanded
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
        "is_premium": False,
        "premium_plan": None,
        "residency_proof_url": None,
        "approval_status": "pending",
        "approved_by": None,
        "approved_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create JWT token
    token = create_jwt_token(user_id, user_data.email)
    
    return {"token": token, "user_id": user_id, "message": "Registration successful. Please upload residency proof."}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user_doc["user_id"], user_doc["email"])
    
    return {"token": token, "user_id": user_doc["user_id"]}

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
            "is_premium": False,
            "premium_plan": None,
            "residency_proof_url": None,
            "approval_status": "pending",
            "approved_by": None,
            "approved_at": None,
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

@api_router.post("/users/upload-residency-proof")
async def upload_residency_proof(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/residency/{current_user.user_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    
    # Update user
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"residency_proof_url": result["path"]}}
    )
    
    return {"message": "Residency proof uploaded. Awaiting admin approval.", "path": result["path"]}

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
    allowed_fields = ["name", "bio", "age", "gender", "location", "preferences"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": update_data}
    )
    
    return {"message": "Profile updated"}

@api_router.get("/members")
async def get_members(current_user: User = Depends(get_current_user), skip: int = 0, limit: int = 20, gender: Optional[str] = None):
    if current_user.approval_status != "approved":
        raise HTTPException(status_code=403, detail="Your account is pending approval")
    
    query = {"approval_status": "approved"}
    if gender:
        query["gender"] = gender
    
    members = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    
    return members

# ============ MEDIA ROUTES ============

@api_router.post("/media/upload")
async def upload_media(file: UploadFile = File(...), is_public: bool = False, current_user: User = Depends(get_current_user)):
    if current_user.approval_status != "approved":
        raise HTTPException(status_code=403, detail="Your account is pending approval")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/media/{current_user.user_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    
    media_doc = {
        "media_id": f"media_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result["size"],
        "is_public": is_public,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.media.insert_one(media_doc)
    
    return {"media_id": media_doc["media_id"], "path": result["path"]}

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

@api_router.post(\"/messages\", dependencies=[Depends(require_premium)])\nasync def send_message(msg: MessageCreate, current_user: User = Depends(get_current_user)):\n    message_doc = {\n        \"message_id\": f\"msg_{uuid.uuid4().hex[:12]}\",\n        \"sender_id\": current_user.user_id,\n        \"recipient_id\": msg.recipient_id,\n        \"content\": msg.content,\n        \"is_read\": False,\n        \"created_at\": datetime.now(timezone.utc).isoformat()\n    }\n    await db.messages.insert_one(message_doc)\n    return {\"message_id\": message_doc[\"message_id\"], \"message\": \"Message sent\"}\n\n@api_router.get(\"/messages\", dependencies=[Depends(require_premium)])\nasync def get_messages(current_user: User = Depends(get_current_user)):\n    messages = await db.messages.find(\n        {\"$or\": [{\"sender_id\": current_user.user_id}, {\"recipient_id\": current_user.user_id}]},\n        {\"_id\": 0}\n    ).sort(\"created_at\", -1).to_list(100)\n    return messages\n\n@api_router.get(\"/conversations\")\nasync def get_conversations(current_user: User = Depends(require_premium)):\n    # Get unique conversation partners\n    messages = await db.messages.find(\n        {\"$or\": [{\"sender_id\": current_user.user_id}, {\"recipient_id\": current_user.user_id}]}\n    ).to_list(1000)\n    \n    partners = set()\n    for msg in messages:\n        if msg[\"sender_id\"] != current_user.user_id:\n            partners.add(msg[\"sender_id\"])\n        if msg[\"recipient_id\"] != current_user.user_id:\n            partners.add(msg[\"recipient_id\"])\n    \n    # Get partner details\n    partner_docs = await db.users.find(\n        {\"user_id\": {\"$in\": list(partners)}},\n        {\"_id\": 0, \"user_id\": 1, \"name\": 1, \"picture\": 1}\n    ).to_list(100)\n    \n    return partner_docs\n\n# ============ CHATROOM ROUTES ============\n\n@api_router.post(\"/chatrooms\", dependencies=[Depends(require_premium)])\nasync def create_chatroom(room: ChatroomCreate, current_user: User = Depends(get_current_user)):\n    room_doc = {\n        \"room_id\": f\"room_{uuid.uuid4().hex[:12]}\",\n        \"name\": room.name,\n        \"description\": room.description,\n        \"created_by\": current_user.user_id,\n        \"members\": [current_user.user_id],\n        \"created_at\": datetime.now(timezone.utc).isoformat()\n    }\n    await db.chatrooms.insert_one(room_doc)\n    return {\"room_id\": room_doc[\"room_id\"], \"message\": \"Chatroom created\"}\n\n@api_router.get(\"/chatrooms\", dependencies=[Depends(require_premium)])\nasync def get_chatrooms():\n    rooms = await db.chatrooms.find({}, {\"_id\": 0}).to_list(100)\n    return rooms\n\n@api_router.post(\"/chatrooms/{room_id}/join\", dependencies=[Depends(require_premium)])\nasync def join_chatroom(room_id: str, current_user: User = Depends(get_current_user)):\n    await db.chatrooms.update_one(\n        {\"room_id\": room_id},\n        {\"$addToSet\": {\"members\": current_user.user_id}}\n    )\n    return {\"message\": \"Joined chatroom\"}\n\n@api_router.get(\"/chatrooms/{room_id}/messages\", dependencies=[Depends(require_premium)])\nasync def get_chatroom_messages(room_id: str):\n    messages = await db.chatroom_messages.find(\n        {\"room_id\": room_id},\n        {\"_id\": 0}\n    ).sort(\"created_at\", -1).limit(100).to_list(100)\n    return messages\n\n@api_router.post(\"/chatrooms/{room_id}/messages\", dependencies=[Depends(require_premium)])\nasync def send_chatroom_message(room_id: str, content: Dict, current_user: User = Depends(get_current_user)):\n    msg_doc = {\n        \"message_id\": f\"cmsg_{uuid.uuid4().hex[:12]}\",\n        \"room_id\": room_id,\n        \"user_id\": current_user.user_id,\n        \"user_name\": current_user.name,\n        \"content\": content.get(\"content\"),\n        \"created_at\": datetime.now(timezone.utc).isoformat()\n    }\n    await db.chatroom_messages.insert_one(msg_doc)\n    return {\"message_id\": msg_doc[\"message_id\"]}\n\n# ============ FORUM ROUTES ============\n\n@api_router.post(\"/forums\", dependencies=[Depends(require_premium)])\nasync def create_forum(forum: ForumCreate, current_user: User = Depends(get_current_user)):\n    forum_doc = {\n        \"forum_id\": f\"forum_{uuid.uuid4().hex[:12]}\",\n        \"title\": forum.title,\n        \"description\": forum.description,\n        \"category\": forum.category,\n        \"created_by\": current_user.user_id,\n        \"created_at\": datetime.now(timezone.utc).isoformat()\n    }\n    await db.forums.insert_one(forum_doc)\n    return {\"forum_id\": forum_doc[\"forum_id\"]}\n\n@api_router.get(\"/forums\")\nasync def get_forums(current_user: User = Depends(get_current_user)):\n    forums = await db.forums.find({}, {\"_id\": 0}).sort(\"created_at\", -1).to_list(100)\n    return forums\n\n@api_router.get(\"/forums/{forum_id}\")\nasync def get_forum(forum_id: str, current_user: User = Depends(get_current_user)):\n    forum = await db.forums.find_one({\"forum_id\": forum_id}, {\"_id\": 0})\n    if not forum:\n        raise HTTPException(status_code=404, detail=\"Forum not found\")\n    \n    posts = await db.forum_posts.find({\"forum_id\": forum_id}, {\"_id\": 0}).sort(\"created_at\", -1).to_list(100)\n    \n    return {\"forum\": forum, \"posts\": posts}\n\n@api_router.post(\"/forums/{forum_id}/posts\", dependencies=[Depends(require_premium)])\nasync def create_forum_post(forum_id: str, post: ForumPostCreate, current_user: User = Depends(get_current_user)):\n    post_doc = {\n        \"post_id\": f\"post_{uuid.uuid4().hex[:12]}\",\n        \"forum_id\": forum_id,\n        \"user_id\": current_user.user_id,\n        \"user_name\": current_user.name,\n        \"content\": post.content,\n        \"created_at\": datetime.now(timezone.utc).isoformat()\n    }\n    await db.forum_posts.insert_one(post_doc)\n    return {\"post_id\": post_doc[\"post_id\"]}\n\n# ============ PERSONALS ROUTES ============\n\n@api_router.post(\"/personals\", dependencies=[Depends(require_premium)])\nasync def create_personal(personal: PersonalCreate, current_user: User = Depends(get_current_user)):\n    personal_doc = {\n        \"personal_id\": f\"personal_{uuid.uuid4().hex[:12]}\",\n        \"user_id\": current_user.user_id,\n        \"user_name\": current_user.name,\n        \"title\": personal.title,\n        \"content\": personal.content,\n        \"category\": personal.category,\n        \"created_at\": datetime.now(timezone.utc).isoformat()\n    }\n    await db.personals.insert_one(personal_doc)\n    return {\"personal_id\": personal_doc[\"personal_id\"]}\n\n@api_router.get(\"/personals\")\nasync def get_personals(current_user: User = Depends(get_current_user), category: Optional[str] = None):\n    query = {}\n    if category:\n        query[\"category\"] = category\n    \n    personals = await db.personals.find(query, {\"_id\": 0}).sort(\"created_at\", -1).to_list(100)\n    return personals\n\n# ============ CONTEST ROUTES ============\n\n@api_router.post(\"/contest/submit\")\nasync def submit_contest_entry(media_id: str, current_user: User = Depends(get_current_user)):\n    if not current_user.is_premium:\n        raise HTTPException(status_code=403, detail=\"Premium membership required\")\n    \n    # Get current week start\n    now = datetime.now(timezone.utc)\n    week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)\n    \n    entry_doc = {\n        \"entry_id\": f\"entry_{uuid.uuid4().hex[:12]}\",\n        \"user_id\": current_user.user_id,\n        \"media_id\": media_id,\n        \"week_start\": week_start.isoformat(),\n        \"votes\": 0,\n        \"created_at\": datetime.now(timezone.utc).isoformat()\n    }\n    await db.contest_entries.insert_one(entry_doc)\n    return {\"entry_id\": entry_doc[\"entry_id\"], \"message\": \"Contest entry submitted\"}\n\n@api_router.get(\"/contest/entries\")\nasync def get_contest_entries(current_user: User = Depends(get_current_user)):\n    # Get current week\n    now = datetime.now(timezone.utc)\n    week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)\n    \n    entries = await db.contest_entries.find(\n        {\"week_start\": week_start.isoformat()},\n        {\"_id\": 0}\n    ).sort(\"votes\", -1).to_list(100)\n    \n    return entries\n\n@api_router.post(\"/contest/vote/{entry_id}\")\nasync def vote_contest_entry(entry_id: str, current_user: User = Depends(get_current_user)):\n    if not current_user.is_premium:\n        raise HTTPException(status_code=403, detail=\"Premium membership required\")\n    \n    await db.contest_entries.update_one(\n        {\"entry_id\": entry_id},\n        {\"$inc\": {\"votes\": 1}}\n    )\n    return {\"message\": \"Vote recorded\"}\n\n@api_router.get(\"/contest/winner\")\nasync def get_current_winner():\n    # Get last week's winner\n    winner = await db.contest_winners.find_one({}, {\"_id\": 0}, sort=[(\"week_start\", -1)])\n    if not winner:\n        return {\"message\": \"No winner yet\"}\n    \n    user_doc = await db.users.find_one({\"user_id\": winner[\"user_id\"]}, {\"_id\": 0, \"password_hash\": 0})\n    return {\"winner\": winner, \"user\": user_doc}\n\n# ============ PAYMENT ROUTES ============\n\nPLANS = {\n    \"weekly\": {\"amount\": 10.0, \"currency\": \"usd\", \"name\": \"Weekly\"},\n    \"monthly\": {\"amount\": 29.99, \"currency\": \"usd\", \"name\": \"Monthly\"},\n    \"yearly\": {\"amount\": 99.99, \"currency\": \"usd\", \"name\": \"Yearly\"},\n    \"lifetime\": {\"amount\": 199.99, \"currency\": \"usd\", \"name\": \"Lifetime\"}\n}\n\n@api_router.post(\"/payment/checkout\")\nasync def create_checkout(request: Request, current_user: User = Depends(get_current_user)):\n    data = await request.json()\n    plan_id = data.get(\"plan_id\")\n    origin_url = data.get(\"origin_url\")\n    \n    if plan_id not in PLANS:\n        raise HTTPException(status_code=400, detail=\"Invalid plan\")\n    \n    plan = PLANS[plan_id]\n    \n    # Build URLs\n    success_url = f\"{origin_url}/payment-success?session_id={{{{CHECKOUT_SESSION_ID}}}}\"\n    cancel_url = f\"{origin_url}/pricing\"\n    \n    # Initialize Stripe\n    webhook_url = f\"{origin_url}/api/webhook/stripe\"\n    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)\n    \n    # Create checkout session\n    checkout_request = CheckoutSessionRequest(\n        amount=plan[\"amount\"],\n        currency=plan[\"currency\"],\n        success_url=success_url,\n        cancel_url=cancel_url,\n        metadata={\n            \"user_id\": current_user.user_id,\n            \"plan_id\": plan_id,\n            \"email\": current_user.email\n        }\n    )\n    \n    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)\n    \n    # Create payment transaction record\n    transaction_doc = {\n        \"transaction_id\": f\"txn_{uuid.uuid4().hex[:12]}\",\n        \"user_id\": current_user.user_id,\n        \"session_id\": session.session_id,\n        \"amount\": plan[\"amount\"],\n        \"currency\": plan[\"currency\"],\n        \"plan_type\": plan_id,\n        \"payment_status\": \"pending\",\n        \"metadata\": {\n            \"user_id\": current_user.user_id,\n            \"plan_id\": plan_id\n        },\n        \"created_at\": datetime.now(timezone.utc).isoformat()\n    }\n    await db.payment_transactions.insert_one(transaction_doc)\n    \n    return {\"url\": session.url, \"session_id\": session.session_id}\n\n@api_router.get(\"/payment/status/{session_id}\")\nasync def get_payment_status(session_id: str, current_user: User = Depends(get_current_user)):\n    # Get transaction\n    transaction = await db.payment_transactions.find_one({\"session_id\": session_id}, {\"_id\": 0})\n    if not transaction:\n        raise HTTPException(status_code=404, detail=\"Transaction not found\")\n    \n    # If already processed, return status\n    if transaction[\"payment_status\"] in [\"paid\", \"completed\"]:\n        return {\"status\": \"paid\", \"plan\": transaction[\"plan_type\"]}\n    \n    # Check with Stripe\n    webhook_url = f\"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api/webhook/stripe\"\n    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)\n    \n    try:\n        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)\n        \n        # Update transaction\n        await db.payment_transactions.update_one(\n            {\"session_id\": session_id},\n            {\"$set\": {\"payment_status\": status.payment_status}}\n        )\n        \n        # If paid, update user\n        if status.payment_status == \"paid\":\n            # Check if already updated\n            user_check = await db.users.find_one({\"user_id\": current_user.user_id})\n            if not user_check.get(\"is_premium\"):\n                await db.users.update_one(\n                    {\"user_id\": current_user.user_id},\n                    {\"$set\": {\n                        \"is_premium\": True,\n                        \"premium_plan\": transaction[\"plan_type\"],\n                        \"premium_activated_at\": datetime.now(timezone.utc).isoformat()\n                    }}\n                )\n        \n        return {\"status\": status.payment_status, \"plan\": transaction[\"plan_type\"]}\n    except Exception as e:\n        logger.error(f\"Payment status check failed: {e}\")\n        return {\"status\": transaction[\"payment_status\"], \"plan\": transaction[\"plan_type\"]}\n\n@api_router.post(\"/webhook/stripe\")\nasync def stripe_webhook(request: Request):\n    body = await request.body()\n    signature = request.headers.get(\"Stripe-Signature\")\n    \n    webhook_url = f\"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api/webhook/stripe\"\n    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)\n    \n    try:\n        event = await stripe_checkout.handle_webhook(body, signature)\n        \n        if event.payment_status == \"paid\":\n            # Update transaction\n            await db.payment_transactions.update_one(\n                {\"session_id\": event.session_id},\n                {\"$set\": {\"payment_status\": \"paid\"}}\n            )\n            \n            # Update user premium status\n            user_id = event.metadata.get(\"user_id\")\n            plan_id = event.metadata.get(\"plan_id\")\n            \n            if user_id:\n                await db.users.update_one(\n                    {\"user_id\": user_id},\n                    {\"$set\": {\n                        \"is_premium\": True,\n                        \"premium_plan\": plan_id,\n                        \"premium_activated_at\": datetime.now(timezone.utc).isoformat()\n                    }}\n                )\n        \n        return {\"status\": \"success\"}\n    except Exception as e:\n        logger.error(f\"Webhook error: {e}\")\n        raise HTTPException(status_code=400, detail=\"Webhook error\")\n\n# ============ ADMIN ROUTES ============\n\n@api_router.get(\"/admin/pending-users\")\nasync def get_pending_users(admin: User = Depends(require_admin)):\n    users = await db.users.find(\n        {\"approval_status\": \"pending\", \"residency_proof_url\": {\"$ne\": None}},\n        {\"_id\": 0, \"password_hash\": 0}\n    ).to_list(100)\n    return users\n\n@api_router.post(\"/admin/approve-user/{user_id}\")\nasync def approve_user(user_id: str, admin: User = Depends(require_admin)):\n    await db.users.update_one(\n        {\"user_id\": user_id},\n        {\"$set\": {\n            \"approval_status\": \"approved\",\n            \"is_verified\": True,\n            \"approved_by\": admin.user_id,\n            \"approved_at\": datetime.now(timezone.utc).isoformat()\n        }}\n    )\n    return {\"message\": \"User approved\"}\n\n@api_router.post(\"/admin/reject-user/{user_id}\")\nasync def reject_user(user_id: str, reason: Dict, admin: User = Depends(require_admin)):\n    await db.users.update_one(\n        {\"user_id\": user_id},\n        {\"$set\": {\n            \"approval_status\": \"rejected\",\n            \"rejection_reason\": reason.get(\"reason\"),\n            \"rejected_by\": admin.user_id,\n            \"rejected_at\": datetime.now(timezone.utc).isoformat()\n        }}\n    )\n    return {\"message\": \"User rejected\"}\n\n@api_router.post(\"/admin/contest/select-winner\")\nasync def select_contest_winner(entry_id: str, admin: User = Depends(require_admin)):\n    entry = await db.contest_entries.find_one({\"entry_id\": entry_id}, {\"_id\": 0})\n    if not entry:\n        raise HTTPException(status_code=404, detail=\"Entry not found\")\n    \n    # Get week range\n    week_start = datetime.fromisoformat(entry[\"week_start\"])\n    week_end = week_start + timedelta(days=7)\n    \n    winner_doc = {\n        \"winner_id\": f\"winner_{uuid.uuid4().hex[:12]}\",\n        \"user_id\": entry[\"user_id\"],\n        \"entry_id\": entry_id,\n        \"week_start\": entry[\"week_start\"],\n        \"week_end\": week_end.isoformat(),\n        \"selected_by\": admin.user_id,\n        \"created_at\": datetime.now(timezone.utc).isoformat()\n    }\n    await db.contest_winners.insert_one(winner_doc)\n    \n    return {\"message\": \"Winner selected\", \"winner_id\": winner_doc[\"winner_id\"]}\n\napp.include_router(api_router)

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

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()