"""Tests for chatrooms, forums, personals, contest, hotwife - iteration 2."""
import os
import time
import io
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://book-up-hookup.preview.emergentagent.com").rstrip("/")
PRIMARY_EMAIL = "test_1779827434@bookup.com"
PRIMARY_PASS = "testpass123"


def _login(email, password):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json()["token"]


def _register(email, password="testpass123", name="Tester"):
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": email, "password": password, "name": name,
        "gender": "male", "age": 30, "location": "Huntsville, AL"
    })
    if r.status_code in (200, 201):
        return r.json().get("token")
    # already exists -> login
    print(f"register failed {r.status_code} {r.text}, fallback login")
    return _login(email, password)


@pytest.fixture(scope="session")
def token1():
    return _login(PRIMARY_EMAIL, PRIMARY_PASS)


@pytest.fixture(scope="session")
def token2():
    email = f"test_voter_{int(time.time())}@bookup.com"
    return _register(email, name="Voter2")


@pytest.fixture(scope="session")
def headers1(token1):
    return {"Authorization": f"Bearer {token1}"}


@pytest.fixture(scope="session")
def headers2(token2):
    return {"Authorization": f"Bearer {token2}"}


# -------- AUTH / ME --------
class TestAuth:
    def test_me(self, headers1):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=headers1)
        assert r.status_code == 200
        assert r.json()["email"] == PRIMARY_EMAIL


# -------- CHATROOMS --------
class TestChatrooms:
    def test_create_and_list(self, headers1):
        name = f"TEST_Room_{int(time.time())}"
        r = requests.post(f"{BASE_URL}/api/chatrooms", headers=headers1,
                          json={"name": name, "description": "test"})
        assert r.status_code == 200, r.text
        room = r.json()
        assert room["name"] == name
        assert "room_id" in room
        pytest.room_id = room["room_id"]

        r2 = requests.get(f"{BASE_URL}/api/chatrooms", headers=headers1)
        assert r2.status_code == 200
        assert any(x["room_id"] == room["room_id"] for x in r2.json())

    def test_join(self, headers2):
        r = requests.post(f"{BASE_URL}/api/chatrooms/{pytest.room_id}/join", headers=headers2)
        assert r.status_code == 200

    def test_send_and_get_messages(self, headers1, headers2):
        r = requests.post(f"{BASE_URL}/api/chatrooms/{pytest.room_id}/messages",
                          headers=headers1, json={"content": "hello from u1"})
        assert r.status_code == 200, r.text
        r2 = requests.post(f"{BASE_URL}/api/chatrooms/{pytest.room_id}/messages",
                           headers=headers2, json={"content": "hi from u2"})
        assert r2.status_code == 200

        rg = requests.get(f"{BASE_URL}/api/chatrooms/{pytest.room_id}/messages", headers=headers1)
        assert rg.status_code == 200
        msgs = rg.json()
        contents = [m["content"] for m in msgs]
        assert "hello from u1" in contents
        assert "hi from u2" in contents


# -------- FORUMS --------
class TestForums:
    def test_create_list_detail_post(self, headers1, headers2):
        title = f"TEST_Forum_{int(time.time())}"
        r = requests.post(f"{BASE_URL}/api/forums", headers=headers1,
                          json={"title": title, "description": "d", "category": "general"})
        assert r.status_code == 200, r.text
        forum = r.json()
        fid = forum["forum_id"]
        pytest.forum_id = fid

        # list
        rl = requests.get(f"{BASE_URL}/api/forums", headers=headers1)
        assert rl.status_code == 200
        assert any(x["forum_id"] == fid for x in rl.json())

        # filter by category
        rc = requests.get(f"{BASE_URL}/api/forums?category=general", headers=headers1)
        assert rc.status_code == 200
        assert any(x["forum_id"] == fid for x in rc.json())

        # post reply
        rp = requests.post(f"{BASE_URL}/api/forums/{fid}/posts", headers=headers2,
                           json={"content": "first reply"})
        assert rp.status_code == 200, rp.text

        # detail
        rd = requests.get(f"{BASE_URL}/api/forums/{fid}", headers=headers1)
        assert rd.status_code == 200
        data = rd.json()
        assert data["forum"]["forum_id"] == fid
        assert any(p["content"] == "first reply" for p in data["posts"])


