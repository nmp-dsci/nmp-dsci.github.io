function initChart(attr_col='',value_col='',new_div=false,tag='profile'){

    // ########################################################
    //  INITIALISE SVG 
    if (new_div){
        colDF = attrCols.filter(r => r[attr_col]  === value_col )[0]
        d3.select('#template_'+tag)
          .select("#"+colDF.htmlref)
          .append('div')
          .attr("id", tag+'_'+ value_col)
          .attr("style","border:1px solid black")
    }

    // Change map dimensions is large amount of xCols
    valueDict = uniqueValues([value_col]);
    flatArr = allCombos(valueDict);
    sumStrLen = d3.sum(flatArr.map(r=>String(r[0]).length),d=>d)
    maxStrLen = d3.max(flatArr.map(r=>String(r[0]).length),d=>d)
    xColBuffer = flatArr.length > 7 || maxStrLen > 13 || sumStrLen > 30; 
    xCol_buffer = xColBuffer  === true ? maxStrLen * 5 : 20
    

    //##########################################
    // Chart preparation
    var margin = {top: 100, right: 20, bottom: 20 + xCol_buffer, left: 90};
    var width = 500 - margin.left - margin.right,
      height = 450 - margin.top - margin.bottom;


    var svg = d3.selectAll('#'+tag+'_'+value_col)
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate("+margin.left+","+margin.top+")")
        .attr("class", `chart_${tag}_${value_col}`);

    svg.append("text")
      // .attr("y", line1_p.top / 2)
      // .attr("x", (line1_p.width_b + line1_p.left)/2 )
      .attr("y",-1 * (margin.top/1.5 ))
      .attr("x",10)
      .style("font", "20px sans-serif")
      .attr("class","plot_title")

    // add X/Y axis
    svg.append("g")
      .attr("class", "x_axis" )
      .attr("transform", "translate(0, " + height + ")" )

    svg.append("g")
      .attr("class", "y_axis")

    svg.append('text')
      .attr("class","yAxis_name")
      .attr("transform", "rotate(-90)")
      .attr("y",  -margin.left + 20)
      .attr("x",10 - (height /2 + margin.top));
      // .style("text-anchor", "middle")

    // LEGEND
    svg.append("g")
      .attr("class","legend")
      .attr("height", 100)
      .attr("width", 300)
      .attr("transform",  `translate(${-20},${0 - margin.top})`);

    }// initChart end