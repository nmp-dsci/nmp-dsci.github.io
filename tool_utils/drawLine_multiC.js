function drawLine_multiC(data,xCol="month_n", cCol = 'year_fy') {

    // general chart margins
    var margin = {top: 100, right: 20, bottom: 40, left: 90};
    var width = 500 - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom;

    // Load in Column lookups 

    yVar = $("#template_trend #target #profile").val()
    yColDF = attrCols.filter(d => d.column === yVar )[0];
    xColDF = attrCols.filter(d=> d.column===xCol)[0] ;
    cColDF = attrCols.filter(d=> d.column===cCol)[0] ;

    // XColDF order when it doesnt exist
    xOrder = xColDF.order || 'missing'
    if (xOrder === "missing"){
      console.log('XCOF MISSING')
      xOrder = uniqueValues([xCol]);
      xOrder = xOrder[0].value.slice().sort((a, b) => d3.ascending(a, b));
      xColDF['order'] = xOrder
    }

      // Change map dimensions is large amount of xCols
  valueDict = uniqueValues([xCol]);
  flatArr = allCombos(valueDict);
  sumStrLen = d3.sum(flatArr.map(r=>String(r[0]).length),d=>d)
  maxStrLen = d3.max(flatArr.map(r=>String(r[0]).length),d=>d)
  xColBuffer = flatArr.length > 7 || maxStrLen > 13 || sumStrLen > 30; 
  console.log('xColBuffer')
  console.log(xColBuffer)
  xCol_buffer = xColBuffer  === true ? maxStrLen * 5 : 20

    // ############################################
    // LEGEND GENERATION 
    // 1. Colour map (controls legend)
    valueDict = uniqueValues([cCol]);
    cColValues = [];
    cMap = d3.schemeCategory10;
    valueDict[0].value.forEach(function(key,idx){
      cColValues.push({
        column:cCol
        ,value:key , value_len:String(key).length
        ,c:cMap[idx]
        ,"o":0.7,"w":6
      })
    });

    // 2. X treatment (move across)
    cCol_cumsum = d3.cumsum(cColValues.map(r=>r.value_len))
    box_cumsum = d3.cumsum(cColValues.map(r=>1))
    cColValues.forEach((r,i) => Object.assign(r,{'value_cumsum': i===0?0:cCol_cumsum[i-1],'box_cumsum':i===0?0:box_cumsum[i-1]}))
    cColValues.forEach((r,i) => Object.assign(r,{'legX_box':r.box_cumsum*20 + r.value_cumsum *16 }))
    cColValues.forEach((r,i) => Object.assign(r,{'legX_text':r.legX_box + 20 }))
    // 3. Y treatment (move down) 
    newLine_Threshold = 300
    cColValues.forEach((r,i) => Object.assign(r,{'line':Math.floor(r.legX_box / newLine_Threshold ) + 1 }))
    cColValues.forEach((r,i) => Object.assign(r,{'legY_box':  20 + (r.line+0) * 20  }))
    cColValues.forEach((r,i) => Object.assign(r,{'legY_text': 20 + (r.line+0) * 20 + 14  }))
    //  4. Legend Line re indexing for multi line
    lineUniq = [... new Set(cColValues.map(r=>r.line))];
    lineDF = {};
    lineUniq.forEach(lineID => { 
      if (lineID !==  1) {
        LineEntry = cColValues.filter(r=> r.line === (lineID));  // take first to what you want to pull back
        lineDF[lineID] = {'line':lineID,'legX_box':LineEntry[0].legX_box,'legX_text':LineEntry[0].legX_text }
      }
    });
    cColValues.forEach(row => { 
      if (row.line !== 1 ){
        Object.assign(row, {'legX_box': row.legX_box - lineDF[row.line].legX_box, 'legX_text': row.legX_text - lineDF[row.line].legX_box })
      }
    })

    // ###############################################################
    // Generate DAta
    input_df = summFunc(data,[cCol,xCol]);
    downloadData(input_df, cCol,'trend');

    var xScale = d3.scaleBand()
      .rangeRound([0,width])
      .padding(0.1)
      .domain(xColDF['order']);

    var yScale = d3.scaleLinear()
      .domain(d3.extent(input_df.map(d => d[yVar])))
      .range([height,0]);

    // ###########################################
    // CHART processing
    svg_chart = d3.select(`#trend_${cCol}`)
        .select(`.chart_trend_${cCol}`)

      svg_chart.select(".yAxis_name")
        .text(yColDF.name)
        .style("font-weight", "bold")
        .style("font-size", "20px");

      svg_chart.select(".plot_title")
        .text(`'${cColDF.name}' by '${xColDF.name}'` )
        .style("font-size", "26px")

      // X-axis
      svg_chart
        .selectAll(".x_axis")
        .transition()
        .duration(300)
        .call(d3.axisBottom(xScale)) 
        .selectAll("text")
        // .style("font-weight", "bold")
        .style("font-size", "17px")
        .attr("transform", `translate(-10,${xColBuffer===true ? (xCol_buffer/2)  :0 }) rotate(${xColBuffer ===true ? -45 :0 })`)

    // yaxis
    svg_chart
        .selectAll(".y_axis")
        .transition()
        .duration(300)
        .call(d3.axisLeft(yScale).tickFormat(yColDF.format))
        .selectAll("text")
        // .style("font-weight", "bold")
        .style("font-size", "17px");

    // ###################################################
    //  DRAW LINE

    var cCol_paths = d3.group(input_df, d => d[cCol]);

    var path = d3.line()
      .x(function(d) { return xScale(d[xCol]) + 20 ; })
      .y(function(d) { return yScale(d[yVar]); });

    //  Update , Exist , Enter
    svg_chart
      .selectAll("path.segment")
      .data(cCol_paths)
      .join('path')
        .attr("class","segment")
        .attr("stroke", "black")
        .attr("fill", "none")
        .attr("d",function(d) { 
          return path(d[1]); 
        })
    //   .attr("class", d => colDF.filter(r=>r.column===d.key)[0].stroke)
      .attr("stroke-width", d => cColValues.filter(r=> r.value === d[0] )[0].w)
      .attr("stroke-opacity", d => cColValues.filter(r=> r.value === d[0] )[0].o)
      .attr("stroke", d => cColValues.filter(r=>  r.value === d[0] )[0].c);

    // ######################################
    
    // draw Legend
    legendG = svg_chart.select("g.legend")

      // UPDATE RECT
    var legend_rect = legendG
        .selectAll("rect")
        .data(cColValues, function(d) {return d });

    legend_rect
        .attr("id","old");
    
    legend_rect.enter()
        .append("rect")
        .attr("class","legend_rect")
        .attr("id","new")
        .attr("x", d => d.legX_box )
        .attr("y", d => d.legY_box )
        .attr("width", 16)
        .attr("height", 16)
    .merge(legend_rect)
        .style("fill", function(d) { return d.c })
    
        legend_rect.exit().remove() ;
    
      // UPDATE TEXT
      var legend_txt = legendG
        .selectAll("text")
        .data(cColValues, function(d) {  return d; });
    
      legend_txt
        .attr("id","old");
    
    legend_txt.enter()
        .append("text")
        .attr("class","legend_text")
        .attr("id","new")
        .attr("x", d => d.legX_text)
        .attr("y", d => d.legY_text)
      .merge(legend_txt)
        .text(function(d) {  return d.value})
          .style("font-weight", "bold")
        .style("font-size", "18px");
    
    
    legend_txt.exit().remove() ;

  } // draw Line