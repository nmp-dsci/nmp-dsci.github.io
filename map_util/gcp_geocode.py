import shapefile
import json
import os ,re 
import pandas as pd 
import numpy as np 
import requests


### Get address 

fni = "servicing"

with open(f"locations_raw_{fni}.txt") as fn : 
    ldf = fn.read()

ldf = json.loads(ldf)

# check for duplicates
# pd.DataFrame(ldf).name.value_counts() 

output_geo = []
for store in ldf: 
    print(store)
    #
    address =store.get('address') + ' Australia'
    urli = f'https://maps.googleapis.com/maps/api/geocode/json'
    params = {'address':address, "key":''}
    r = requests.get(urli , params=params)
    #
    if r.json().get('status') == "OK": 
        print("Appending Results ")
        r_output = r.json().get('results')[0]
        r_geo = r_output.get('geometry').get('location')
        store['location'] = {'longitude':r_geo.get('lng'),'latitude':r_geo.get('lat')}
        #
        output_geo +=[store] 
    else: 
        print("ERROR: API failed")



with open(f'locations_geo_{fni}.json','w')  as out:
    out.write(json.dumps(output_geo))

