// -------------------------------------------------------
// Pull focus variable 
function varPlot(){
    //  Y - axis
    yVar_raw = $("#target #profile").val();
    yVar_info = attrCols.filter(d => d.column === yVar_raw );
    if (yVar_info[0].time_var) {
        value = yVar_info[0].time_var;
    } else {
        value = yVar_raw;
    }
    return value
}