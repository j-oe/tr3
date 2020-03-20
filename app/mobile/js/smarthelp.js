/*
 smarthelp.js
 app ui & interaction
 2014, Jan Oevermann
*/

// prevent mobile browsers from bounce scrolling behaviour
document.ontouchmove = function(event){
    event.preventDefault();
}

//////////////// SMARTHELP ////////////////
smarthelp = {
  init: function () {
    smarthelp.build();
    // get global touch events on .tr3-Element
    var main = $('.tr3')[0];

      // swipedown on drag and body
    $('.tr3, .sh-drag').each(function () {
      Hammer(this, {swipe_velocity: 0.2}).on("swipedown", function() {
        $('.sh-container').animate({top:'-35px'},{duration:'fast',queue: false});
        $('.tr3').animate({opacity:'0.5'},{duration:'fast',queue: false});

        // close panel on tap
        Hammer(main).on('tap', function() {
          $('.sh-container').animate({top:'-330px'},{duration:'fast',queue: false});
          $('.tr3').animate({opacity:'1'},{duration:'fast',queue: false});
          Hammer(main).off('tap');
        });
      });
    });

      // swipeup on panel and drag
    $('.sh-panel, .sh-drag').each(function () {
      Hammer(this, {swipe_velocity: 0.2}).on("swipeup", function() {
        $('.sh-container').animate({top:'-330px'},{duration:'fast',queue: false});
        $('.tr3').animate({opacity:'1'},{duration:'fast',queue: false});
        Hammer(main).off('tap');
      });
    });

     // swiperight on body
    Hammer($('.tr3')[0], {swipe_velocity: 0.2}).on("swiperight", function() {
      tr3.back();
    });

     // tap on home symbol
    Hammer($('.sh-home')[0]).on("tap", function() {
      tr3.init('logic/smarthelp.xml',{trigger: tr3.trigger});
    });

     // tap on settings symbol
    Hammer($('.sh-settings')[0]).on("tap", function() {
      $('.tr3').css({'padding': 0, 'background': '#fff'}).html('<iframe src="http://smart.de" style="min-height:100%;"></iframe>');
      // window.location.href = "http://smart.de";
    });


     // tap on menu items
    $('.tab-item, .sh-links-item').each(function () {
      Hammer(this).on("tap", function() {
        $('.sh-container').animate({top:'-330px'},{duration:'fast',queue: false});
        $('.tr3').animate({opacity:'1'},{duration:'fast',queue: false});
        Hammer(main).off('tap');
      });
    });

     // unbind tr3-ready event
    $('.tr3').off('tr3-ready');
     // connect to tr3-event-API
    smarthelp.bind();
  },

  bind: function () {
    $('.tr3').on('tr3-load-before', function() {
      $('.tr3-question').append('&nbsp;<i class="icon ion-ios7-refresh-empty ion-spin tr3-loading-indicator"></i>');
    });
    $('.tr3').on('tr3-load-after', function() {
      $('.tr3-loading-indicator').remove();
    });
  },

  build: function () {
    $.each(smarthelp.quicklinks, function (ix, link) {
      $('.sh-links-list').append('<li class="sh-links-item" id="item-' + ix + '">' + link.label + '</li>');
      $('.sh-links-list').find('#item-' + ix).on('touchend', function () {
        tr3.init('logic/quicklinks/' + link.tree, {trigger: 'touchend'});
      });
    });
  },

  quicklinks: [
    { label: 'Pannenhilfe', tree: 'pannenhilfe.xml' },
    { label: 'Umgebung', tree: 'umgebung.xml' },
    { label: 'Displaymeldung', tree: 'display.xml' }
  ]
};

// when DOM is ready, go!
$(document).ready(function() {
    // test if user has already installed web app
    if (window.navigator.standalone === true) {
      $('.sh-loading').fadeOut(1000);
      $('.sh-drag').fadeIn(1000).css('display', 'block');
      // start up tr3
      tr3.init('logic/smarthelp.xml', {trigger: 'touchend'});
      // start up smarthep when tr3 is ready
      $('.tr3').on('tr3-ready', function() {
        smarthelp.init();
      });
    } else {
      // if not installed prompt user to do so
      window.alert('smart help - Demo App\nZum Installieren tippen Sie den Share-Button und anschließend auf "Zum Home-Bildschirm hinzufügen"');
    }
});