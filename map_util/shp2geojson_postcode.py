
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



# # write the GeoJSON file
# geojson = open(f"{fn}.geojson", "w")
# geojson.write(json.dumps({"type": "FeatureCollection", "features": buffer}) )
# geojson.close()

# write GeoJSON reducted
geojson = open(f"{fn}.geojson", "w")
geojson.write(json.dumps({"type": "FeatureCollection", "features": buffer_r}) )
geojson.close()


