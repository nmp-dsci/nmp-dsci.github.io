
# source:https://www.abs.gov.au/AUSSTATS/abs@.nsf/DetailsPage/1270.0.55.003July%202016?OpenDocument
# directory: work from the directory where shape file downloaded
# export to directory above
# used: "https://mapshaper.org"

import shapefile
import json
import os ,re 
import pandas as pd 
import numpy as np
import matplotlib.pyplot as plt
from math import sin, cos, sqrt, atan2, radians


# read the shapefile
fn = "POA_2016_AUST"

reader = shapefile.Reader(f"{fn}.shp")
feature = reader.shapeRecords()[0]
fields = reader.fields[1:]
fields_df = pd.DataFrame(fields,columns=['name','format','length','unknown'])

# simplied from 'mapshaper'
reader_simp = shapefile.Reader(f"POA_2016_AUST_simple/{fn}.shp")
#  = shapefile.Reader(f"{fn}.shp")

# with shapefile.Reader(f"POA_2016_AUST_simple/{fn}.shp") as shp:
#     print(shp)

# #########
# print("shape types available") 
# print(shp.shapeType)
# print(shp.shapeTypeName)
# #  Should be 5 = "POLYGON"
# 
# print(f'Shapefile Length: {len(shp)}')
# print(f'bounding box: {shp.bbox}')


buffer,buffer_r = [],[]
for idx,sr in enumerate(reader.shapeRecords()):
    print(idx)
    poa_name = sr.record[1]
    if "Migratory - Offshore - Shipping" in poa_name :
        continue
    if "No usual address" in poa_name :
        continue
    atr = dict(zip(fields_df.name, sr.record))
    print(atr)
    # if atr.get("STE_NAME16") not in ["Australian Capital Territory",'New South Wales'] :
    #     continue
    # full version
    geom = sr.shape.__geo_interface__    
    buffer.append(dict(type="Feature", geometry=geom, properties=atr)) 
    # simplified
    geom_r = reader_simp.shapeRecords()[idx].shape.__geo_interface__  
    buffer_r.append(dict(type="Feature", geometry=geom_r, properties=atr))



##############################
## Get the centroids 

centroid_df = []
for poa in buffer_r: 
    postcode = poa['properties']['POA_CODE16']
    geom_set = poa['geometry']['coordinates'][0]
    if len(geom_set) < 4 :
        geom_set = geom_set[0]
    centroid = pd.DataFrame(geom_set).mean(axis=0)
    if len(centroid) == 2:
        centroid_df +=[{'postcode':postcode,'long':centroid[0],'lat':centroid[1]}]
    else : 
        print('error')
        break

centroid_df = pd.DataFrame(centroid_df)
centroid_df['dummy'] = 1 

# centroid_df.query('postcode in ["2450","2000"]')


distance_df = centroid_df.merge(centroid_df,on='dummy')

distance_df = distance_df.query('postcode_x <= postcode_y')

# original: 7,118,224, 3,560,446
# spot check
distance_df.query('postcode_x=="2126" and postcode_y =="2076"')
distance_df.query('postcode_x=="2076" and postcode_y =="2126"')


def get_distance(rowid):
    # approximate radius of earth in km
    R = 6373.0
    lat1 = radians(rowid.lat_x)
    lon1 = radians(rowid.long_x)
    lat2 = radians(rowid.lat_y)
    lon2 = radians(rowid.long_y)
    #
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    #
    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    #
    distance = R * c
    return distance


distance_df['distance'] = distance_df.apply(lambda x:get_distance(x) ,axis=1) 

# Centroids
centroid_df.to_csv("postcode_centroids.csv")

# Distance metrics
dropCols =['long_x','lat_x','dummy','long_y','lat_y']
distance_df = distance_df.drop(dropCols,axis=1)

distance_df.to_csv("postcode_distances.csv")



