#!/usr/bin/env python3
"""
Simplified token generator - just paste the authorization code.
"""

import requests

CLIENT_ID = "[Client ID]"
CLIENT_SECRET = "[Client Secret]"
REDIRECT_URI = "https://example.com"

def main():
    print("="*60)
    print("OURA TOKEN GENERATOR - SIMPLIFIED")
    print("="*60)
    
    print("\n📋 STEP 1: Get Authorization Code")
    print("-" * 60)
    print("Open this URL in your browser:\n")
    
    auth_url = f"https://cloud.ouraring.com/oauth/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=daily+spo2+workout+personal+heart_health+stress+session+heartrate"
    print(auth_url)
    
    print("\n" + "-" * 60)
    print("After you authorize:")
    print("  1. You'll see an error page (this is normal!)")
    print("  2. Look at the URL in your browser's address bar")
    print("  3. It will look like: https://example.com ... code=XXXXXXXXX")
    print("  4. Copy JUST the code part (everything after 'code=')")
    print("-" * 60)
    
    # Get just the code
    print("\n📋 STEP 2: Paste Authorization Code")
    auth_code = input("\nPaste the authorization code here: ").strip()
    
    # Remove common prefixes if user pasted the full URL
    if "code=" in auth_code:
        auth_code = auth_code.split("code=")[1].split("&")[0]
    
    if not auth_code:
        print("❌ Error: No code provided")
        return
    
    print(f"\n✓ Code received: {auth_code[:20]}...")
    
    # Exchange code for tokens
    print("\n🔄 Getting tokens...")
    
    try:
        response = requests.post(
            "https://api.ouraring.com/oauth/token",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={
                "grant_type": "authorization_code",
                "code": auth_code,
                "redirect_uri": REDIRECT_URI,
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
            }
        )
        
        if response.status_code != 200:
            print(f"❌ Error {response.status_code}:")
            print(response.text)
            print("\nTroubleshooting:")
            print("  - Make sure you copied the FULL authorization code")
            print("  - Codes expire quickly - try the process again")
            print("  - Make sure the redirect URI matches your OAuth app settings")
            return
        
        token_data = response.json()
        
        refresh_token = token_data.get("refresh_token")
        
        if not refresh_token:
            print("❌ No refresh token in response")
            print(f"Response: {token_data}")
            return
        
        # Save to file
        with open("refresh_token.txt", "w") as f:
            f.write(refresh_token)
        
        print("\n" + "="*60)
        print("✅ SUCCESS!")
        print("="*60)
        print(f"\nRefresh token saved to: refresh_token.txt")
        print(f"Token preview: {refresh_token[:30]}...")
        print(f"Token length: {len(refresh_token)} characters")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()

