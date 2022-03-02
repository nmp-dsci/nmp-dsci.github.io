
function drawChartLegend_extract(chartContext,tagID, cCol){
    
    // 2. cap data when its too long
    if (chartContext[`${tagID}_${cCol}`]['cColUniq'][0].value.length >= 12 ){ 
      // console.log("drawLine_multiC: Too many values"); 
      // input_df = input_df.sort((a , b) => d3.ascending(a[chartContext.yCol[chartContext.level]], b[chartContext.yCol[chartContext.level]])); 
      // cColUniq[0].value = top_values.slice(0,12).map(m=> m[xCol2Ref.replace('_c','_v')])
      // chartContext['cColUniq'][0].value = input_df.map(m=> m[chartContext['cColRef_v']])
    }

    // 3a. always sort it 
    chartContext[`${tagID}_${cCol}`]['cColUniq'][0].value  = chartContext[`${tagID}_${cCol}`]['cColUniq'][0].value.sort((a , b) => d3.ascending(a, b)) 

    // 3. generate value mapping
    cColValues = [];
    cMap = [...d3.schemeCategory10 , ...d3.schemeTableau10,...d3.schemeCategory10 , ...d3.schemeTableau10 ] ;
    chartContext[`${tagID}_${cCol}`]['cColUniq'][0].value.map(function(key,idx){
        cColValues.push({
        column:chartContext[`${tagID}_${cCol}`].cCol
        ,value:key
        , value_len:String(key).length
        ,c:cMap[idx]
        ,"o":0.7,"w":6
        })
    });

    chartContext[`${tagID}_${cCol}`]['legendValues'] = cColValues;

    // return cColValues
}
