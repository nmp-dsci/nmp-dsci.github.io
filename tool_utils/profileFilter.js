ready(() => {
    // --------------------------------------------------------
    // PROFILNG Selection: Response SET UP 
    yValues = attrCols.filter(d=> d.class === "y" && d.profile_y)
    // ADD the 'valueLegend' entries to Profiling Tool Selector
    yValues.forEach(function(d,i){
        parentObj = document.querySelector("#profile_template #target #profile"); 
        myOption = document.createElement("option");
        myOption.text = d.name;
        myOption.value = d.column;
        parentObj.appendChild(myOption);
    });
    document.querySelector("#profile_template #target #profile").value = yValues[0].column;

    base_profile = document.querySelector("#profile_template #base #profile");
    if (base_profile ){
        yValues.forEach(function(d){
            myOption = document.createElement("option");
            myOption.text = d.name;
            myOption.value = d.column;
            base_profile.appendChild(myOption);
        });
        document.querySelector("#profile_template #base #profile").value = yValues[1].column;
    }

    // ########################################################
    // ATTRIBUTE FILTERS 
    // STEP 0: Draw "Attribute Filter Drop Down"
    attrCols.forEach(function(d,i){
        if (d.class == "x" ) {
            // build out drop down
            xValues = uniqueValues([d.column])[0].value
            // add drop down 
            xValues.forEach(function(v) {

                const lvls = [{'c':'n','n':'target'},{'c':'d','n':'base'}]; 
                lvls.forEach(lvl => {
                    filterDropdown = document.querySelector('#profile_template '+ "#"+lvl.n+" .items"); 
                    // if exists 
                    if (filterDropdown){
                        myLi = document.createElement("li");
                        myLi.textContent = d.name + " - " + v + '     ';
            
                        myInput = document.createElement("input");
                        myInput.type = 'checkbox';
                        myInput.className = 'profile_dropdown';
                        myInput.id = lvl.c + '__'+d.column+'__' + v; 
                        myInput.value = d.column+"__" + v ; 
                        myLi.appendChild(myInput);
                        //  
                        filterDropdown.appendChild(myLi);
                    }
                })// end lvl => {}
            });
        }; // end loop through filter for x 
    }); // end loop through column name

    var target_checkList = document.getElementById('target_filter');
    var base_checkList = document.getElementById('base_filter');

    if (base_checkList){
        document.querySelector("#profile_template #base .anchor").addEventListener("click", () => {
        // Target Controling
        if (base_checkList.classList.contains('visible')){
            base_checkList.classList.remove('visible');
        } else {
            base_checkList.classList.add('visible');
            }
        });
    }

    document.querySelector("#profile_template #target .anchor").addEventListener("click", () => {
        // Target Controling
        if (target_checkList.classList.contains('visible')){
            target_checkList.classList.remove('visible');
        } else {
            target_checkList.classList.add('visible');
        }
    }); // end target on change
});