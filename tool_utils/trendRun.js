
function trendRun(trendID ,callback=()=>{}, new_div=false){

  tagID = `trend${trendID}`;

  document.querySelector(`.alerttrend${trendID}`).style.display = 'none';

  // Get variable
  xCol1 = document.querySelector(`#trend${trendID} #target #trendid`).value;

  // general chart margins
  var chartDim = {svgHeight:450,svgWidth:trendWidth, top: 100, right: 20, bottom: 40, left: 90};
  chartDim['width'] = chartDim.svgWidth - chartDim.left - chartDim.right,
  chartDim['height'] = chartDim.svgHeight - chartDim.top - chartDim.bottom;

  trendAll = []
  trendCols = attrCols.filter(d => ['x','x2'].includes(d.class) & d.trend_y ).map(d => d.column)

  // Set Context Dictionary 
  yCol=varProfile(tagID);
  chartContext[tagID] = {
    'tagID':tagID,
    'level':'n',
    'aggCols': aggCols,
    'xCol1':xCol1 , 
    'yCol':varProfile(tagID),
  }

  chartContext[tagID]['xCol1DF'] = attrCols.filter(d=> d.column===chartContext[tagID]['xCol1'])[0] ;
  chartContext[tagID]['xCol1DF'] = dataColOrder(xCol1, chartContext[tagID]['xCol1DF']) ;
  chartContext[tagID]['yColDF'] = {'n':attrCols.filter(d => d.column === chartContext[tagID]['yCol']['n'] )[0] };

  for (cCol of trendCols){

    // ##########################
    // Set Context Dictionary 
    chartContext[`${tagID}_${cCol}`] = {'cCol':cCol,'aggC':[xCol1,cCol]};
    chartContext[`${tagID}_${cCol}`]['cColDF'] = attrCols.filter(d=> d.column===chartContext[`${tagID}_${cCol}`]['cCol'])[0] ;
    chartContext[`${tagID}_${cCol}`]['cColDF'] = dataColOrder(cCol, chartContext[`${tagID}_${cCol}`]['cColDF']) ;
    chartContext[`${tagID}_${cCol}`]['cColUniq'] = uniqueValues([cCol]); 

    if (new_div) { 
      initChart(chartContext,tagID, cCol ,chartDim);
    }
    
    // ############################################
    // Generate Data 

    dataCutID(chartContext,tagID, cCol)
    query_df = dataFetch(data_df,chartContext,tagID, cCol)

    input_df = [];
    input_df = dataSumm(query_df,chartContext,tagID, cCol) 
    chartContext[`${tagID}_${cCol}`]['chartData'] = input_df


    // references for 'chartData'
    cColRef = '';
    aggCols.map(aggCol => {if (chartContext[`${tagID}_${cCol}`]['chartData'][0][aggCol] === cCol) cColRef = aggCol})
    chartContext[`${tagID}_${cCol}`]['cColRef'] = cColRef
    chartContext[`${tagID}_${cCol}`]['cColRef_v'] = chartContext[`${tagID}_${cCol}`]['cColRef'].replace('_c','_v')

    xCol1Ref = '';
    aggCols.map(aggCol => {if (chartContext[`${tagID}_${cCol}`]['chartData'][0][aggCol] === xCol1) xCol1Ref = aggCol})
    chartContext[`${tagID}_${cCol}`]['xCol1Ref'] = xCol1Ref
    chartContext[`${tagID}_${cCol}`]['xCol1Ref_v'] = chartContext[`${tagID}_${cCol}`]['xCol1Ref'].replace('_c','_v')

    // ############################################
    // LEGEND GENERATION 
    drawChartLegend_extract(chartContext,tagID, cCol)
    drawChartLegend_transform(chartContext,tagID,cCol,chartDim['width'])
    drawChartLegend_load(chartContext,tagID,cCol)

    // other params
    // drawFilter(chartContext);
    // downloadData(input_df, chartContext);
    // downloadSVG( chartContext);

    plotType = document.querySelector(`#trend${trendID} #target #plottype`).value;

    if (plotType === 'line') { 
      trendDF = drawLine_multiC(chartContext,tagID,cCol,chartDim);
    } else if (plotType === 'heatmap'){
      trendDF = draw_heatmap(chartContext,tagID,cCol,chartDim);
    } else if (plotType === 'stackedbar'){
      trendDF = draw_stackedbar(chartContext,tagID,cCol,chartDim);
    }

    chartContext[`${tagID}_${cCol}`]['chartData'].map(r=> r['trendID'] = trendID)
    trendAll = trendAll.concat(chartContext[`${tagID}_${cCol}`]['chartData']);
  // })
  }

  // trendSummary(trendAll); // doesn't exist yet
  drawTopline(trendAll,tagID);

  callback.call(this);
}

ready(() => {

  let trendCols = 2 ; //document.querySelector('#trend_template').childElementCount; 

  for (let trendID = 1; trendID < (trendCols+1); trendID++ ){ 
    (function(){
      console.log(`trendID init=${trendID ?? 99}`)

      initAppHTML(appName = 'trend', appID = trendID , templateHTML=templateHTMLTrend);
      initTrendFilters(trendID);
      trendRun(trendID, ()=>{},new_div=true);

      document.querySelector(`#run_trend${trendID}`).addEventListener("click", e => {
        e.preventDefault();
        $(`#spinner_trend${trendID}`).fadeIn(() => {
          trendRun(trendID,()=>$(`#spinner_trend${trendID}`).fadeOut())
        },new_div=false)
      });

    }());
  }// end for loop
});

