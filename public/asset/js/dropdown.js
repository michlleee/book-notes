function toggleShow(){
    $("#filterDrop").slideToggle(200);
}

$(".dropBtn").on("click", function(){
    toggleShow();
});

$(window).on("click", function(event){
    if (!$(event.target).closest('.dropdown').length) {
        $("#filterDrop").slideUp(200);
    }
});