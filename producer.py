from kafka import KafkaProducer
import json

producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

def send_transaction(data):
    producer.send("transactions", value=data)
    producer.flush()


if __name__ == '__main__':
    data = {
    "amount": 999,
    "counterparty": "TEST",
    "mode": "UPI",
    "intent": "UPI_DEBIT"
    }
    send_transaction(data)