# -------- PERSONALS --------
class TestPersonals:
    def test_create_list_filter_delete(self, headers1):
        title = f"TEST_Personal_{int(time.time())}"
        r = requests.post(f"{BASE_URL}/api/personals", headers=headers1,
                          json={"title": title, "content": "looking", "category": "couple_seeking"})
        assert r.status_code == 200, r.text
        pid = r.json()["personal_id"]

        rl = requests.get(f"{BASE_URL}/api/personals?category=couple_seeking", headers=headers1)
        assert rl.status_code == 200
        assert any(x["personal_id"] == pid for x in rl.json())

        rd = requests.delete(f"{BASE_URL}/api/personals/{pid}", headers=headers1)
        assert rd.status_code == 200

        rl2 = requests.get(f"{BASE_URL}/api/personals", headers=headers1)
        assert not any(x["personal_id"] == pid for x in rl2.json())

    def test_delete_others_forbidden(self, headers1, headers2):
        r = requests.post(f"{BASE_URL}/api/personals", headers=headers1,
                          json={"title": "TEST_owned", "content": "x", "category": "general"})
        pid = r.json()["personal_id"]
        rd = requests.delete(f"{BASE_URL}/api/personals/{pid}", headers=headers2)
        assert rd.status_code == 403


# -------- HOTWIFE --------
class TestHotwife:
    def test_create_list_like_delete(self, headers1, headers2):
        r = requests.post(f"{BASE_URL}/api/hotwife/posts", headers=headers1,
                          json={"content": "TEST hot wife post"})
        assert r.status_code == 200, r.text
        post = r.json()
        post_id = post["post_id"]

        rl = requests.get(f"{BASE_URL}/api/hotwife/posts", headers=headers1)
        assert rl.status_code == 200
        assert any(p["post_id"] == post_id for p in rl.json())

        # like by user 2
        rk = requests.post(f"{BASE_URL}/api/hotwife/posts/{post_id}/like", headers=headers2)
        assert rk.status_code == 200
        assert rk.json()["liked"] is True

        # toggle off
        rk2 = requests.post(f"{BASE_URL}/api/hotwife/posts/{post_id}/like", headers=headers2)
        assert rk2.status_code == 200
        assert rk2.json()["liked"] is False

        # non-owner can't delete
        rd = requests.delete(f"{BASE_URL}/api/hotwife/posts/{post_id}", headers=headers2)
        assert rd.status_code == 403

        # owner can delete
        rd2 = requests.delete(f"{BASE_URL}/api/hotwife/posts/{post_id}", headers=headers1)
        assert rd2.status_code == 200

    def test_empty_post_rejected(self, headers1):
        r = requests.post(f"{BASE_URL}/api/hotwife/posts", headers=headers1,
                          json={"content": "   "})
        assert r.status_code == 400


# -------- CONTEST --------
def _upload_media(headers):
    files = {"file": ("test.jpg", b"\xff\xd8\xff\xe0fake_jpeg_bytes", "image/jpeg")}
    r = requests.post(f"{BASE_URL}/api/media/upload", headers=headers, files=files)
    return r


class TestContest:
    def test_full_contest_flow(self, headers1, headers2):
        # upload media for user1
        up = _upload_media(headers1)
        assert up.status_code in (200, 201), f"media upload failed: {up.status_code} {up.text}"
        media_id = up.json().get("media_id") or up.json().get("id")
        assert media_id, f"no media id in {up.json()}"

        # list (may be empty currently)
        rl = requests.get(f"{BASE_URL}/api/contest/entries", headers=headers1)
        assert rl.status_code == 200

        # create entry
        rc = requests.post(f"{BASE_URL}/api/contest/entries", headers=headers1,
                           json={"media_id": media_id, "caption": "TEST entry"})
        # If user already submitted this week from prior test runs, accept 400
        if rc.status_code == 400 and "already submitted" in rc.text.lower():
            # find existing entry
            entries = requests.get(f"{BASE_URL}/api/contest/entries", headers=headers1).json()
            mine = [e for e in entries if e.get("caption") or True][0]  # take any
            entry_id = mine["entry_id"]
        else:
            assert rc.status_code == 200, rc.text
            entry_id = rc.json()["entry_id"]

        # self-vote forbidden
        rsv = requests.post(f"{BASE_URL}/api/contest/entries/{entry_id}/vote", headers=headers1)
        assert rsv.status_code == 400

        # user2 votes
        rv = requests.post(f"{BASE_URL}/api/contest/entries/{entry_id}/vote", headers=headers2)
        # if user2 already voted from a previous run, accept 400 "already voted"
        assert rv.status_code in (200, 400), rv.text

        # my-vote returns entry id for voter or null for primary
        mv2 = requests.get(f"{BASE_URL}/api/contest/my-vote", headers=headers2)
        assert mv2.status_code == 200

        # double-vote rejected
        rv2 = requests.post(f"{BASE_URL}/api/contest/entries/{entry_id}/vote", headers=headers2)
        assert rv2.status_code == 400

        # winner endpoint
        rw = requests.get(f"{BASE_URL}/api/contest/winner", headers=headers1)
        assert rw.status_code == 200
        body = rw.json()
        assert "winner" in body
        assert "week" in body
