import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

# Database connection parameters
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "finance_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def export_data():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Fetch all transactions
        cursor.execute("SELECT id, account, amount, counterparty, intent, txn_date FROM transactions ORDER BY txn_date DESC")
        transactions = cursor.fetchall()
        
        # Fetch distinct options
        cursor.execute("SELECT DISTINCT account FROM transactions WHERE account IS NOT NULL")
        accounts = [row['account'] for row in cursor.fetchall()]
        
        cursor.execute("SELECT DISTINCT intent FROM transactions WHERE intent IS NOT NULL")
        intents = [row['intent'] for row in cursor.fetchall()]
        
        # Convert float/decimal to native types to ensure JSON serialization compatibility
        for t in transactions:
            t['amount'] = float(t['amount'])
            
        data = {
            "transactions": transactions,
            "filterOptions": {
                "accounts": accounts,
                "intents": intents
            }
        }
        
        output_path = os.path.join(os.path.dirname(__file__), '..', 'docs', 'public_data.json')
        
        with open(output_path, 'w') as f:
            json.dump(data, f, cls=DateTimeEncoder, indent=2)
            
        print(f"Successfully exported data to {output_path}")
        
    except Exception as e:
        print(f"Error exporting data: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    export_data()
