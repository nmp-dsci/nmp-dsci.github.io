// DATA Selection function
function filterDataAttribute(acq_map_df,filter_n='n'){
    var defaultX = "All";
    // Generate Data to visualise
    selectDF = JSON.parse(JSON.stringify(acq_map_df));
    selectDF.map(r => Object.assign(r, {'filter_df': 0}))
    selectDF.map(r => Object.assign(r, {'profile_filter': 1}))
    // 
    selectX = attrCols.map(function(d){
        if (d.class == "x" ) {
        aaa=  {
            name: d.name,
            column: d.column,
            value: $("#attribute #"+d.column).val()
        }
        // Apply filter if not all
        if (aaa.value != aaa.name+"_"+defaultX+" "+aaa.name){
            filterX = aaa.value.replace(aaa.name+"_","")
            selectDF.map(r => Object.assign(r,{"profile_filter": r.profile_filter * (r[d.column] === filterX ? 1 : 0)}))
            // data.filter(d => !isNaN(+d[value])).map(d => +d[value] ); 
        }
        } // end IF through d.class
        selectDF.map(r => Object.assign(r, {"filter_df":(r.profile_filter === 1? 1:0)}))
    });// end loop through Attributes
    console.log('Filter "'+filter_n+'" Keep Row Rate %: ' + d3.mean(selectDF, d => d['filter_df']))
    selectDF = selectDF.filter(d => d['filter_df']  > 0 )

    return selectDF
}
