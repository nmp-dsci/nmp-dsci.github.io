function profileRun(callback,new_div=false,sa4_map=true){

    // Get Metric
    target_df = filterData(data_df,'n','profile');
    console.log('target_df target: '+target_df.filter(d=>d.profile==='n').length)
    
    base_df = filterData(data_df, 'd','profile');
    console.log('base_df base: '+base_df.filter(d=>d.profile==='d').length)

    // Data preparation
    profile_df = target_df.concat(base_df)

    profile_all = []
    profileCols = attrCols.filter(d => d.class === "x").map(d => d.column)
    profileCols.forEach(function(p){

      console.log('###########################')
      console.log(`Profile xCol: ${p}`)

      if (new_div) { 
        initChart(attr_col = "column",value_col = p,new_div=true, tag = 'profile');
      }

      pDF = profileChart(profile_df,xCol=p);
      profile_all = profile_all.concat(pDF);
    });
    profileSummary(profile_all);

    // Initialise features
    if (sa4_map === true){
      drawMaps(map_json,target_df,geoField=geoField);
    }
    
    drawTopline(target_df,base_df,'profile');

    callback.call(this);
  }