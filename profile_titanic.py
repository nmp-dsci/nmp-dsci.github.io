

# *************************************************
#   INIT: 
# ************************************************* 

import numpy as np#
from datetime import datetime#
import pandas as pd # 
import os ,sys
import json
import zlib, base64

s_dt_total = datetime.now()

##############################################
## write automation code

fn = "profile_titanic"

train_df = pd.read_csv('datafeed/data_titanic/train.csv')
train_df['model_cd'] = 'train'
test_df = pd.read_csv('datafeed/data_titanic/test.csv')
test_df['model_cd'] = 'test'

base_df = pd.concat([train_df,test_df], axis=0)

raw_cols = list(base_df.columns )
metrics = ['Survived']

nuniq_df = base_df.groupby('model_cd').nunique()
nuniq_df['check'] = 'nunique'

null_df = base_df.groupby('model_cd').apply(lambda x: x.isnull().sum())
null_df['check'] = 'missing'

col_stats = pd.concat([
    nuniq_df
,   null_df
,   pd.DataFrame(base_df.dtypes).T
],axis=0)

# predictors = list(np.setdiff1d(raw_cols, ))
# "_pred" means it has been updates for the modelling to work better
predictors = ['Pclass','Sex','Ageband','SibSp','Parch','Fare_pred','Embarked','model_cd']

#investigate predictors
# base_df.groupby(['model_cd','Embarked']).size().unstack('Embarked')
# base_df['Cabin'].value_counts(dropna=False)

# Outstanding predictors
# 1. name: for family structure (priority: low)
# 2. ticket: for family structure (priority: HIGH)
# 3. cabin: for family structure (priority: HIGH)

#### Clean up predictors
base_df['Ageband'] = np.floor(base_df['Age']/10).apply(lambda x: 6 if x > 6 else x ).fillna(-99)


# base_df.query('Fare != Fare')
base_df['Fare_pred'] = base_df.Fare.fillna(base_df.Fare.mean())
base_df['Fare_pred'] = np.floor(base_df['Fare_pred']/10).apply(lambda x: 10 if x > 10 else x )


base_df['survived_n_v'] = (base_df.model_cd=='train').astype(int) * base_df['Survived'].fillna(0)
base_df['passengers_n_v'] = (base_df.model_cd=='train').astype(int)
base_df['total_n_v'] = 1


base_df['Embarked'] = base_df['Embarked'].fillna('S')

### Rename predictor values to make them easy to read 

base_df['Ageband'] = base_df['Ageband'].replace({
    -99:'missing',
    0:'0-10',
    1:'11-20',
    2:'21-30',
    3:'31-40',
    4:'41-50',
    5:'51-60',
    6:'61+'
})

base_df['Fare_pred'] = base_df['Fare_pred'].replace({
    0:'$0-$10',
    1:'$11-$20',
    2:'$21-$30',
    3:'$31-$50',
    4:'$31-$50',
    5:'$51-$70',
    6:'$51-$70',
    7:'$71-$99',
    8:'$71-$99',
    9:'$71-$99',
    10:'$99+'
})

base_df['Parch'] = base_df['Parch'].replace({
    0:'0',
    1:'1',
    2:'2',
    3:'3+',
    4:'3+',
    5:'3+',
    6:'3+',
    7:'3+',
    8:'3+',
    9:'3+',
})

base_df['SibSp'] = base_df['SibSp'].replace({
    0:'0',
    1:'1',
    2:'2+',
    3:'2+',
    4:'2+',
    5:'2+',
    6:'2+',
    7:'2+',
    8:'2+',
    9:'2+',
})



################################################################
## Generate Queries 

# dt_col = None
agg_cols = predictors

metrics = {'survived_n_v':np.sum
    ,   'passengers_n_v': np.sum
    ,   'total_n_v':np.sum
    }


from tool_utils.util_gen_combos import generate_combos

final_combos = generate_combos(agg_cols,levelsCombo = 3)




