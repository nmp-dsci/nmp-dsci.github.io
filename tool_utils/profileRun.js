function profileRun(chartContext,tagID='profile1',callback=()=>{},new_div=false){

    document.querySelector(`#${tagID} .alertprofile`).style.display = 'none';

    // ############################################
    // from profile chart
    // metric
    metricObj = document.querySelector(`#profile_template #params #metric`).value; 

    yTypes ={
      // Value
      '_c_v':{'lvl':['n','d'],'desc':'composition metric' ,'upliftFmt':d3.format("+0.1%"),'format':d3.format("0.0%") ,'yTitle':"Composition %"},
      '_c_g':{'lvl':['n','d'],'desc':'Contribution to growth' ,'upliftFmt':d3.format("+0.1%"),'format':d3.format("0.0%") ,'yTitle':"Growth Contribution"},
      '_n_v':{'lvl':['n','d'],'desc':'volume metric' ,'yTitle':"Volume #"},
      '_n_d':{'lvl':['n','d'],'desc':'volume dif metric','upliftFmt':d3.format("+.2s"),'format':d3.format("+.2s") ,'yTitle':"Volume Diff"},
      '_n_g':{'lvl':['n','d'],'desc':'volume growth metric','upliftFmt':d3.format("+0.1%"),'format':d3.format("0.0%") ,'yTitle':"Volume Growth"},

      '_r_v':{'lvl':['n','d'],'desc':'rate metric' ,'yTitle':"Rate #"},
      '_r_d':{'lvl':['n','d'],'desc':'rate dif metric','upliftFmt':d3.format("+.2s"),'format':d3.format("+.2s") ,'yTitle':"Rate Diff"},
      '_r_g':{'lvl':['n','d'],'desc':'rate growth metric','upliftFmt':d3.format("+0.1%"),'format':d3.format("0.0%") ,'yTitle':"Rate Growth"},

      '_a_v':{'lvl':['n','d'],'desc':'average metric' ,'yTitle':"Volume #"},
      '_a_d':{'lvl':['n','d'],'desc':'average dif metric','upliftFmt':d3.format("+.2s"),'format':d3.format("+.2s") ,'yTitle':"Value Diff"},
      '_a_g':{'lvl':['n','d'],'desc':'average growth metric','upliftFmt':d3.format("+0.1%"),'format':d3.format("0.0%") ,'yTitle':"Value Growth"},
    }

    // general chart margins
    var chartDim = {svgHeight:450,svgWidth:profileWidth, top: 100, right: 20, bottom: 40, left: 90};
    chartDim['width'] = chartDim.svgWidth - chartDim.left - chartDim.right,
    chartDim['height'] = chartDim.svgHeight - chartDim.top - chartDim.bottom;

    //  What columns available for profiling
    profileAll = []
    profileCols = attrCols.filter(d => ['x','x2'].includes(d.class)  && d.profile_y).map(d => d.column)

    // initalise chart context 
    chartContext[tagID] = {
      'tagID':tagID,
      'aggCols': aggCols,
      'yCol':varProfile(tagID),
      'yColDropdown':varProfile(tagID=tagID),
      'yType': yTypes[metricObj],
      'profileCol' : 'profile',
      'profileValues' : ['n','d'],
    }

    chartContext[tagID]['yColDF'] = {
      'n':attrCols.filter(d => d.column === chartContext[tagID]['yCol']['n'] )[0] ,
      'd':attrCols.filter(d => d.column === chartContext[tagID]['yCol']['d'] )[0] 
    }      

    chartContext[tagID]['yCol_lookup'] = {
      'n':attrCols.filter(d => d.column === chartContext[tagID]['yColDropdown']['n'] )[0] ,
      'd':attrCols.filter(d => d.column === chartContext[tagID]['yColDropdown']['d'] )[0] 
    }      

    if ( ["_n_v","_r_v","_a_v","_n_d","_r_d","_a_d"].includes(metricObj) ){
      chartContext[tagID]['yType']['upliftFmt'] = d3.format("+"+chartContext[tagID]['yCol_lookup']['n']['format']);
      chartContext[tagID]['yType']['format'] = d3.format(chartContext[tagID]['yCol_lookup']['n']['format']);
    }  
    
    for (cCol of profileCols){


    }

    for (cCol of profileCols){

      // ##########################
      // Set Context Dictionary 
      chartContext[`${tagID}_${cCol}`] = {'cCol':cCol,'aggC':[cCol]}
      chartContext[`${tagID}_${cCol}`]['cColDF'] = attrCols.filter(d=> d.column===cCol)[0] ;
      chartContext[`${tagID}_${cCol}`]['cColDF'] = dataColOrder(cCol, chartContext[`${[tagID]}_${cCol}`]['cColDF']) ;
      chartContext[`${tagID}_${cCol}`]['cColUniq'] = uniqueValues([cCol]); 
      chartContext[`${tagID}_${cCol}`]['cColUniqList'] = allCombos(chartContext[`${[tagID]}_${cCol}`]['cColUniq']); 

      if (new_div) { 
        initChart(chartContext,tagID, cCol ,chartDim);
      }

      //#######################################################
      // Generate data
      profile_df = [];
      filter_df = [];
      chartContext[tagID]['profileValues'].map( function (calc_lvl){

        chartContext[tagID]['level'] = calc_lvl;

        dataCutID(chartContext,tagID, cCol)
        query_df = dataFetch(data_df,chartContext,tagID, cCol)

        input_df = [];
        input_df = dataSumm(query_df,chartContext,tagID, cCol)

        profile_df = profile_df.concat(input_df)
        filter_df = filter_df.concat(chartContext[`${[tagID]}_${cCol}`].filters_n)
      }); // end generate data

      chartContext[`${tagID}_${cCol}`]['chartData'] = profile_df
      chartContext[`${tagID}_${cCol}`].filters_n = filter_df;

      // references for 'input_df'
      cColRef = '';
      aggCols.map(aggCol => {if (chartContext[`${tagID}_${cCol}`]['chartData'][0][aggCol] === chartContext[`${[tagID]}_${cCol}`].cCol) cColRef = aggCol})
      chartContext[`${tagID}_${cCol}`]['cColRef'] = cColRef
      chartContext[`${tagID}_${cCol}`]['cColRef_v'] = chartContext[`${[tagID]}_${cCol}`]['cColRef'].replace('_c','_v')

      // Profile Calculation
      profileCalc(chartContext,tagID, cCol)
      profileAll = profileAll.concat(chartContext[`${tagID}_${cCol}`]['chartData']);

      // ############################################
      // LEGEND GENERATION 
      
      legendColValues = [];
      cMap = d3.schemeCategory10;
      chartContext[tagID]['profileValues'].map(function(key,idx){
        legendColValues.push({
          column:cCol
          ,value:key
          ,text:chartContext[tagID]['yCol_lookup'][key].name.trim()
          , value_len:String(chartContext[tagID]['yCol_lookup'][key].name.trim()).length
          ,c: key === 'n'? "rgba(13, 47, 244)": "rgba(167, 167, 167)"
          ,"o":0.7,"w":6
        })
      });

      chartContext[`${tagID}_${cCol}`]['legendValues'] = legendColValues;

      drawChartLegend_transform(chartContext,tagID,cCol,profileWidth)
      drawChartLegend_load(chartContext,tagID,cCol)

      // user interfrace features
      drawFilter(chartContext,tagID, cCol)
      // downloadData(chartContext[`${tagID}_${cCol}`]['chartData'], chartContext);
      // downloadSVG( chartContext);


      // Visualise data
      profileChart(chartContext,tagID,cCol,widthRaw=profileWidth);

    };

    chartContext[tagID]['profileAll'] = profileAll

    profileSummary(chartContext,tagID);

    // Initialise features
    // if (Object.keys(primaryCols).includes('postcode','loc_sa4')){

    //   drawMaps(map_json,data_df,primaryCols['postcode']);
    // }

    drawTopline(profileAll,tagID);

    callback.call(this);

    return chartContext
}


