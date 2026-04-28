#!/bin/bash
# Test script for Costume Rental API
# Run this after docker compose is up

BASE_URL="http://localhost"

echo "========================================="
echo "Costume Rental API - Test Script"
echo "========================================="
echo ""

# Test 1: Public endpoints (no auth required)
echo "[TEST 1] Public endpoints (no auth required)"
echo "---------------------------------------------"

echo -n "GET /api/settings: "
RESP=$(curl -s "$BASE_URL/api/settings")
if echo "$RESP" | grep -q "app_name"; then
    echo "✓ PASS"
else
    echo "✗ FAIL: $RESP"
fi

echo ""

# Test 2: Protected endpoints (auth required)
echo "[TEST 2] Protected endpoints (auth required)"
echo "------------------------------------------------"

echo -n "GET /api/notifications (no auth): "
RESP=$(curl -s "$BASE_URL/api/notifications")
if echo "$RESP" | grep -q "Authorization header required"; then
    echo "✓ PASS - 401 returned as expected"
else
    echo "✗ FAIL - Should return 401, got: $RESP"
fi

echo -n "GET /api/costumes (no auth): "
RESP=$(curl -s "$BASE_URL/api/costumes")
# Costumes endpoint is intentionally public (catalogue view)
if echo "$RESP" | grep -q "data"; then
    echo "✓ PASS (intentionally public - catalogue)"
else
    echo "✗ FAIL: $RESP"
fi

echo ""

# Test 3: Login and authenticated requests
echo "[TEST 3] Login and authenticated requests"
echo "---------------------------------------------"

echo -n "POST /api/auth/login: "
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@busana.com","password":"admin123"}')

if echo "$LOGIN_RESP" | grep -q "token"; then
    echo "✓ PASS"
    TOKEN=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "  Token: ${TOKEN:0:20}..."
else
    echo "✗ FAIL: $LOGIN_RESP"
    TOKEN=""
fi

if [ -n "$TOKEN" ]; then
    echo ""
    echo -n "GET /api/auth/me: "
    ME_RESP=$(curl -s "$BASE_URL/api/auth/me" \
        -H "Authorization: Bearer $TOKEN")
    if echo "$ME_RESP" | grep -q "email"; then
        echo "✓ PASS"
    else
        echo "✗ FAIL: $ME_RESP"
    fi

    echo -n "GET /api/notifications (with auth): "
    NOTIF_RESP=$(curl -s "$BASE_URL/api/notifications" \
        -H "Authorization: Bearer $TOKEN")
    if echo "$NOTIF_RESP" | grep -q "count"; then
        echo "✓ PASS"
    else
        echo "✗ FAIL: $NOTIF_RESP"
    fi

    echo -n "GET /api/rents (with auth): "
    RENTS_RESP=$(curl -s "$BASE_URL/api/rents" \
        -H "Authorization: Bearer $TOKEN")
    if echo "$RENTS_RESP" | grep -q "data"; then
        echo "✓ PASS"
    else
        echo "✗ FAIL: $RENTS_RESP"
    fi
fi

echo ""
echo "========================================="
echo "Tests completed"
echo "========================================="