####################################
# 
# Generate final table 
batch_size = 100#
batch_len = int(np.ceil(len(final_combos)*1.0 / batch_size))#
# 
agg_cols = ['agg'+str(x)+'_c' for x in range(0,len(final_combos[0]))]#
# 
property_cols = ['cutid'] +agg_cols + [x.replace('_c','_v') for x in agg_cols] + list(metrics.keys())
profile_df = pd.DataFrame([], columns = property_cols)
# 
for bID, block in enumerate(range(0, batch_len)) : #
    print("Checking batch id: "+ str(bID))#
    block_min,block_max = block*100,  min([block*batch_size+(batch_size-1), len(final_combos)])#
    block_combos = final_combos[block_min:(block_max+1)]#
    ## check block already exists 
    base_exists = "profile_prop"+str(bID)  in list(globals().keys())#
    if base_exists == False:#
        print("Running batch id: "+ str(bID))#
        ## step 1 : generate the summary low level tables
        for idx, combo in enumerate(block_combos):#
            print(f"Running combo: {idx} ")#
            combo_aggs = [x  for x in combo if x != "'all'"]
            combo_df = base_df.groupby(combo_aggs).agg(metrics).reset_index() 
            # Agg prep 
            for cidx,col in enumerate(combo): 
                if col != "'all'": 
                    combo_df[f'agg{cidx}_c'] = col
                    combo_df = combo_df.rename(columns = {col:f'agg{cidx}_v'})
                else :
                    # Default missing 
                    combo_df[f'agg{cidx}_c'] = "all"
                    combo_df[f'agg{cidx}_v'] = "all"
            # Dump 
            combo_df['cutid'] = idx
            profile_df = pd.concat([profile_df,combo_df],axis=0)




#####################################
## Column identification

metrics = pd.Series(list(profile_df.columns))
metrics = metrics[metrics.str.contains('_n_v$')].to_list()

uniq_cols = list(np.setdiff1d(profile_df.columns,metrics))
profile_df = profile_df.sort_values(metrics[0], ascending=False)
profile_df = profile_df.fillna('missing').groupby(uniq_cols)[metrics].sum().reset_index() 

agg_cols = pd.Series(uniq_cols)
agg_cols = agg_cols[agg_cols.str.contains('agg\d_\w')].to_list()

search_cols = pd.Series(profile_df.columns)
search_cols = search_cols[search_cols.str.contains('agg\d_c')].to_list()

# Ensure all strings
profile_df[['cutid']+agg_cols] = profile_df[['cutid']+agg_cols].apply(lambda x: x.astype(str), axis=0)



################################
## Generate lookup DF 
lookup_df = profile_df.groupby(['cutid']+search_cols).size().reset_index()
lookup_df = lookup_df.drop(columns = [0])
assert lookup_df.cutid.value_counts().nunique() == 1, "ERROR: cutid is duping OUT "
# lookup_df[search_cols] = lookup_df[search_cols].astype(str)
lookup_df['value'] = lookup_df[search_cols].apply(lambda x: np.sort(x),axis=1)
lookup_df['value'] = lookup_df['value'].apply(lambda x: '___'.join(x))

lookup_json = lookup_df.to_dict(orient='records')

with open(f'datafeed/{fn}_lookup.json','w') as fct:
    fct.write("{id} = '{json}'".format(id='lookup_json',json=json.dumps(lookup_json)))


##################
## dump aggregated data 

## STEP 1: Write Dataset 
chart_base = profile_df.to_dict(orient='records')
aaa = base64.b64encode(
            zlib.compress(
                # json.dumps("{id} = '{json}'".format(id=job_name,json=json.dumps(chart_base))).encode('utf-8')
                json.dumps("{json}".format(json=json.dumps(chart_base))).encode('utf-8')
            )
        ).decode('ascii')

# 
with open(f'datafeed/{fn}_pako.json','wb') as fct:
    fct.write(bytes(f"zipped='{aaa}'","utf-8"))