ready(() => {

  initAppHTML(appName = 'profile', appID = '1' , templateHTML=templateHTMLProfile);
  initProfileFilters(tagID = 'profile1')
  profileMetrics('profile1');

  // --------------------------------------------------------------------------------
  // map setup

  if ('geo_field' in (primaryCols ?? []) ) {

      console.log(`Mapping Activated, Geofield: ${primaryCols['geo_field']}`)
      
      mapParent = document.querySelector(`#${'profile1'} #column1`); 
      mapObj = document.createElement('div');
      mapObj.class = "row"; 
      mapObj.id = "map"
      mapRow = mapParent.appendChild(mapObj);

      // mapRow = document.querySelector("#column1 #map"); 

      h3a = document.createElement("h3"); 
      h3b = document.createElement("h3"); 
      div1 = document.createElement("div");
      div2 = document.createElement("div");
      div3 = document.createElement("div");

      // append structure
      h3a.innerHTML = "Target SA4 Penetration";
      mapRow.appendChild(h3a);
      div1.id = "legend";
      mapRow.appendChild(div1);
      h3b.innerHTML = "Selection Map";
      mapRow.appendChild(h3b);
      div2.id = "map";
      mapRow.appendChild(div2);
      div3.id = "controls";
      mapRow.appendChild(div3);
  

  // ##########################################
  // Set structure

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

  } // end additional treatment for map

  // ##########################################
  //  Run Listener: Run Profile
  document.querySelector(`#run_${'profile1'}`).addEventListener("click", e => {
      // 
      e.preventDefault();
      $(`#spinner_${'profile1'}`).fadeIn(function() {
        chartContext = profileRun(chartContext,'profile1',() => $(`#spinner_${'profile1'}`).fadeOut(),new_div=false)
      });
  }); // END '#run_profile'

  // ##########################################
  //  Run Listener: Profile Response 
  metricTag = `#${'profile1'} #target #profile`;
  document.querySelector(metricTag).addEventListener("change", e => {
      e.preventDefault();
      profileMetrics('profile1');
  }); 

  // Initialise visualisation
  chartContext = profileRun(chartContext,'profile1',() => {}, new_div=true);

});
