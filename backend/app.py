import os
from flask import Flask
from config.db import get_db_connection

app = Flask(__name__)

@app.route("/")
def home():
    return {"message": "AI Meeting Minutes API running"}

@app.route("/test-db")
def test_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT NOW();")
    result = cur.fetchone()
    cur.close()
    conn.close()
    return {"database_time": result}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)






    