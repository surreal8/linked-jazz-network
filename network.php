<?php

/*
  This is a simple php snipt it scrape the image directory for images that are available and their metadata (youtube videos)
  TODO: Script to put all images into a css style sheet as base64 data
*/
if ($handle = opendir('images/headshotIcon/')) {
	$jsFileNames='';
	$jsMetaNames='';
  while (false !== ($entry = readdir($handle))) {
    if ($entry != "." && $entry != "..") {
			if (strpos($entry,'.png')!==false){
				$jsFileNames .= '"' . $entry . '",';
			}
			if (strpos($entry,'.meta')!==false){
				$jsMetaNames .= "'" . $entry . "',";
			}
    }
  }

  //these get put out to the html render as JS vars.
	$jsFileNames = substr($jsFileNames,0,strlen($jsFileNames)-1);
	$jsFileNames = "var fileNames = [" . $jsFileNames . "];";
	$jsMetaNames = substr($jsMetaNames,0,strlen($jsMetaNames)-1);
	$jsMetaNames = "var metaNames = [" . $jsMetaNames . "];";
	
  closedir($handle);
}

if ($handle = opendir('images/headshot/')) {
	$jsHeadshotFileNames='';
  while (false !== ($entry = readdir($handle))) {
    if ($entry != "." && $entry != "..") {
			if (strpos($entry,'.png')!==false){
				$jsHeadshotFileNames .= '"' . $entry . '",';
			}
    }
  }

  //these get put out to the html render as JS vars.
	$jsHeadshotFileNames = substr($jsHeadshotFileNames,0,strlen($jsHeadshotFileNames)-1);
	$jsHeadshotFileNames = "var headshotFileNames = [" . $jsHeadshotFileNames . "];";
	
  closedir($handle);
}




?>









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



<script type="text/javascript"><?=$jsFileNames?><?=$jsMetaNames?><?=$jsHeadshotFileNames?></script>

<link rel="stylesheet" href="css/network.css">
<link rel="stylesheet" href="css/vex.css">
<link rel="stylesheet" href="css/vex-theme-os.css">
<link rel="stylesheet" href="css/colorbox.css">
<!-- link rel="stylesheet" type="text/css" href="//www.artic.edu/sites/all/themes/aic_base/fonts/201687/DE1CD028D2131BE18.css" media="screen, projection, print" -->
</head>

<body>
<a href="/"><img src="menu/logo.png" id="logo"></a>
<div id="title">WHISTLER AND ROUSSEL <br /> <span class="subtitle">LINKED VISIONS</span></div>
<a href="#" id="about">ABOUT</a>

<div id="network">
    <div id="popUp">
    </div>
	
	<div id="filter_all">All</div>     
	<div id="filter_family">Family</div>     
	<div id="filter_friends">Friends</div>     
	<div id="filter_colleagues">Colleagues</div>     
	<div id="filter_mentors">Mentors and Followers</div>     
	<div id="filter_employers">Employers and Employees</div>     
</div>


<div id="spinner">
	<img src="menu/preloader.gif">
    <span>LOADING</span>
</div>

</body>
</html>
