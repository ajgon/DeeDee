(function($) {
    var deedee_width;

    $('nav a').click( function(event) {
        $.scrollTo(
            $(this).attr("href"),
            {
                duration: 400,
                offset: { 'left':0, 'top': -50 }
            }
        );
    });
    $('body').scrollspy({offset: 60});
    prettyPrint();

    $(window).resize(function() {
        console.log(2);
        deedee_width = Math.min.apply(Math, [Math.floor(($(window).width() - $('#wrapper').width()) / 2 - 6), 445]);
        if(deedee_width < 150) {
            $('#deedee').hide();
        } else {
            $('#deedee').show().width(deedee_width);
        }
    }).resize();
}(jQuery));