ready(() => {
    //  Run Listener
    document.querySelector("#run_trend").addEventListener("click", e => {
        // 
        e.preventDefault();
        $('#spinner_trend').fadeIn(function() {
            trendRun(function() {
            $('#spinner_trend').fadeOut();
            },new_div=false,sa4_map=false)
        });
    }); // END '#run_profile'

    // Run visualisation
    trendRun(function() {}, new_div=true,sa4_map=false)
});

function trendRun(callback,new_div=false,sa4_map=true){
  target_df = filterData(data_df,'n','trend');
  console.log('target_df target: '+target_df.filter(d=>d.profile==='n').length)
  
  // Get time variable
  
  dt_col = $("#trend_template #target #trendid").val();


  profile_all = []
  profileCols = attrCols.filter(d => d.class === "x" & d.trend_y ).map(d => d.column)
  profileCols.forEach(function(p){

    console.log('###########################')
    console.log(`Trend cCol: ${p}`)

    if (new_div) { 
      initChart(attr_col = "column",value_col = p,new_div=true,tag='trend');
    }
    pDF = drawLine_multiC(target_df,xCol=dt_col,cCol=p);
    // profile_all = profile_all.concat(pDF);
  });
  // profileSummary(profile_all);

  // Initialise features
  if (sa4_map === true){
    drawMaps(map_json,target_df);
  }
  
  drawTopline(target_df,data_df,'trend');

  callback.call(this);
}