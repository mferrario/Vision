jQuery(function(){
  jQuery('.open-menu').each(function() {
      var item = jQuery(this),
          parent = item.parent();

      parent.one('mousemove', function() {
          parent.hover(function() {
              parent.addClass('open');
          }, function() {
              parent.removeClass('open');
          }).trigger('mouseover');
      });
  });
});