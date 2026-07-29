#!/bin/bash
php artisan serve --port=8000 > /dev/null 2>&1 &
SERVER_PID=$!
echo "Server started with PID $SERVER_PID"

# Wait for the server to be ready (max 30 seconds)
TIMEOUT=30
while ! curl -s http://localhost:8000/api/test > /dev/null; do
  sleep 1
  ((TIMEOUT--))
  if [ $TIMEOUT -eq 0 ]; then
    echo "Timeout waiting for server"
    kill $SERVER_PID
    exit 1
  fi
done

# Now, make the request and capture the output
RESPONSE=$(curl -s http://localhost:8000/api/test)
echo "Response: $RESPONSE"

# Kill the server
kill $SERVER_PID