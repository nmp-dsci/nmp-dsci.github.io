//################################################################
// DATA Selection function
function filterData(acq_map_df,filter_n='n',tag=''){
    var defaultX = "All";
    // Generate Data to visualise
    selectDF = JSON.parse(JSON.stringify(acq_map_df));
    selectDF.forEach(r => Object.assign(r, {'filter_df': 0}))
    selectDF.forEach(r => Object.assign(r, {'profile': filter_n}))

    // when either target/base filters applied 
    dropdown = document.querySelectorAll ("input."+tag+"_dropdown:checked");

    filter_obj = []
    dropdown.forEach(function(e){
        console.log('checked')
        filter_str = e.id.split('__')
        if (filter_str[0]  === filter_n ){
            filter_obj.push({'filter_n':filter_str[0],'xCol':filter_str[1],'xCol_v':filter_str[2]})
        }
    });

    if (filter_obj.length > 0 ){

        var filter_obj_summ = d3.group(filter_obj,d => d['xCol'])
        console.log('filter_obj_summ')
        console.log(filter_obj_summ)
    
        console.log('APPLY: filters')
        filter_obj_summ.forEach(function(filter) { 
            xCol = filter[0].xCol;
            xColArray = filter.map(f => f.xCol_v)
            selectDF.forEach(r => Object.assign(r, {'filter_df': r['filter_df']  + (xColArray.includes(String(r[xCol]))  ? 1 : 0 )  }))
        }); 
        selectDF.forEach(r => Object.assign(r, {'filter_df': r['filter_df'] === filter_obj_summ.size  ? 1 : 0 }))
    } else { 
        console.log("APPLY: nothing")
        selectDF.forEach(r => Object.assign(r, {'filter_df': 1}))
    }

    console.log('Filter "'+filter_n+'" Keep Row Rate %: ' + d3.mean(selectDF, d => d['filter_df'])*100)
    selectDF = selectDF.filter(d => d['filter_df']  > 0 )
    
    return selectDF
}