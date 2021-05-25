function drawTopline(target_df, base_df,tag='') {

    // dRAW Totals
    totalHeader = [
      {"n":"Metric", "c":"Metric","t":"c"},
      {"n":"Target", "c":"target","t":"v"},
      {"n":"Base", "c":"base","t":"v"},
      {"n":"comparison", "c":"comparison","t":"v"},
    ]

    totalRow = attrCols.filter(r=>r.profile_y & r.class ==="y");

    // Draw Top line summary
    targetDF = summFunc(target_df,["dummy"]);
    baseDF = summFunc(base_df,["dummy"]);

    totalSumm = [];
    totalRow.forEach(function(metric){
      if (metric.c !== "dummy"){
        addRow = {'Metric':metric.name};
        addRow['target'] = metric.format(targetDF.filter(d => d['dummy'] === "all")[0][metric.column]);
        addRow['base'] = metric.format(baseDF.filter(d => d['dummy'] === "all")[0][metric.column]);
        addRow['comparison'] = d3.format("0.2%")(targetDF.filter(d => d['dummy'] === "all")[0][metric.column]/baseDF.filter(d => d['dummy'] === "all")[0][metric.column]);
      } else {
        addRow = {'Metric':metric.name,'target':"",'base':"",'comparison':''};
      }
      totalSumm.push(addRow);
    })

    drawTable(totalSumm, "table_topline_"+tag,totalHeader)

  } // end function 'drawTopline'