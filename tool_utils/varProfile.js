// -------------------------------------------------------
// function 'varProfile': pull profile Cuts 
function varProfile(){
    let num = $("#profile_template #target #profile").val();
    let den = $("#profile_template #base #profile").val();
    return {'n':num,'d':den};
}
