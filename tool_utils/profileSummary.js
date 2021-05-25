// ##################################################
// function 'profileSummary'
function profileSummary(profile_all=[]){

    profile_all = profile_all.filter(d => d.profile === "n")

    // ##########################################
    // Overall Predictor leveral
    // 3. bring back the summary. 
    profileExtent = d3.rollups(profile_all, function(v)   { 
        return {
            'max':d3.max(v,r =>(isFinite(r[yType.upliftCol])  ? r[yType.upliftCol] : -100 ))
        ,   'min':d3.min(v,r =>(isFinite(r[yType.upliftCol])  ? r[yType.upliftCol] : 100 ))
        }
    },d=>d['xCol'] );

    console.log('profileExtent');
    console.log(profileExtent);

    let pProfile1 = [];
    profileExtent.forEach(function(skew){
        ['min','max'].forEach(calc => {
            skewRow =  profile_all.filter(d => d['xCol'] === skew[0]  && d[yType.upliftCol] === skew[1][calc] )[0];
            if (skewRow){
                colDesc = attrCols.filter(d=> d.column === skewRow.xCol)[0];
                Object.assign(skewRow, {'xCol_name': colDesc.name,'summCalc':calc});
                pProfile1 = pProfile1.concat(skewRow);
            }
        })
    });

    console.log('pProfile1')
    console.log(pProfile1)

    profile1Max = pProfile1.filter(row=> row.summCalc === "max")
    profile1Max = profile1Max.slice().sort((a, b) => d3.descending(a[yType.upliftCol], b[yType.upliftCol]));

    profile1Min = pProfile1.filter(row=> row.summCalc === "min")
    profile1Min = profile1Min.slice().sort((a, b) => d3.ascending(a[yType.upliftCol], b[yType.upliftCol]));

    yCol = varProfile();

    // 4. Plot summary 
    let profile1Header = [{"n":"Predictor" , "c":"xCol_name"   ,"t":"c"}];
    profile1Header.push({"n":"Segment"     , "c":"xCol_v"      ,"t":"c"});

    // Number vs Metric 
    if (yCol.n.slice(-2) == '_n') {
        profile1Header.push({"n":"Affinity"    , "c":"uplift"        ,"t":"n", "f":d3.format("+.2%")     });
        profile1Header.push({"n":"Composition" , "c":"composition" ,"t":"n", "f":d3.format(".2%")      });
    } else if (['_r','_d'].includes(yCol.n.slice(-2) )) {
        metricName = attrCols.filter(r => r.column  === yCol.n )[0].name
        profile1Header.push({"n":'value' , "c":"response"      ,"t":"n", "f":yType.format     });
        profile1Header.push({"n":"Growth" , "c":"growth"      ,"t":"n", "f":d3.format("+.2%")     });
        profile1Header.push({"n":"Composition" , "c":"composition"      ,"t":"n", "f":d3.format(".2%")      });
    } else if (['_a'].includes(yCol.n.slice(-2) )) {
        metricName = attrCols.filter(r => r.column  === yCol.n )[0].name
        profile1Header.push({"n":'value' , "c":"uplift"      ,"t":"n", "f":yType.format     });
        profile1Header.push({"n":"Growth" , "c":"growth"      ,"t":"n", "f":d3.format("+.2%")     });
        profile1Header.push({"n":"Composition" , "c":"composition"      ,"t":"n", "f":d3.format(".2%")      });
    }
    
    
    drawTable(profile1Max, "table_profile_top",profile1Header)
    drawTable(profile1Min, "table_profile_bottom",profile1Header)

} // END: profileSummary
