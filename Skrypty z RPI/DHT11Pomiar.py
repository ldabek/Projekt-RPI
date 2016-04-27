#!/usr/bin/python

import sys
from datetime import datetime
import Adafruit_DHT
import pymongo


def get_database_instance_ready_to_work():
    """
    Creates connection to MongoDb
    """
    client = pymongo.MongoClient('127.0.0.1:3001')
    return client.mongo


def read_humidity_and_temperature_from_raspberry():
    """
    Read from sensor DHT17 connected to GPIO17
    """
    return Adafruit_DHT.read_retry(Adafruit_DHT.DHT11, 17)


def insert_data(temperature, humidity):
    """
    Inserts temperature and humidity to separated collections in Mongo
    """
    db = get_database_instance_ready_to_work()
    data_read_date = datetime.now()
    db.temperature.insert_one(dict(temperature=temperature, date=data_read_date))
    db.humidity.insert_one(dict(humidity=humidity, date=data_read_date))


def main():
    humidity, temperature = read_humidity_and_temperature_from_raspberry()
    if humidity is not None and temperature is not None:
        insert_data(temperature, humidity)
        print('Temperature={0:0.1f}*\nHumidity={1:0.1f}%'.format(temperature, humidity))
    else:
        print('Read data error. Try again!')
        sys.exit(1)


if __name__ == '__main__':
    main()