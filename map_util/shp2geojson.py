
# source:https://www.abs.gov.au/AUSSTATS/abs@.nsf/DetailsPage/1270.0.55.003July%202016?OpenDocument
# directory: work from the directory where shape file downloaded
# export to directory above
# used: "https://mapshaper.org"

import shapefile
import json
import os ,re 
import pandas as pd 
import numpy as np


# read the shapefile
reader = shapefile.Reader("1270055003_poa_2016_aust_shape/POA_2016_AUST.shp")
feature = reader.shapeRecords()[0]
fields = reader.fields[1:]
fields_df = pd.DataFrame(fields,columns=['name','format','length','unknown'])

# simplied
reader_simp = shapefile.Reader("POA_2016_AUST_simplified/POA_2016_AUST.shp")



reduce_lvl =3 -0.0001   # shrink coordinates by how much? 

buffer,buffer_r = [],[]
for idx,sr in enumerate(reader.shapeRecords()):
    print(idx)
    poa_name = sr.record[1]
    if re.match("2\d{3}",poa_name) is None :
        continue
    print('POA name: "{p}"'.format(p=poa_name))
    atr = dict(zip(fields_df.name, sr.record))
    # full version
    geom = sr.shape.__geo_interface__    
    buffer.append(dict(type="Feature", geometry=geom, properties=atr)) 
    # simplified
    geom_r = reader_simp.shapeRecords()[idx].shape.__geo_interface__  
    buffer_r.append(dict(type="Feature", geometry=geom_r, properties=atr))



# write the GeoJSON file
geojson = open("POA_2016_NSW.geojson", "w")
geojson.write(json.dumps({"type": "FeatureCollection", "features": buffer}) )
geojson.close()

# write GeoJSON reducted
geojson = open("POA_2016_NSW_reduced.geojson", "w")
geojson.write(json.dumps({"type": "FeatureCollection", "features": buffer_r}) )
geojson.close()


