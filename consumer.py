from kafka import KafkaConsumer
import json
import psycopg2

consumer = KafkaConsumer(
    'transactions',
    bootstrap_servers='localhost:9092',
    group_id = 'finance-group',
    value_deserializer=lambda x: json.loads(x.decode('utf-8')),
    auto_offset_reset='earliest',
    enable_auto_commit=True
)

conn = psycopg2.connect(
    dbname="finance_db",
    user="postgres",
    password="postgres",
    host="localhost",
    port="5432"
)

cursor = conn.cursor()

for msg in consumer:
    data = msg.value
    print(data)
    try:
        cursor.execute("""
            INSERT INTO transactions (account,amount, counterparty, intent, txn_date)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            data.get('Account'),
            data.get("Amount"),
            data.get("Recipent"),
            data.get("Intent"),
            data.get("Date")
        ))
    except psycopg2.errors.UniqueViolation as e:
        print(e)
    except Exception as e:
        print(e)

    conn.commit()
    print("Inserted:", data)