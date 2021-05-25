// -------------------------------------------------------
//  function 'profileChart'
function profileChart(profile_input ,xCol="",yCol=varProfile()) {
  
  console.log('xCol')
  console.log(xCol)
  xColAttr = attrCols.filter(r=> r.column === xCol)[0];

  yTypes ={
    '_n':{'barCol':'composition' ,'upliftFmt':d3.format("+0.1%"),'upliftCol':'uplift', 'format':d3.format("0.0%") ,'yTitle':"Composition %"},
    '_a':{'barCol':'response' ,'upliftFmt':d3.format("+.2s"),'upliftCol':'uplift', 'format':d3.format("+.2s") ,'yTitle':"Average $"},
    '_r':{'barCol':'response','upliftFmt':d3.format("+0.1%"),'upliftCol':'uplift', 'format':d3.format("0.1%") ,'yTitle':"Percent %"},
    '_d':{'barCol':'response','upliftFmt':d3.format("+0.1%"),'upliftCol':'growth', 'format':d3.format(".2s"),'yTitle':"Change #"},
    '_p':{'barCol':'response','upliftFmt':d3.format("+0.1%"),'upliftCol':'response', 'format':d3.format("0.1%"),'yTitle':"Change %"},
  }
  yType = yTypes[yCol['n'].slice(-2)]

  // Data preparation
  aggCols = [... new Set([xCol])];
  profile_summ = profileCalc(profile_input,yCol,aggCols,yType);  

  // #####################################################
  // Generate CSV
  downloadData(profile_summ, xCol, 'profile');
  
  // Change map dimensions is large amount of xCols
  valueDict = uniqueValues([xCol]);
  flatArr = allCombos(valueDict);
  sumStrLen = d3.sum(flatArr.map(r=>String(r[0]).length),d=>d)
  maxStrLen = d3.max(flatArr.map(r=>String(r[0]).length),d=>d)
  xColBuffer = flatArr.length > 7 || maxStrLen > 13 || sumStrLen > 30; 
  console.log('xColBuffer')
  console.log(xColBuffer)
  xCol_buffer = xColBuffer  === true ? maxStrLen * 5 : 20

  //##########################################
  // Chart preparation
  var margin = {top: 100, right: 20, bottom: 20 + xCol_buffer, left: 90};
  var width = 500 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;


  var xScale = d3.scaleBand().padding([.1]).rangeRound([0,width]);

  //Pull Descriptor of 'xCol' and 'yCols'
  xColDF = attrCols.filter(r => r.column  === xCol )[0];

  var cCol = 'profile'; // 
  let calcValues = ['n','d'];
  yCol_lookup = {'n':attrCols.filter(r => r.column  === yCol.n )[0],'d':attrCols.filter(r => r.column  === yCol.d )[0]}


  // var colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(calcValues);

  // Load axis's
  // this for top states 
  if (valueDict[0].value.length >= 10 && xColAttr.order === undefined  ) { 
    console.log('filter calc');
    console.log(profile_summ.filter(d=> d[cCol] ==='n').map(d=> d['xCol_v']) )
    xValueDF =  profile_summ.filter(d=> d[cCol] ==='n')
    xValueDF = xValueDF.sort((a,b)=> b[yType.upliftCol] - a[yType.upliftCol] )
    xScale.domain( xValueDF.map(d=> d['xCol_v']) );
  } else {
    xScale.domain( valueDict[0].value );
  }
  
  yMin = d3.min(profile_summ.map(d => d[yType.barCol]));
  yMax = d3.max(profile_summ.map(d => d[yType.barCol]));
  yMinDefault = yMin > 0 ? 0: yMin;
  yMaxDefault = yMax < 0 ? 0: yMax;  

  var yScale = d3.scaleLinear()
    .domain([ yMinDefault ,yMaxDefault])
    .range([height, 0  ])
    .nice();

  var colorBand = d3.scaleBand()
    .domain(calcValues )
    .rangeRound([0, xScale.bandwidth() ]);


  // CHART processing
  svg_chart = d3.selectAll(`#profile_${xCol}`)
    .select(`.chart_profile_${xCol}`)
    .attr("height", height );

  svg_chart.select(".yAxis_name")
    .text(yType.yTitle)
    .style("font-weight", "bold")
    .style("font-size", "20px");

  svg_chart.select(".plot_title")
    .text(xColDF.name)
    .style("font-size", "26px")

  // X-axis
  svg_chart
    .selectAll(".x_axis")
    .transition()
    .duration(300)
    .call(d3.axisBottom(xScale)) 
    .selectAll("text")
    .style("font-weight", "bold")
    .style("font-size", "16px")
    .style("font-color", "rgba(13, 47, 244)")
    // .attr("text-anchor", "start")
    .attr("transform", `translate(-10,${xColBuffer===true ? (xCol_buffer/2)  :0 }) rotate(${xColBuffer ===true ? -45 :0 })`)

  // yaxis
  svg_chart
    .selectAll(".y_axis")
    .transition()
    .duration(300)
    .call(d3.axisLeft(yScale).tickFormat( yType.format))
    .style("font-weight", "bold")
    .style("font-size", "16px")
    .style("font-color", "rgba(13, 47, 244)")


  //$##############################
  // 1.DRAW uplifts on BARS 
  
  svg_chart
    .selectAll(".bars")
    .data(profile_summ)
    .join("rect")
      .attr("class", "bars")
      .attr("width", colorBand.bandwidth() )
      .attr("x", d => xScale(d['xCol_v']) + colorBand(d[cCol]) )
      .attr("y", d => d[yType.barCol] > 0 ? yScale(d[yType.barCol]) :yScale(0) )
      .attr("height", d => yScale(0 ) - yScale( d[yType.barCol] * (d[yType.barCol] > 0 ? 1 : -1 ) ))
      .style("fill", d=> d[cCol] === 'n'? (d[yType.barCol] >= 0 ? "rgba(13, 47, 244)" :"rgba(255,0,0)" ): "rgba(167, 167, 167)")
      .attr("fill-opacity",d=> d[cCol] === 'n'?1: 1)

    
  //$##############################
  // DRAW 0 Line
  svg_chart
    .select(`#profile_${xCol}_line0`)
    .remove().exit();
  
  svg_chart
    .append("svg:line")
    .attr("id",`profile_${xCol}_line0`)
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", yScale(0))
    .attr("y2", yScale(0))
    .style("stroke", "rgb(189, 189, 189)");


  //$##############################
  // 2. Draw LIFTS 
  var lifts = svg_chart
    .selectAll(".lifts")
    .data(profile_summ);

  lifts.exit().remove();

  var lift_entry = lifts.enter()
    .append("text")
    .attr("class","lifts")

  lifts = lift_entry.merge(lifts) 
    .attr("x", d => xScale(d['xCol_v']) + colorBand(d[cCol])   )
    .attr("y", d => d[yType.barCol] > 0 ? yScale(d[yType.barCol] ) -15 : yScale(0) -15 )
    .attr("dy",12)
    .attr("font-weight",xScale.domain().length > 7 ? 100 :500)
    .text( d => {
      if (d.profile === 'n'){
        return yType.upliftFmt(d[yType.upliftCol]);
      } else {
        return "";
      }
    })
    .style("font-weight", "bold")
    .style("font-size",xScale.domain().length > 7 ? "16px" :"20px" )
    .style("fill", d=>  d[yType.upliftCol] < 0 ? 'red' : 'green');

  // ######################################
  // draw Legend
  legendG = svg_chart.select("g.legend")
    // .attr("style","border:1px solid black");

  // UPDATE RECT
  var legend_rect = legendG
    .selectAll("rect")
    .data(calcValues, function(d) {return d });

  console.log('calcValues')
  console.log(calcValues)

  legend_rect
    .attr("id","old");

  legend_rect.enter()
    .append("rect")
    .attr("class","legend_rect")
    .attr("id","new")
    .attr("x", function(d,i) { 
      if (i === 0 ) {
        return 0
      } else {
        return 0 + 1*(yCol_lookup['n'].name.trim().length*12)
      }
    })
    .attr("y", 60)
    .attr("width", 16)
    .attr("height", 16)
  .merge(legend_rect)
    .style("fill", d=> d === 'n'? "rgba(13, 47, 244)": "rgba(167, 167, 167)")
    .attr("fill-opacity",d=> d === 'n'?1: 1);

    legend_rect.exit().remove() ;

  // UPDATE TEXT
  var legend_txt = legendG
    .selectAll("text")
    .data(calcValues, function(d) { return d });

  legend_txt
    .attr("id","old");

  legend_txt.enter()
    .append("text")
    .attr("class","legend_text")
    .attr("id","new")
    .attr("x", function(d,i) { 
      if (i === 0 ) {
        return 20
      } else {
        return 20 + 1*(yCol_lookup['n'].name.trim().length*12) 
      }
    })
    .attr("y", 60  + 14)
  .merge(legend_txt)
    .text(function(d) {  return yCol_lookup[d].name.trim()})
      .style("font-weight", "bold")
    .style("font-size", "18px");


  legend_txt.exit().remove() ;

  // return the profile_df
  return profile_summ

} // profileChart