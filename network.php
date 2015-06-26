<!DOCTYPE HTML>
<html>
<head>
  <?php require 'head.php'; ?>
  <script src="js/network.js"></script> 
</head>
<body>

<?php include 'analytics.php'; ?>

<img src="menu/logo.png" id="logo">
<div id="title">WHISTLER AND ROUSSEL <br /> <span class="subtitle">LINKED VISIONS</span></div>
<a href="about.html" id="about">ABOUT</a>

<div id="network">
    <div id="popUp">
    </div>
	
  <div class="filters">
    <div class="filter-button active" id="filter_all">All</div>     
	  <div class="filter-button" id="filter_family">Family</div>     
	  <div class="filter-button" id="filter_friends">Friends</div>     
	  <div class="filter-button" id="filter_colleagues">Colleagues</div>     
	  <div class="filter-button" id="filter_mentors">Mentors & Followers</div>
	  <div class="filter-button" id="filter_employers">Artists & Models</div>     
  </div>
</div>


<div id="spinner">
	<img src="menu/preloader.gif">
    <span>LOADING</span>
</div>
<script>
if (interactive == true) {
  //add timer for interactive
  (function($){
    var timeout = 60000;
    $(document).bind("idle.idleTimer", function(){
      window.location.href = '/?utm_source=inGallery&utm_medium=inGallery';
    });

    $(document).bind("active.idleTimer", function(){
      //reset timer? listen for idleness?
    });

    $.idleTimer(timeout);
	})(jQuery);

  //logo function
	$('#logo').dblclick(function() {location.reload();});
} else {
	$('#logo').addClass('headerpointer');
	$('#logo').click(function() {
	window.location.href ='http://www.artic.edu';
	});
	
	$('#title').addClass('headerpointer');
	$('#title').click(function() {
	window.location.href ='/';
	});
}
</script>
</body>
</html>
