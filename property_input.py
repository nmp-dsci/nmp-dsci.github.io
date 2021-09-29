# 
# Dependancies: Modelling table for "Acquisition Renewals" in "20200520_acq_renew"
#  Run locally
#
###

import os,sys ,json, shutil
import time,datetime,math
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import zlib, base64
import hashlib 


#  Raw dataset
prop_df = pd.read_csv(f"../data/adhoc/20180304_property_df.csv")

# Generate features
prop_df['sale_yyyymm'] = prop_df.dateID.str.slice(0,7)
# filters
prop_df = prop_df.query('propertyType in ["house","apartment","semi detached"] ')
prop_df = prop_df.query('sale_yyyymm >= "2015-01" & sale_yyyymm <= "2017-12"')

# clean up variables
prop_df.beds = prop_df.beds.apply(lambda x: 5 if x > 5 else 1 if x < 1 else x )
prop_df.baths = prop_df.baths.apply(lambda x: 4 if x > 4 else 1 if x < 1 else x )
prop_df.parking = prop_df.parking.apply(lambda x: 3 if x > 3 else x )

# Treat NULLS 
prop_df = prop_df.query('beds ==beds & baths == baths & parking==parking & longitude==longitude & latitude==latitude')
prop_df = prop_df.query('sale_price == sale_price')
prop_df = prop_df.query('sale_price <5000000')

prop_df.sale_price = prop_df.sale_price.astype(int)
prop_df.sort_values('sale_price',ascending=False).head(10)

prop_df.postcode = prop_df.postcode.astype(int).astype(str)

print('NULLS')
print(prop_df.isnull().sum(axis=0)) 

# metrics 
prop_df['sold_n'] = 1
prop_df = prop_df.rename(columns={'sale_price':'price_n_v','sold_n':'sold_n_v'})

pins_df = prop_df.query('propertyType=="house"')[['longitude','latitude','price_n_v']]
pins_df = pins_df.rename(columns={'longitude':'lng','latitude':'lat'})

pins_json = pins_df.to_dict(orient='records')
with open('data/pins_df.json','w') as fct:
    fct.write("{id} = '{json}'".format(id='pins_json',json=json.dumps(pins_json)))


######################################
# Generate 'co-ordinates' for them map
suburb_df = prop_df[prop_df.suburb.str.upper() == "NORMANHURST"]
suburb_df = suburb_df[['postcode','suburb','street','longitude','latitude','dateID','price_n_v']]

suburb_df.isnull().sum(axis=0)

suburb_json = suburb_df.to_dict(orient='records')
with open('data/suburb_df.json','w') as fct:
    fct.write("{id} = '{json}'".format(id='suburb_json',json=json.dumps(suburb_json)))


######################################
# Generate the value per postcode

postcode_df = prop_df.groupby('postcode').price_n_v.describe().reset_index()
postcode_df = postcode_df.fillna(0)

postcode_json = postcode_df.to_dict(orient='records')
with open('data/postcode_df.json','w') as fct:
    fct.write("{id} = '{json}'".format(id='postcode_json',json=json.dumps(postcode_json)))


