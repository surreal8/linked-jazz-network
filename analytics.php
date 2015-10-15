<?php // replace this file with your own custom analytics ?>

<script>
  function sendVirtualPageview() {
    dataLayer.push({
      event: 'vpv',
      noDefaultPageview: false
    });
  }

  // disable default pageviews
  dataLayer = [{
    noDefaultPageview: true
  }];

  // listen for 'vpv' event to trigger virtual pageviews
  $('body').on('vpv', sendVirtualPageview);

  // fire virtual pageview on homepage,
  // but exclude inGallery due to idleTimer,
  // instead firing a pageview on begin button click
  if(window.location.pathname === '/') {
    if(!window.location.search.match(/utm_source=inGallery/)) {
      sendVirtualPageview();
    } else {
      $(document).ready(function() {
        $('#begin').on('click', function() {
          $('body').trigger('vpv');
        });
      });
    }
  }
</script>

<!-- Google Tag Manager -->
<noscript><iframe src="//www.googletagmanager.com/ns.html?id=GTM-MQBCFS"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MQBCFS');</script>
<!-- End Google Tag Manager -->
