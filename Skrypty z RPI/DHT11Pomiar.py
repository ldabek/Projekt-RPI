#!/usr/bin/python

import sys
import Adafruit_DHT
import time
import MySQLdb

#Polaczenie z baza danych MySQL
def insert_temp_reading (temperature,humidity):
 
 conn = MySQLdb.connect("host","nazwa_użtkownika","hasło","nazwa_bazy_danych")
 cursor = conn.cursor()
 params = [temperature,humidity]
 
 try:
   cursor.execute("INSERT INTO dane (data,temperatura,wilgotnosc) VALUE (NOW(),%s,%s)",params)
   conn.commit()
 except MySQLdb.Error, e:
   print "An error has occurred. %s" %e
 finally:
  cursor.close()
  conn.close() 

def main():
#Pobieranie temperatury oraz wilgotnosci z sensora DHT11 podpietego do GPIO17
	humi, temp = Adafruit_DHT.read_retry(Adafruit_DHT.DHT11, 17)
#Wyswietlanie temperatury i zapis do bazy danych MySQL
	if humi is not None and temp is not None:
		insert_temp_reading (temp,humi)
		print('Temperatura={0:0.1f}* Wilgotnosc={1:0.1f}%'.format(temp, humi))
	else:
		print('Blad odczytu. Sprobuj ponownie!')

		sys.exit(1)
if __name__ == '__main__':
    main()