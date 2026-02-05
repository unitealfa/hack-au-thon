#!/bin/bash

echo "🧪 Testing Agricoole Backend API"
echo "================================"
echo ""

BASE_URL="http://localhost:8787"

# Test 1: Health Check
echo "1. Testing Health Endpoint..."
HEALTH=$(curl -s ${BASE_URL}/api/health)
echo "   Response: $HEALTH"
echo ""

# Test 2: Login
echo "2. Testing Login Endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@agricoole.com","password":"demo123"}')

echo "   Response: $LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "   ❌ Login failed or no token received"
  exit 1
else
  echo "   ✅ Login successful! Token received"
fi
echo ""

# Test 3: Get User Info
echo "3. Testing Get User Info (Protected)..."
USER_INFO=$(curl -s ${BASE_URL}/api/auth/me \
  -H "Authorization: Bearer $TOKEN")
echo "   Response: $USER_INFO"
echo ""

# Test 4: Get Fields
echo "4. Testing Get Fields (Protected)..."
FIELDS=$(curl -s ${BASE_URL}/api/fields \
  -H "Authorization: Bearer $TOKEN")
echo "   Response: $FIELDS"

# Extract field ID
FIELD_ID=$(echo $FIELDS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "   Field ID: $FIELD_ID"
echo ""

# Test 5: Get Dashboard Data
if [ ! -z "$FIELD_ID" ]; then
  echo "5. Testing Dashboard Endpoint..."
  DASHBOARD=$(curl -s ${BASE_URL}/api/dashboard/${FIELD_ID} \
    -H "Authorization: Bearer $TOKEN")
  echo "   Response (truncated):"
  echo "   $DASHBOARD" | head -c 300
  echo "..."
  echo ""
fi

# Test 6: Test without auth (should fail)
echo "6. Testing Protected Route without Token..."
NO_AUTH=$(curl -s ${BASE_URL}/api/fields)
echo "   Response: $NO_AUTH"
echo ""

echo "================================"
echo "✅ Backend API Test Complete!"
