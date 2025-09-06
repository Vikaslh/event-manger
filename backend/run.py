#!/usr/bin/env python3
"""
Startup script for the Campus Event Management API
"""
import uvicorn
from main import app

if __name__ == "__main__":
    print("🚀 Starting Campus Event Management API...")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔧 Interactive API: http://localhost:8000/redoc")
    print("🌐 API Base URL: http://localhost:8000")
    print("-" * 50)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )
