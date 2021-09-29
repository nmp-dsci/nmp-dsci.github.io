#  set to directory the file is in

import pandas as pd 
import os 
import numpy as np

pd.options.display.max_columns = 100

df = pd.read_csv('20180304_final_df.csv/20180304_final_df.csv')

## time cutoff
df = df.query("YYYYQ >=  20131 and YYYYQ <= 20174")

## column cutoff
columns = ["source","state",'postcode',"suburb","dateID",
'D_Sale_type','D_landSize',
"R_constructionStatus","sale_price",
"longitude","latitude",
"baths","propertyType","beds","parking"]

df = df[columns]

###  Prepare cuts of the data
df.baths = df.baths.apply(lambda x: 5 if x > 5 else 0 if x < 0 else x  )
df.beds = df.beds.apply(lambda x: 4 if x > 4 else  0 if x < 0 else x  )
df.parking = df.parking.apply(lambda x: 3 if x > 3 else  0 if x < 0 else x  )

###
df.sale_price = df.sale_price.apply(lambda x: np.NaN if x < 300000 or x > 10000000 else x )


###  postcode summ 
df['year'] = df.dateID.str.slice(0,4)
df = df.query("year >=  '2014' and year <= '2017'")
df.year.value_counts()

baseID = ['postcode', 'year']
aggID = ['baths','beds','parking','propertyType']


df = df.query('sale_price==sale_price')


poa_summ = df.groupby(baseID+aggID
    ).agg({'sale_price':[np.size,np.sum]})
poa_summ.columns = ['volume','sales']
poa_summ = poa_summ.reset_index()

poa_summ.postcode = poa_summ.postcode.astype(int) 
poa_summ.baths = poa_summ.baths.astype(int) 
poa_summ.beds = poa_summ.beds.astype(int) 
poa_summ.parking = poa_summ.parking.astype(int) 
poa_summ.volume = poa_summ.volume.astype(int) 

## left join back to postcode
poa_master = pd.read_csv("mesh2poa.csv")
poa_master = poa_master.query('POA_CODE_2016 >=2000 and POA_CODE_2016 <= 2999')

poa_master = poa_master.groupby('POA_CODE_2016').AREA_ALBERS_SQKM.sum().reset_index()
poa_master = poa_master.rename(columns={'POA_CODE_2016':'postcode',"AREA_ALBERS_SQKM":"sqkm"})

poa_summ = poa_master.merge(poa_summ, on='postcode',how='left')

poa_summ.to_csv("property_poa.csv")


# investigations into data
df = pd.read_csv("property_poa.csv")

aaa = df.query('postcode==2030 and propertyType=="house" ')


aaa.sales.sum()/aaa.volume.sum()





