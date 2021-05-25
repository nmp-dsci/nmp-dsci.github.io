

## Tool Template Looking 
| Tool | End user tools | 
| ---- | --------------|
| Growth Summary | `renewal_map`, `acquisitions_map` `acquisition_iag_map` | 
| Profiling | all `redemption' |
| Overtime Summary | `engagement_tool1` |
| Model diagnostics | all `modelling diagnostic` tools | 

| Tool/function | drawTable.js | data_filterData.js | data_aggregations.js | data_pivotData.js | map_colorSubUnits.js | map_drawMaps.js | map_drawTooltip.js | map_drawLegend.js | openTab.js |  
| -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | 
| engagement | engagement_tool1| yes | yes | yes | no |
| Summary C2G | Renewal/Acquisition | yes | yes | yes | yes |



# Summary of Function
1. `drawTable`: draw a HTML table
2. `data_filterData`: filter down data based on HTML select drop downs
3. `data_aggregations`: aggregate data for
4. `data_pivotData`: pivot aggregated results for comparison


# `renewal_map.html` & `acquisition_map.html`
## Starting with "drawRank" refactor: Done
1.  `drawTable`: no update required
2.  `data_filterData`; now update required
3.  `data_aggregations`: no update required
4.  `data_pivotData`: CREATED, could be leveraged to Growth/ **C2G**
5.  update `drawRank` have FY20 and FY21 aggregated and drive **C2G**
6.  `map_drawTooltip`:  "topline:true" in attrCols for `map_tooltopText_sa4` , y offset of tooltip position
7.  `map_drawLegend`: easy 1 for 1 
8.  `map_drawMap`: (1) standardised "#response #column" to "#target #profile" (2) 'geoField' has be a LIST no STRING
9.  `initChart`: pretty straight forward 
10. `drawLine`: SAME as 'drawRank' rip it out later 
11. `openTab`: bring in TAB system 

99. **AttrCols** : `format` remove the "e => d3.format()" for "d3.format()"   

99. changes to follow up: `map_colorSubUnits` had 'engagement tool' only I commented out
99. *FOR EVERY TOOL* the data for processing is called `data_df` not   `renew_map_df` or `acq_map_df`


# `profile_batteries.html` and all the other profile tools 
1. kill off all the profile specific CSS 
2. 







