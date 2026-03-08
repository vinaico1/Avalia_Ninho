#!/bin/bash
echo "🏡 Iniciando Avalia Ninho..."

# Start backend
cd backend && node server.js &
BACKEND_PID=$!
echo "✅ Backend iniciado (PID: $BACKEND_PID)"

# Start frontend
cd ../frontend && npx vite &
FRONTEND_PID=$!
echo "✅ Frontend iniciado (PID: $FRONTEND_PID)"

echo ""
echo "🌐 Acesse: http://localhost:3000"
echo "📡 API: http://localhost:3001"
echo ""
echo "Pressione Ctrl+C para parar"

wait
