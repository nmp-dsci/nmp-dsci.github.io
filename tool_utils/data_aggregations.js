// Flatten Utilities
const uniqueValues = function(columns=[]){
  var valueDict = [];
  columns.forEach(function(col){
      colSpecs = attrCols.filter(d=> d.column === col)[0];
      if (colSpecs && 'order' in colSpecs){
        values = colSpecs['order'];
      } else {
        values = [... new Set(data_df.map(d=> d[col]))];
      }
      valueDict.push({
      key:col
      , value:values
      });
  })
  return valueDict
}

// CARTESIAN PRODUCTS
function allCombos(valueDict=[]){

  const f = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
  const cartesian = (a, b, ...c) => (b ? cartesian(f(a, b), ...c) : a);

  if (valueDict.length === 1){
      flatArr = valueDict[0].value.map(d => [d])
  } else if (valueDict.length === 2){
      flatArr = cartesian(valueDict[0].value,valueDict[1].value)
  } else if (valueDict.length === 3){
      flatArr = cartesian(valueDict[0].value,valueDict[1].value,valueDict[2].value)
  } else if (valueDict.length === 4){
      flatArr = cartesian(valueDict[0].value,valueDict[1].value,valueDict[2].value,valueDict[3].value)
  }
  return flatArr
} // end 'allCombos'


// ########################################################
const flatten = function(nestArr, aggList ) {

    // STEP 1: get mapping of all unique columns/values to pull through
    valueDict = uniqueValues(aggList);

    // STEP 2: unstack 'nestArr' based on this
    flatArr = allCombos(valueDict);

    // ancillary; responses requred 
    responses = attrCols.filter( d=> ["y","ts"].includes(d.class)  ).map(d => d.column);
    yDefault = {'missing':1}
    responses.forEach(function(r){
      if ( ['value','uplift'].includes(r)){
        yDefault[r] = 0.00001
      } else {
        yDefault[r] = 0
      }
    })

    // STEP 3: flatten dataset 
    flatDF = [];
    flatArr.forEach(function(combo) {
      comboName = '__'+combo.join('__');

      // Default Object to assign to 'flatDF'
      comboEntry = {};
      aggList.forEach((key,i) => {
        comboEntry[key] = combo[i]
      });

      pullData = nestArr;
      pullData = pullData.filter(r=> r[0] === comboName);

      // default data when it doesn't exist for cut of the data 
      if (pullData.length > 0 ){
        pullData = pullData[0][1]
      } else if (pullData.length ===0){
        pullData = yDefault
      }

      // build master and append values 
      comboEntry = Object.assign(comboEntry,pullData)
      flatDF.push(comboEntry)

    }) // end loop through all combos
    return flatDF
  };


// NEST
function AggSumm(keys, data, rollupFunc) {

  // Generate Agg column 
  data.forEach(r=> Object.assign(r, {'aggCol':''})); 
  keys.forEach(key =>{
    data.forEach(r=> Object.assign(r, {'aggCol':r['aggCol']+'__'+r[key]}));
  })
  // Compute Aggreagion
  summData = d3.rollups(data, rollupFunc , d => d.aggCol);
  return summData;
} // end 'AggSumm' function  

// MASTER summFunc
function summFunc(data, agg){
  // dependancies
  // 'rollupFunction' is the aggregation calculation
  // 'derivedFunction': are derived calucations onto of output of 'rollupFunction'
    
  var summDF = AggSumm(agg, data,rollupFunction);
    summDF = flatten(summDF,agg);

    console.log('flatten(summDF)');
    console.log(summDF)

    if (derivedFunction) { 
      summDF.map(row=> { 
        derivedFunction.forEach(dCol => {
          row[dCol.c] = dCol.f(row)
        })
        return row
      })
    }
    return summDF
};