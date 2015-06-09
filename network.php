<!DOCTYPE HTML>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>Linked Visions</title>

<script src="js/jquery.min.js"></script>
<script src="js/jquery.history.js"></script>
<script src="js/jquery.rdfquery.core.min-1.0.js"></script>
<script src="js/jquery.colorbox-min.js"></script>
<script src="js/dragdealer.js"></script>
<script src="js/d3.v3.5.5.js"></script> 
<script src="js/vex.min.js"></script> 
<script src="js/network.js"></script> 

<link rel="stylesheet" href="css/network.css">
<link rel="stylesheet" href="css/vex.css">
<link rel="stylesheet" href="css/vex-theme-os.css">
<link rel="stylesheet" href="css/colorbox.css">
</head>

<body>
<a href="/"><img src="menu/logo.png" id="logo"></a>
<div id="title">WHISTLER AND ROUSSEL <br /> <span class="subtitle">LINKED VISIONS</span></div>
<a href="about.html" id="about">ABOUT</a>

<script>
jQuery('#about').colorbox({transition:"fade", width:"100%", height:"100%", opacity: 0.92, scalePhotos: true, returnFocus: false,
                                     /*title: 'About',
                                     onComplete:function () {
                                       jQuery('.cboxPhoto').attr('style','max-width:55%; max-height: 92%; height: 92%; margin-top:35px; margin-left: 35%; margin-right: 180px; float: none;');
                                       jQuery('#cboxContent').prepend(
                                         $("<img>")
                                           .attr("src", "menu/logo-white.png")
                                           .attr("id","cboxLogo")
                                           .attr("alt", "Art Institute of Chicago")
                                       );
                                     },
                                     onLoad:function() {
                                       $('html, body').css('overflow', 'hidden'); // page scrollbars off
                                     },
                                     onClosed:function() {
                                       $('html, body').css('overflow', ''); // page scrollbars on
                                     }*/
                                    });
</script>

<div id="network">
    <div id="popUp">
    </div>
	
	<div class="filter-button active" id="filter_all">All</div>     
	<div class="filter-button" id="filter_family">Family</div>     
	<div class="filter-button" id="filter_friends">Friends</div>     
	<div class="filter-button" id="filter_colleagues">Colleagues</div>     
	<div class="filter-button" id="filter_mentors">Mentors & Followers</div>     
	<div class="filter-button" id="filter_employers">Employers & Employees</div>     
</div>


<div id="spinner">
	<img src="menu/preloader.gif">
    <span>LOADING</span>
</div>

</body>
</html>
