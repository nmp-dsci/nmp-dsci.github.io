
ready(() => {
    // --------------------------------------------------------------------------------
    // map setup
    var map_p = {width_b:530,height_b:600,legend_w:530,legend_h:30,legendbar_h:15};      

    d3.select("#legend")
        .append("svg")
        .attr("width", map_p.legend_w)
        .attr("height",map_p.legend_h)
        .attr("id","svg");

    // INITIALISE Dashboard
    d3.select("#map")
        .append("svg")
        .attr("width", map_p.width_b)
        .attr("height", map_p.height_b) 
        .attr("class","geom");

    // ##########################################
    //  Run Listener
    document.querySelector("#run_profile").addEventListener("click", e => {
        // 
        e.preventDefault();
        $('#spinner_profile').fadeIn(function() {
            profileRun(function() {
            $('#spinner_profile').fadeOut();
            },new_div=false,sa4_map=true)
        });
    }); // END '#run_profile'


    // Run visualisation
    profileRun(function() {}, new_div=true,sa4_map=true)
});
