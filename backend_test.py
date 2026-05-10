import requests
import sys
from datetime import datetime
import uuid

class BookupHookupAPITester:
    def __init__(self, base_url="https://book-up-hookup.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                self.test_results.append({"test": name, "status": "PASSED", "code": response.status_code})
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.test_results.append({"test": name, "status": "FAILED", "expected": expected_status, "got": response.status_code})
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({"test": name, "status": "ERROR", "error": str(e)})
            return False, {}

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"testuser_{timestamp}@example.com"
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": "TestPass123!",
                "name": f"Test User {timestamp}",
                "age": 25,
                "gender": "male",
                "location": "Huntsville, AL"
            }
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response.get('user_id')
            print(f"   Token obtained: {self.token[:20]}...")
            print(f"   User ID: {self.user_id}")
            return True
        return False

    def test_login(self, email, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response.get('user_id')
            return True
        return False

    def test_get_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User (/auth/me)",
            "GET",
            "auth/me",
            200
        )
        
        if success:
            print(f"   User: {response.get('name')} ({response.get('email')})")
            print(f"   Premium: {response.get('is_premium')}")
            print(f"   Approval Status: {response.get('approval_status')}")
        
        return success

    def test_update_profile(self):
        """Test profile update"""
        success, response = self.run_test(
            "Update Profile",
            "PUT",
            "users/profile",
            200,
            data={
                "gender": "couple_mf",
                "bio": "Test couple looking for fun!",
                "preferences": {
                    "age_range": "26-35",
                    "race": "white",
                    "orientation": "bisexual",
                    "looking_for": ["couples", "single_female", "soft_swap"]
                }
            }
        )
        return success

    def test_get_members(self):
        """Test getting members list"""
        success, response = self.run_test(
            "Get Members List",
            "GET",
            "members?limit=10",
            200
        )
        
        if success:
            print(f"   Found {len(response)} members")
        
        return success

    def test_send_message(self, recipient_id):
        """Test sending a message"""
        success, response = self.run_test(
            "Send Message",
            "POST",
            "messages",
            200,
            data={
                "recipient_id": recipient_id,
                "content": "Hey! This is a test message. Feel free to exchange numbers!"
            }
        )
        
        if success:
            print(f"   Message ID: {response.get('message_id')}")
        
        return success

    def test_get_messages(self):
        """Test getting messages"""
        success, response = self.run_test(
            "Get Messages",
            "GET",
            "messages",
            200
        )
        
        if success:
            print(f"   Found {len(response)} messages")
        
        return success

    def test_get_referral_code(self):
        """Test getting referral code"""
        success, response = self.run_test(
            "Get Referral Code",
            "GET",
            "referral/code",
            200
        )
        
        if success:
            print(f"   Referral Code: {response.get('code')}")
            print(f"   Uses: {response.get('uses')}")
        
        return success

    def test_get_referral_stats(self):
        """Test getting referral stats"""
        success, response = self.run_test(
            "Get Referral Stats",
            "GET",
            "referral/stats",
            200
        )
        
        if success:
            print(f"   Total Referrals: {response.get('total_referrals')}")
        
        return success

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        print("="*60)
        
        if self.tests_run - self.tests_passed > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if result['status'] != 'PASSED':
                    error_msg = result.get('error', f"Expected {result.get('expected')}, got {result.get('got')}")
                    print(f"   - {result['test']}: {error_msg}")
        
        return self.tests_passed == self.tests_run

def main():
    print("="*60)
    print("🚀 Bookup Hookup API Testing")
    print("="*60)
    
    tester = BookupHookupAPITester()
    
    # Test 1: Register new user
    print("\n📝 REGISTRATION & AUTH TESTS")
    print("-"*60)
    if not tester.test_register():
        print("❌ Registration failed, stopping tests")
        tester.print_summary()
        return 1
    
    # Test 2: Get current user
    if not tester.test_get_me():
        print("❌ Get current user failed")
    
    # Test 3: Update profile
    print("\n👤 PROFILE TESTS")
    print("-"*60)
    if not tester.test_update_profile():
        print("❌ Profile update failed")
    
    # Test 4: Get members
    print("\n👥 MEMBERS TESTS")
    print("-"*60)
    if not tester.test_get_members():
        print("❌ Get members failed")
    
    # Test 5: Messaging
    print("\n💬 MESSAGING TESTS")
    print("-"*60)
    # Try to send message to self (should work)
    if tester.user_id:
        tester.test_send_message(tester.user_id)
    
    tester.test_get_messages()
    
    # Test 6: Referral system
    print("\n🎁 REFERRAL TESTS")
    print("-"*60)
    tester.test_get_referral_code()
    tester.test_get_referral_stats()
    
    # Print summary
    success = tester.print_summary()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
