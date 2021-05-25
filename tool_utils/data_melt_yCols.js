// For the output of Data Aggregation where yCols are stacked, unstack them for Line Chart Visualisation


// -------------------------------------------------------
//  function "melt_yCols"
function melt_yCols(summ_df=[], yCols=[], xCol=''){

    melt_out = [];
    yCols.forEach(function(yCol){
        summ_df.forEach(function(row){
        melt_out = melt_out.concat({yCol:yCol,xCol:row[xCol],value:row[yCol]})
        }) // end forEach for summ_df
    }) // end forEach yCols

    return melt_out
} // End function 'melt_df'

