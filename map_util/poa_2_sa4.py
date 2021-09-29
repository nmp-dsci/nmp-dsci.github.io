#  open in 'data' directory 

import pandas as pd 
import os 

pd.options.display.max_columns = 100

# Ran from d3 examples
poa_df = pd.read_csv('poa_2_mesh.csv')
sa_df = pd.read_csv('SA_2_mesh.csv')

### 

# sa_df.query("STATE_NAME_2016 == 'New South Wales'").nunique(axis=0)

## 
master_df = poa_df.merge(sa_df.drop(['AREA_ALBERS_SQKM'],axis=1),on=["MB_CODE_2016"], how='outer')

## check all suburbs exist
master_df.STATE_NAME_2016.value_counts()

master_df.isnull().sum(axis=0)

# master_df = master_df.query("STATE_NAME_2016=='New South Wales'")

## check coverage
assert master_df.isnull().sum(axis=0)['POA_CODE_2016'] == 0, "ERROR, POA 2 SA3 failed"


##################
agg_lvl = ['SA4_CODE_2016']
poa_lvl = ['POA_CODE_2016']
num_lvl = ['AREA_ALBERS_SQKM']

## 
poa_SA4 = master_df.groupby(agg_lvl + poa_lvl)[num_lvl].sum().reset_index()
poa_agg = poa_df.groupby(poa_lvl)[num_lvl].sum().reset_index().rename(columns={'AREA_ALBERS_SQKM':'POA_SQM'})
poa_SA4 = poa_SA4.merge(poa_agg,on=poa_lvl,how='left')

##
poa_SA4['SQM_PCTN'] = poa_SA4.AREA_ALBERS_SQKM /poa_SA4.POA_SQM
poa_SA4 = poa_SA4.sort_values('SQM_PCTN',ascending = False)
poa_SA4['rank'] = poa_SA4.groupby('POA_CODE_2016').cumcount()
poa_SA4 = poa_SA4.query('rank == 0')

##
SA4_name = sa_df.groupby(['SA4_CODE_2016'])['SA4_NAME_2016'].max().reset_index() 
poa_SA4 = poa_SA4.merge(SA4_name, on='SA4_CODE_2016', how='left')

poa_SA4.query('POA_CODE_2016 == 2076')
poa_SA4.query('SA4_NAME_2016 == "Ku-ring-gai"')
poa_SA4.query('POA_CODE_2016 == 2601')


poa_SA4.to_csv("poa_2_SA4.csv", index=False)

####################################
##

assert poa_SA4.POA_CODE_2016.value_counts().value_counts().shape[0] == 1, "ERROR: postcode dups to SA4"

cols = ['SA4_CODE_2016','POA_CODE_2016']

with open("poa_2_SA4.txt","w") as sqltxt:
    sqltxt.write("CREATE TABLE sandpit.poa_2_SA4 AS " +  " UNION ALL ".join(poa_SA4.apply(lambda x: 'SELECT {SA4} as SA4_CODE_2016, {poa} as POA_CODE_2016'.format(
        SA4=x['SA4_CODE_2016'], poa=x['POA_CODE_2016']), axis=1).to_list()))

