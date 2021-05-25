function profileCalc(table_df = [],yCol={'n':"","d":""},aggFields=[],yType={}){

    // get all combos to back fill nulls 
    let valueDict = uniqueValues(aggFields);
    let flatArr = allCombos(valueDict);

    // Complete Data Aggregations
    let profileC = ['profile']
    let profile_df = summFunc(table_df , profileC.concat(aggFields));
    let total_df = summFunc(table_df , profileC);
    
    // add the Profile totals for composition calculation
    let profile_summ = []
    flatArr.forEach(function(combo){
      // filter down to 'Target/base' rows
      row_xCol_v = profile_df.filter(d => d[valueDict[0].key]  === combo[0]);
      // set xCol values
      let xCol_df = {'xCol':valueDict[0].key,'xCol_v':combo[0]}
      if (row_xCol_v.length === 2){
        row_xCol_v.forEach(function(r){
          Object.assign(r, xCol_df);
          // add comparison metrics
          if (["_n"].includes(yCol[r['profile']].slice(-2)) ) {
            composition = r[yCol[r['profile']]] / total_df.filter(d=>d.profile===r['profile'])[0][yCol[r['profile']]];
            Object.assign(r, {'type_var':yCol[r['profile']],'composition': composition})
          } else if (["_a","_r",'_p',"_d"].includes(yCol[r['profile']].slice(-2)) ) {
            XColLY = yCol[r['profile']].replace('y21', 'y20')
            underXCol = yCol[r['profile']].slice(0,-2) + '_n'
            underXColLY = underXCol.replace('y21', 'y20')
            composition = r[underXCol] / total_df.filter(d=>d.profile===r['profile'])[0][underXCol];
            // Growth treatment
            if (["_r","_a"].includes(yCol[r['profile']].slice(-2)) ){
              growth = r[yCol[r['profile']]] / r[XColLY]-1;
            } else if  (["_d"].includes(yCol[r['profile']].slice(-2)) ) {
              growth = r[underXCol] / r[underXColLY]-1;
            } else if (["_p"].includes(yCol[r['profile']].slice(-2)) ){
              growth = 0;
            }
            profileValue = r[yCol[r['profile']]];
            Object.assign(r, {'type_var':yCol[r['profile']],'response': profileValue,'composition':composition,'growth':growth});
          } 
          
        }); // end forEach
      } else {
        ['n','d'].forEach(function(profileID){
          if (row_xCol_v.filter(d=>d.profile===profileID).length === 1 ){
            Object.assign(row_xCol_v.filter(d=>d.profile===profileID), xCol_df);
            Object.assign(row_xCol_v.filter(d=>d.profile===profileID), {
                'type_var':yCol[profileID],
                'composition': row_xCol_v.filter(d=>d.profile===profileID)[yCol[profileID]] / total_df.filter(d=>d.profile===profileID)[0][yCol[profileID]],
                'response':row_xCol_v.filter(d=>d.profile===profileID)[yCol[profileID]] / total_df.filter(d=>d.profile===profileID)[0][yCol[profileID]],
              });
          } else { // doesn't exist insert into 'row_xCol_v'
            enter_row = {}
            Object.assign(enter_row, xCol_df);
            Object.assign(enter_row, {'type_var':yCol[profileID],'response':0.0001,'uplift':0.00001,'composition':0.000001, profile:profileID});
            enter_row[yCol[profileID]] = 0;
            row_xCol_v = row_xCol_v.concat(enter_row)
          }
        }) // end loop through 'profileID'
      } // end length of 'row_xCol_v'

      // console.log('row_xCol_v')
      // console.log(row_xCol_v)

      row_xCol_v.forEach(function(r){
        if (r['profile'] === 'n'){
          if ( isFinite(row_xCol_v.filter(d=>d.profile==='n')[0][yType.barCol]) ){
            yN = row_xCol_v.filter(d=>d.profile==='n' && d.xCol === r.xCol && d.xCol_v === r.xCol_v)[0][yType.barCol];
            yD = row_xCol_v.filter(d=>d.profile==='d' && d.xCol === r.xCol && d.xCol_v === r.xCol_v)[0][yType.barCol];
            Object.assign(r, {'uplift':yN-yD })
          } else {
            Object.assign(r, {'uplift':0})
          }
        } else {
          Object.assign(r, {'uplift':null})
        }
      }); // end forEach    
      profile_summ = profile_summ.concat(row_xCol_v);

    }) // end loop through 'combo'

    // if nvalues > 10 
    if (flatArr.length >= 10 && xColAttr.order === undefined ) {
      profile_t10 = profile_summ.filter(r => r.profile === "n");
      profile_t10 = profile_t10.slice().sort((a, b) => d3.descending(a['composition'], b['composition'])).slice(0,10);
      keep_xCol_v = profile_t10.map(d => d.xCol_v)
      profile_summ = profile_summ.filter(d => keep_xCol_v.includes(d.xCol_v))
    }

    return profile_summ
} //profileCalc
