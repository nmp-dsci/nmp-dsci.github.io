

function tooltipText_sa4(e) {
var tooltip = "<b> Region: </b> " + e.name +"<br>" ;
//
console.log('e')
console.log(e)
attrCols.forEach(function(d){
    if (d.class === "y" && d.profile_y ===true ) {
    tooltipLine = "<b> "+d.name+": </b>"+ d.format(e[d.column])  +"<br>" ;
    tooltip = tooltip + tooltipLine;
    }
});
return tooltip ;
}


function drawTooltip(mapDF,tooltip_Yoffset=0){

    var div = d3.select("#map")
      .append("div")
      .attr("class", "tooltip");

    svg_map = d3.select('#map .geom')

    // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    //  TOOLTIP for 'path_geo'
    d3.selectAll(".path_geo")
      .on("mouseover", function(event) {
        // 
        eventDF = event.target.__data__.properties

        console.log('mapDF')
        console.log(mapDF)

        mapObj = mapDF.filter(f => +f[geoField] === +eventDF[absCode16]); 
        console.log('mapObj')
        console.log(mapObj)
        
        if (mapObj.length === 0){
          mapObj = {  key:eventDF[absCode16]
                    , name: eventDF[absName16]
                    , value:{empty:'no Data'}
            }
        } else {
          mapObj = mapObj[0]
          mapObj.name = eventDF[absName16];
        }
        tooltip = tooltipText_sa4(mapObj);
        // tooltip type
        div.transition()
          .duration(200)
          .style("opacity", 0.9);

        div.html(tooltip)
          .style("left",(event.x - 100) + "px")
          .style("top", (event.y - (0+tooltip_Yoffset)) + "px");
        // add text to map 
        svg_map.selectAll("text")
          .attr("x", 100)
          .attr("y", 100)
          .text("hi nate dawg")
          .attr("font-size", "200px");
      })
      .on("mouseout", function(event) { 
        div.transition()
          .duration(500)
          .style("opacity", 0);
        div.html("")
          .style("left" , "0px")
          .style("top", "0px");

      })
      // .on("click" ,function(d){
      //   // Update dashboard
      //   targetDF = filterData(data_df)
      //  drawLine(targetDF,d.properties.SA4_NAME16);
      //   drawRank(targetDF);
      // });


    }; // end function "drawTooltip"