import uvicorn
import logging
import traceback
import sys

if __name__ == "__main__":
    try:
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            log_level="info",
            reload=False,
            access_log=True
        )
    except Exception as e:
        with open("server_crash.log", "a", encoding="utf-8") as f:
            f.write(f"Fatal error: {e}\n")
            traceback.print_exc(file=f)
        sys.exit(1)
