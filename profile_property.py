"""
Objective: Generate base table and subsequent inputs for each of the website components

"""

import os,sys ,json, shutil
import time,datetime,math
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import zlib, base64
import hashlib 

#####################

user_path = os.environ.get('USERPROFILE').replace("\\","/")
user_dir =  f'{user_path}/Documents/Github' if "phillip" in user_path.lower() else f'{user_path}/Repository'

## Reconfig file folder
file_dir = f'{user_dir}/newsfeed'
dl_dir = f"{user_dir}/data_lab"
data_dir = f"{user_dir}/data"
adhoc_dir = f"{data_dir}/adhoc"

sys.path.append(file_dir)
# from config import * 

pd.options.display.max_columns = 200


#  Raw dataset
prop_df = pd.read_csv(f"{adhoc_dir}/20180304_property_df.csv")

# Generate features
prop_df['YYYY'] = np.floor(prop_df.YYYYQ/10 ).astype(int)

# filters
prop_df = prop_df.query('propertyType in ["house","apartment","semi detached"] ')
prop_df = prop_df.query('YYYYQ >= 20130 & YYYYQ <= 20174')

# clean up variables
prop_df.beds = prop_df.beds.apply(lambda x: 5 if x > 5 else 1 if x < 1 else x )
prop_df.baths = prop_df.baths.apply(lambda x: 4 if x > 4 else 1 if x < 1 else x )
prop_df.parking = prop_df.parking.apply(lambda x: 3 if x > 3 else x )

# Treat NULLS 
prop_df = prop_df.query('beds ==beds & baths == baths & parking==parking')
prop_df = prop_df.query('sale_price == sale_price')
prop_df = prop_df.query('sale_price <5000000')

prop_df.sale_price = prop_df.sale_price.astype(int)
prop_df.sort_values('sale_price',ascending=False).head(10)


print('NULLS')
print(prop_df.isnull().sum(axis=0)) 

# Aggregation
agg_cols = ['YYYYMM','YYYYQ','YYYY','postcode','suburb','baths','beds','parking','propertyType']
summ_df = prop_df.groupby(agg_cols).agg({'sale_price':[np.sum,np.size]})
summ_df.columns = ['sales','sold']
summ_df = summ_df.reset_index() 

summ_df.postcode = summ_df.postcode.astype(int)

assert summ_df.isnull().sum(axis=0).sum() == 0, "ERROR: NULLS exists"

#####################################
## Enhance postcode to higher level geos

poa_df = pd.read_csv('assets/poa_2_SA4.csv')
poa_df = poa_df[['POA_CODE_2016','SA4_NAME_2016']]
poa_df = poa_df.rename(columns={'POA_CODE_2016':'postcode','SA4_NAME_2016':'SA4_region'})

summ_df = summ_df.merge(poa_df, on='postcode',how='left')
summ_df['metro_region'] = summ_df.SA4_region.str.contains('Sydney').apply(lambda x: 'Metro' if x else "Regional")

summ_df = summ_df.query('SA4_region==SA4_region')
assert summ_df.isnull().sum(axis=0).sum() == 0, "ERROR: NULLS exists"


summ_df['dummy'] ='all'
summ_df['suburb'] = summ_df['suburb'].str.upper()


#####################################
## export

fn = 'profile_property'
from urllib.parse import quote, unquote
import base64
import zlib

chart_base = summ_df.to_dict(orient='record')

aaa = base64.b64encode(
            zlib.compress(
                # json.dumps("{id} = '{json}'".format(id=job_name,json=json.dumps(chart_base))).encode('utf-8')
                json.dumps("{json}".format(json=json.dumps(chart_base))).encode('utf-8')
            )
        ).decode('ascii')

with open('datafeed/{f}_pako.json'.format(f=fn),'wb') as fct:
    fct.write(bytes(f"zipped='{aaa}'","utf-8"))


