// drawMaps
function drawMaps( map_json,geo_df, geoField) {

    if (['member_sa4'].includes(geoField)){
        absCode16 = 'SA4_CODE16'
        absName16 = 'SA4_NAME16'
        absCode = 'sa4'
    } else if (['postcode'].includes(geoField)){
        absCode16 = 'POA_CODE16'
        absName16 = 'POA_NAME16'
        absCode = 'poa'
    }

    // STEP 1: DRAW Map
    var projection = d3
        .geoMercator() 
        .scale(29000)	  // zoom in 
        .center([151, -33.7]); // where to center SVG on  

    var path = d3.geoPath().projection(projection);

    d3.select('#map .geom')
        // .append("g")
        .selectAll("path")
            .data(map_json.features)
        .enter()
        .append("path")
            .attr("class", 'path_geo')
            .attr("id", d => absCode+"_"+d.properties[absCode16])
            .attr("d", path);

    if (typeof location_geo != "undefined"){
        // add locations
        d3.select('#map .geom')
            .selectAll("circle.pin")
            .data(location_geo)
                .enter()
            .append("circle")
                .attr("class", "pin")
                .attr("r", 5)
                .attr("stroke", "black")
                .attr("stroke-width", 2)
                .attr("fill", "black")
                .attr("opacity", 0.5)
    }


    // append a DIV for the tooltip
    var div = d3.select("#map")
        .append("div")
        .attr("class", "tooltip");

    // STEP 2: Generate heatmap data
    // renewal_map / acquisition_map
    //  if Time window like 'This month'/'last 3 month' or same 'months prev FY'
    dtVal = $("#rank #window").val();

    if (dtVal){
        console.log('activated')
        geo_df = geo_df.filter(d =>  d[dtVal] === 1);
    }

    poa_lvl = summFunc(geo_df,[geoField]);

    // restrict results for tooltip only to 'tooltip==true' in 'attrCols'
    headerCols = [geoField].concat(attrCols.filter(d=>d.profile_y===true).map(d=> d.column))
    let result_df = poa_lvl.map(e => {
        const obj = {};
        headerCols.forEach(k => obj[k] = e[k])
        return obj;
    });

    var buckets = colorSubUnits(poa_lvl);
    drawLegend(buckets);
    drawTooltip(result_df);

            // -------------------------------------------------------
    // Zoom functionality
    var mapZoom = d3.zoom()
        .on("zoom", zoomed);

    var zoomSettings = d3.zoomIdentity
        .translate(250, 250)
        .scale(30000);

    function zoomed(event) {
        projection.translate([event.transform.x, event.transform.y])
        .scale(event.transform.k);

        d3.selectAll("path.path_geo").attr("d", path);

        // draw pins to projects
        d3.selectAll("circle.pin")
        .attr("transform", function(d) {
        // console.log(projection([151.30397099,-33.70 ]))
        return "translate(" + projection([
            d.location.longitude,
            d.location.latitude
        ]) + ")"
        })

    }
    
    d3.select('#map .geom').call(mapZoom).call(mapZoom.transform, zoomSettings);


} // end function: 'drawMaps'
