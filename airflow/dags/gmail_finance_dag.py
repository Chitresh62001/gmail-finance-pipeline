from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator

default_args = {
    'owner': 'chitresh',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'gmail_finance_parser',
    default_args=default_args,
    description='Runs the Gmail Finance parser daily',
    schedule_interval='0 23 * * *', #11:00 PM daily
    start_date=datetime(2026, 4, 17),
    catchup=False,
    tags=['finance'],
) as dag:

    run_parser = BashOperator(
        task_id='run_email_parser',
        bash_command='source /home/chitresh/Desktop/bored/gmail_finance_project/.venv/bin/activate && cd /home/chitresh/Desktop/bored/gmail_finance_project && python email_parser.py'
    )
