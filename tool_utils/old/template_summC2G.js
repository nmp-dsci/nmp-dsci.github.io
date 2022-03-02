ready(() => {
  // map setup
    var map_p = {width_b:530,height_b:600,legend_w:530,legend_h:30,legendbar_h:15};      

    d3.select("#legend")
        .append("svg")
        .attr("width", map_p.legend_w)
        .attr("height",map_p.legend_h)
        .attr("id","svg");

    // INITIALISE Dashboard
    d3.select("#map")
        .append("svg")
        .attr("width", map_p.width_b)
        .attr("height", map_p.height_b) 
        .attr("class","geom");

    //#################################
    // 
    function summC2GRun(callback, new_div=false){

      target_df = filterData(data_df,'n');
      console.log('target_df target: '+target_df.filter(d=>d.profile==='n').length)
      
      // LINE CHART setup
      if (new_div) { 
        initChart(attr_col = "column",value_col = 'year_fy',new_div=true);
      }

      drawLine_multiC(target_df);
      drawMaps(map_json,target_df);
      drawRank(target_df);

      callback.call(this);
    }

    // ##########################################
    //  Run Listener
    document.querySelector("#run_profile").addEventListener("click", e => {
      e.preventDefault();
      // spinner
      spinner = document.querySelector('#spinner');
      spinner.style.display ='block'; 
      () => {
          profileRun(function() {
              spinner.style.display ='none'; 
          }); // end "profileRun"
        }; 
    }); // END 'if' statement

    // Run visualisation
    summC2GRun(function() {}, new_div=true)


    });
