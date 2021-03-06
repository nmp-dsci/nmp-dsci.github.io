// -------------------------------------------------------
function colorSubUnits(data, breakType='q', breakCount='5', colorScheme='RdGn', value=$("#target #profile").val()){

    // // update for redemption: BESPOKE to 'Engagement 1' tool for Profiling
    // redemp_checkbox = $("input#redemptions_t").is(":checked");
    // if (redemp_checkbox){
    //     value = value + '_redemp'
    // };

    var nums = data.filter(d => isFinite(+d[value])).map(d => +d[value] );
    var buckets = chroma.limits(nums, breakType, breakCount);
    var t = d3.transition().duration(750);

    // d3.select("#poa"+e.key)
    d3.selectAll(".path_geo")
        .transition(t)
        .style("fill", function(d){
        e = data.filter(f => +f[geoField] === +d.properties[absCode16]); 
        if ( e.length === 1 && !isNaN(e[0][value])  ){
            var bucketNumber = d3.min(buckets.map(function(bucket, i){
            if (e[0][value] <= bucket){
                return i;
            }
            })); // end map
            return colors[colorScheme][breakCount][bucketNumber - 1];
        } else {
            return "#DCDCDC"
        };
        });
    // };
        // .attr("class", "sa4 q"+quantile(Math.sqrt(+e.value.sales))+"-9")

    // an array to return for drawing the legend
    var arr = [];
    buckets.forEach(function(d, i){
        if (i != 0){
        var obj = {};
        obj.bucket = i;
        obj.x = buckets[i - 1];
        obj.width = d - obj.x;
        obj.color = colors[colorScheme][breakCount][i - 1];
        arr.push(obj);
        }
    });

    
    return arr;
} // end ColorSubUnits
