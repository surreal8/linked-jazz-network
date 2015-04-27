if (!document.createElementNS || !document.createElementNS('http://www.w3.org/2000/svg','svg').createSVGRect) {
  alert('We\'re Sorry, this visualization uses the SVG standard, most modern browsers support SVG. If you would like to see this visualization please view this page in another browser such as Google Chrome, Firefox, Safari, or Internet Explorer 9+');
}

vex.defaultOptions.className = 'vex-theme-os';


var visMode = 'clique';           //the type of network to render, each has it own settings

var tripleStore = null;         //holds the triple data bank created by the rdfquery plugin
var tripleObject = null;        //holds the javascript seralized object of the triple store
var descStore = null;           //holds the triple data bank created by the rdfquery plugin for the description
var descObject = null;          //holds the javascript seralized object of the triple store for the description
var nameObject = null;          //holds the foaf names of the people
var largestNodes = [];          //holds a list of the N largest nodes/people (most connections) in order to place/lock them properly on render
var usePerson = null;           //the person in person mode
var usePersonIndex = 0;         //the index pos of the usePerson in the nodes array, so we dont have to loop through the whole thing everytime
var edgesAvg = 0;
var edgesInterval = 0           //the steps between the avg and largest # edges
var trans = [0,0];
var scale = 0.99;
var dynamicPeople = [];         //holds who is added in the dynamic mode
var rendering = false;          //global to keep track if we are rendering from a click or a history pushstate change
var popupShown = false;         //global to keep track if the popup has already been displayed

var idLookup = {}               //holds nice names to uri conversion

var zoom = null;                //the d3.js zoom object
var baseNodes = [];             //stores the base (all) of the nodes and
var baseLinks = [];             // links

var force = null;               //the d3 force object
var vis = null                  //the visualization
var visWidth = 1000;            //width and height of the network canvas, in px
var visHeight = 500;

var connectionCounter = {};     //holds each id as a property name w/ the value = # of connections they have

var connectionIndex = {};       //an object with properties as id names, with values an array of strings of ids that person has connections to.
var largestConnection = 0;
var relationIndex = {};         //an object with properties as relationship ids, with values an array of strings of ids that have that relation.

var simlarityIndex = {}         //properties are id names, with the value being an array of objects with other ids and their # of matching connections
var largestSimilarity = 0;      //holds the max number of similar connections any two nodes share in the network

var strokeWidth = 0.3;          //the defult width to make the stroke

//the settings that vary for each diff type of network
var networkLargeNodeLimit = 20;	//the number of top nodes to fix/lock to a patterend spot on the network
var networkNodeDrag = false;    //can you drag the nodes about?

var cssSafe = new RegExp(/%|\(|\)|\.|\,|'|"/g);	//the regex to remove non css viable chars

var zoomWidgetObj = null;       //the zoom widget draghandeler object
var zoomWidgetObjDoZoom = true;

var oldzoom = 0;

var fill = d3.scale.category10();
var lineColor = d3.scale.category20c();

var whistlerPersonIndex = 0;    //the index pos of the James_McNeill_whistler in the nodes array, so we dont have to loop through the whole thing everytime
var roussellPersonIndex = 0;    //the index pos of the James_McNeill_whistler in the nodes array, so we dont have to loop through the whole thing everytime


jQuery(document).ready(function($) {

  // Bind to StateChange Event
  History.Adapter.bind(window,'statechange',function() { // Note: We are using statechange instead of popstate
    var State = History.getState(); // Note: We are using History.getState() instead of event.state
    parseStateChangeVis();
  });

  if(!document.createElementNS || !document.createElementNS('http://www.w3.org/2000/svg','svg').createSVGRect) {
    jQuery("#network").html(
      'Sorry, this visualization uses the <a href="http://en.wikipedia.org/wiki/Scalable_Vector_Graphics">SVG standard</a>, most modern browsers support SVG.<br>If you would like to see this visualization please view this page in another browser such as <a href="https://www.google.com/chrome">Chrome</a>, <a href="http://www.mozilla.org/en-US/firefox/new/">Firefox</a>, <a href="http://www.apple.com/safari/download/">Safari</a>, or <a href="http://windows.microsoft.com/en-US/internet-explorer/downloads/ie">Internet Explorer 9+</a>'
    );
    return false;
  }

  /* Binds */
  $(window).resize(function() { windowResize();});

  jQuery("#filter_all").click(function() {hideRelations(); });
  jQuery("#filter_family").click(function() {showRelations("family"); });
  jQuery("#filter_friends").click(function() {showRelations("friends"); });
  jQuery("#filter_colleagues").click(function() {showRelations("colleagues"); });
  jQuery("#filter_mentors").click(function() {showRelations("mentors"); });
  jQuery("#filter_employers").click(function() {showRelations("employers"); });

  //$("#network").fadeOut();

  var history = History.getState();
  if (history.hash.search(/\?person=/) > -1) {
    visMode = "person";
  }
  windowResize();

  //showSpinner("Loading<br>Triples");

  initalizeNetwork();

  //give the UI some breathing room, a chance to render
  setTimeout(function() {

    //grab the names of the artists
    $.get('data/names.txt', function(data) {
      buildNameStore(data);
    });


    //grab the descripons of the artists
    $.get('data/abstracts.txt', function(data) {
      buildDescriptionStore(data);
    });

    $.get('data/relationships.txt', function(data) {

      buildTripleStore(data);

      dataAnalysis();

      //we need the description data ready because it has the names in it
      var interval = window.setInterval(function checkDescriptionStore() {
        if (window.descObject) {
          window.clearTimeout(interval);
          buildBase();

          parseStateChangeVis();
        }
      },10);

    })
      .error(function() { alert("There was an error in accessing the data file. Please try again."); });

  }, 10, []);
  
  //add the zoom widget
  jQuery("#network").append(
    jQuery("<div>")
      .attr("id","zoomWidget")
      .addClass("dragdealer")
      .append(
        jQuery("<div>")
          .addClass("handle")
          .append(
            jQuery("<div>")
              .text("-")
          )
      )
      .append(
        jQuery("<div>")
          .addClass("zoomWidgetRail")
      )
      .append(
        jQuery("<div>")
          .addClass("zoomWidgetEndcaps")
          .attr("id","woomWidgetZoomOut")
          .css("top","-17px")
          .append(
            jQuery("<div>")
              .text("-")
          )
      )
      .append(
        jQuery("<div>")
          .addClass("zoomWidgetEndcaps")
          .attr("id","woomWidgetZoomIn")
          .css("top","145px")
          .append(
            jQuery("<div>")
              .text("+")
          )
      )

  );

  jQuery("#zoomWidget").mouseenter(function() {console.log('whhyyy'); zoomWidgetObjDoZoom = true; });

  zoomWidgetObj = new Dragdealer('zoomWidget',
                                 {
                                   horizontal: false,
                                   vertical: true,
                                   y: 0.255555555,
                                   animationCallback: function(x, y)
                                   {
                                     //if the value is the same as the intial value exit, to prevent a zoom even being called onload
                                     if (y==0.255555555) {return false;}
                                     //prevent too muuch zooooom
                                     if (y<0.05) {return false;}


                                     //are we  zooming based on a call from interaction with the slider, or is this callback being triggerd by the mouse event updating the slider position.
                                     if (zoomWidgetObjDoZoom == true) {

                                       y =y *4;

                                       //this is how it works now until i figure out how to handle this better.
                                       //translate to the middle of the vis and apply the zoom level
                                       vis.attr("transform", "translate(" + [(visWidth/2)-(visWidth*y/2),(visHeight/2)-(visHeight*y/2)] + ")"  + " scale(" + y+ ")");
                                       //store the new data into the zoom object so it is ready for mouse events
                                       zoom.translate([(visWidth/2)-(visWidth*y/2),(visHeight/2)-(visHeight*y/2)]).scale(y);
                                     }



                                   }
                                 });

});

function parseStateChangeVis() {

  var history = History.getState();

  if (history.hash.search(/\?person=/) > -1) {

    var person = history.hash.split('?person=')[1];
    //trim off the suid that the library attaches if we need to. hacky
    if (person.search(/_suid=/)>-1) {
      person = person.split('&_suid=')[0]
    }

    //lookup that nice name for the uri
    usePerson = jQuery.map(idLookup, function(obj,index) {
      if(obj === person)
        return index;
    })[0];

    changeVisMode("person");

  } else if (history.hash.search(/\?mode=/) > -1) {

    var mode = history.hash.split('?mode=')[1];
    //sometime this id gets append to the url
    if (mode.search(/_suid=/)>-1) {
      mode = mode.split('&_suid=')[0]
    }
    changeVisMode(mode);

  } else {
    //showSpinner("Rendering<br>Network");
    filter();
  }
}

function initalizeNetwork() {
  //if it has already been defined
  if (force == null) {
	  force = d3.layout.force()
      .size([$("#network").width() - 5, $("#network").height() - 5]);
  }

  networkNodeDrag = false;
  networkLargeNodeLimit = 20;

  force.gravity(0);
  force.charge(0);
  force.friction(0.2);

  if (vis == null) {
	  zoom = d3.behavior.zoom()
      .translate([0,0])
      .scale(0.99)
      .scaleExtent([0.25,6])	//how far it can zoom out and in
      .on("zoom", redraw);
	  
	  vis = d3.select("#network").append("svg:svg")
      .attr("width", $("#network").width() - 10)
      .attr("height", $("#network").height() - 10)
      .append('svg:g')
      .call(zoom);//.call(d3.behavior.zoom().scaleExtent([0.25, 6]).on("zoom", redraw)) //.call(d3.behavior.zoom().on("zoom", redraw))
	  
	  vis.append('svg:rect')
    //.attr('width', $("#network").width() + 1000)
    //.attr('height', $("#network").height() + 1000)
      .attr('width', $("#network").width())
      .attr('height', $("#network").height())
      .attr('id', 'zoomCanvas')
	  .on("mousedown", function() {
 	  //the grabbing css rules do not work with web-kit, so specifiy the cursor hand and use the css for firefox.
	  	d3.select("#zoomCanvas").style("cursor",  "url(menu/closedhand.png)");
        d3.select("#zoomCanvas").attr("class","grabbing");
       })
      .on("mouseup", function() {
        d3.select("#zoomCanvas").style("cursor",  "url(menu/openhand.png)");
        d3.select("#zoomCanvas").attr("class","");
       });
  }
  vis.attr("transform", "translate(" + trans + ")" + " scale(" + scale + ")");
}

//process the triple data through the RDF jquery plugin to create an object
function buildTripleStore(data) {

  tripleStore = $.rdf.databank([],
                               { base: 'http://www.dbpedia.org/',
                                 namespaces: {
                                   dc: 'http://purl.org/dc/elements/1.1/',
                                   foaf: 'http://xmlns.com/foaf/0.1/',
                                   lj: 'http://www.linkedjazz.org/lj/',
                                   aic: 'http://lv.artic.edu/ns#',
                                   rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                                   rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
                                   xml: 'http://www.w3.org/XML/1998/namespace',
                                   xsd: 'http://www.w3.org/2001/XMLSchema#'
                                 }
                               });


  // I'm only intrested in the knowsOf right now before we work more on verifying the 52nd street stuff, so just make all relationships knowsof
  var alreadyKnows = [];

  /***********
   *   The file we are loading is expected to be a triple store in the format '<object> <predicate> <object> .\n'
   *   Note the space after the final object and the '.' and the \n only
   ************/
  var triples = data.split("\n");
  for (x in triples) {
    if (triples[x].length > 0) {
      try{
        tripleStore.add(triples[x]);
      }
      catch (err) {
        //if it cannot load one of the triples it is not a total failure, keep going
        console.log('There was an error processing the data file:');
        console.log(err);
      }
    }
  }

  tripleObject = tripleStore.dump()
}

//process the triple data through the RDF jquery plugin to create an object
function buildDescriptionStore(data) {

  var descStore = $.rdf.databank([],
                                 { base: 'http://www.dbpedia.org/',
                                   namespaces: {
                                     dc: 'http://purl.org/dc/elements/1.1/',
                                     wc: 'http://www.w3.org/2000/01/rdf-schema',
                                     lj: 'http://www.linkedjazz.org/lj/' } });


  /***********
   *   The file we are loading is expected to be a triple dump in the format '<object> <predicate> <object> .\n'
   *   Note the space after the final object and the '.' and the \n only
   ************/
  var triples = data.split("\n");
  for (x in triples) {
    if (triples[x].length > 0) {
      try{
        descStore.add(triples[x]);
      }
      catch (err) {
        //if it cannot load one of the triples it is not a total failure, keep going
        console.log('There was an error processing the data file:');
        console.log(err);
      }
    }
  }

  descObject = descStore.dump()
}

//process the triple data through the RDF jquery plugin to create an object
function buildNameStore(data) {

  var nameStore = $.rdf.databank([],
                                 { base: 'http://www.dbpedia.org/',
                                   namespaces: {
                                     dc: 'http://purl.org/dc/elements/1.1/',
                                     wc: 'http://www.w3.org/2000/01/rdf-schema',
                                     lj: 'http://www.linkedjazz.org/lj/' } });

  /***********
   *   The file we are loading is expected to be a triple dump in the format '<object> <predicate> <object> .\n'
   *   Note the space after the final object and the '.' and the \n only
   ************/
  var triples = data.split("\n");
  for (x in triples) {
    if (triples[x].length > 0) {
      try{
        nameStore.add(triples[x]);
      }
      catch (err) {
        //if it cannot load one of the triples it is not a total failure, keep going
        console.log('There was an error processing the data file:');
        console.log(err);
      }
    }
  }

  nameObject = nameStore.dump();
}

function dataAnalysis() {

  //we need to know some stats about the people before we start to render the network
  //find out the largest nodes
  var totalConnections = 0;
  for (x in tripleObject) {	//each x here is a person

    var size = 0;
    for (y in tripleObject[x]) {		//this level is the types of relations, mentions, knows, etc. each y here is a realtion bundle
      size = size + tripleObject[x][y].length;
    }
    var sizeObj = {};
    sizeObj.node = x;
    sizeObj.size = size;
    sizeObj.random = Math.floor((Math.random()*100)+1);
    largestNodes.push(sizeObj);
    totalConnections = totalConnections + size;
  }

  //now an array of objects of with the .node property being the index to the tripleObect
  largestNodes.sort(function(a,b) {
    return b.size - a.size;
  });

  //find out the range of number of connections to color our edges
  edgesAvg = Math.floor(totalConnections/largestNodes.length);
  edgesInterval = (largestNodes[0].size - edgesAvg) / 3;
  console.log("edgesInterval: " + edgesInterval);

  var flipFlop = 0;
  //for (largeNode in largestNodes) {
  //	largestNodes[largeNode].flipFlop =  (flipFlop % 2 == 1) ?  (flipFlop*-1) : (flipFlop);
  for (var i = largestNodes.length - 1; i >= 0; i--) {
    largestNodes[i].flipFlop =  (flipFlop % 2 == 1) ?  (flipFlop*-1) : (flipFlop);
    flipFlop++;
  }
  largestNodes.splice(networkLargeNodeLimit,largestNodes.length-networkLargeNodeLimit);
  largestNodes.sort(function(a,b) {
    return b.flipFlop - a.flipFlop;
  });
}


//	Builds the base nodes and links arrays
function buildBase() {

  var allObjects = [];
  var quickLookup = {};

  //we need to establish the nodes and links
  //we do it by making a string array and adding their ids to it, if it is unique in the string array then we can add the object to the node array

  for (x in tripleObject) {	//each x here is a person
    if (allObjects.indexOf(String(x)) == -1) {
      allObjects.push(String(x));
      baseNodes.push({id: String(x)});
    }

    for (y in tripleObject[x])
    { //this level is the types of relations, mentions, knows, etc. each y here is a realtion bundle
      for (z in tripleObject[x][y]) { //here each z is a relation
        if (allObjects.indexOf(tripleObject[x][y][z].value) == -1) {

          baseNodes.push({id: tripleObject[x][y][z].value});
          allObjects.push(tripleObject[x][y][z].value);

          //we are adding props to this object to store their # of connections, depending on the order they may have already been added if they
          //were added by the creatLink function, so in both places check for the propery and add it in if it is not yet set

          if (!connectionCounter.hasOwnProperty(tripleObject[x][y][z].value)) {
            connectionCounter[tripleObject[x][y][z].value] = 0;
          }

          if (!quickLookup.hasOwnProperty(tripleObject[x][y][z].value)) {
            quickLookup[tripleObject[x][y][z].value] = -1;
          }

        }
        createLink(String(x),tripleObject[x][y][z].value,String(y));
      }
    }
  }

  //asign the number of connections each node has  and add the label
  for (aNode in baseNodes) {
    baseNodes[aNode].connections = connectionCounter[baseNodes[aNode].id];
    if (baseNodes[aNode].connections>largestConnection) {largestConnection = baseNodes[aNode].connections;}

    //build an human label
    var id = baseNodes[aNode].id;
    var label = "";

    if (nameObject.hasOwnProperty(id)) {
      if (nameObject[id]['http://xmlns.com/foaf/0.1/name']) {
        label = nameObject[id]['http://xmlns.com/foaf/0.1/name'][0].value;
      }
    }

    if (label == "") {
      label = $.trim(decodeURIComponent(baseNodes[aNode].id.split("/")[baseNodes[aNode].id.split("/").length-1]).replace(/\_/g,' '));
      if (label.search(/\(/) != -1) {
        label = label.substring(0,	label.indexOf("("));
      }
      label = $.trim(label);

    }

    idLookup[baseNodes[aNode].id] = encodeURIComponent(label.replace(/\s/g,"_"));

    baseNodes[aNode].label = label;

    //build a label lastname first
    label = label.split(" ");

    if (label[label.length-1].toLowerCase() == 'jr.' || label[label.length-1].toLowerCase() == 'jr' || label[label.length-1].toLowerCase() == 'sr.' || label[label.length-1].toLowerCase() == 'sr') {
      var lastLabel = label[label.length-2].replace(',','') + ' ' +  label[label.length-1] + ',';
      for (var i = 0; i <= label.length-2; i++) {
        lastLabel = lastLabel + ' ' + label[i].replace(',','');
      }
    } else {
      var lastLabel =  label[label.length-1] + ',';
      for(var i = 0; i <= label.length-2; i++) {
        lastLabel = lastLabel + ' ' + label[i].replace(',','');
      }
    }

    baseNodes[aNode].labelLast = lastLabel;
  }

  //we are building the similarity index here, basiclly it loops through all of the people and compairs their connections with everyone else
  //people who have similar connections have larger  simlarityIndex = the # of connections
  for (var key in connectionIndex) {
    var tmpAry = [];
    if (connectionIndex[key].length > 1) {
      for (var key2 in connectionIndex) {
        if (key != key2) {
          if (connectionIndex[key2].length > 1) {
            var tmpCount = 0;
            tmpCount =  connectionIndex[key].filter(function(i) {return !(connectionIndex[key2].indexOf(i) == -1);}).length;
            if (tmpCount>1) {
              tmpAry.push({name:key2,count:tmpCount})
              if (tmpCount>largestSimilarity) {largestSimilarity = tmpCount;}
            }
          }
        }
      }
    }
    tmpAry.sort(function(a,b) {
      return b.count - a.count;
    });

    simlarityIndex[key] = {};

    for (x in tmpAry) {
      simlarityIndex[key][tmpAry[x].name] = tmpAry[x].count;
    }
  }

  function createLink(id1, id2, pred) {
    var obj1 = null, obj2 = null;

    //in an effor to speed this lookup a little is to see if we have indexed the pos of the requested ids already, if so do not loop
    if (quickLookup[id1]>-1 && quickLookup[id2]>-1) {
      obj1 = quickLookup[id1];
      obj2 = quickLookup[id2];
    } else {
      //not yet in the quicklookup object, it will be added here
      for (q in baseNodes) {
        if (baseNodes[q].id == id1) {obj1 = q;}
        if (baseNodes[q].id == id2) {obj2 = q;}
        if (obj1 != null && obj2 != null) {
          quickLookup[id1] = obj1;
          quickLookup[id2] = obj2;

          break;
        }
      }
    }

    var customClass = "link_" + id1.split("/")[id1.split("/").length-1].replace(cssSafe,'');
    customClass = customClass + " link_" + id2.split("/")[id2.split("/").length-1].replace(cssSafe,'');

    baseLinks.push({source: baseNodes[obj1], target: baseNodes[obj2], distance: 5, customClass:customClass});

    //+1 the number of conenctions, of it is not yet in the object, add it at 1
    if (!connectionCounter.hasOwnProperty(id1)) {
      connectionCounter[id1] = 1;
    } else {
      connectionCounter[id1] = connectionCounter[id1] + 1;
    }
    if (!connectionCounter.hasOwnProperty(id2)) {
      connectionCounter[id2] = 1;
    } else {
      connectionCounter[id2] = connectionCounter[id2] + 1;
    }

    //add this relation ship to the connectionIndex object
    //has propery yet?
    if (!connectionIndex.hasOwnProperty(id1)) {
      connectionIndex[id1] = [];
    }
    if (!connectionIndex.hasOwnProperty(id2)) {
      connectionIndex[id2] = [];
    }

    //does it have this relationship already?
    if (connectionIndex[id1].indexOf(id2) == -1) {
      connectionIndex[id1].push(id2);
    }
    if (connectionIndex[id2].indexOf(id1) == -1) {
      connectionIndex[id2].push(id1);
    }

    //add this relationship to the relationIndex object
    //has propery yet?
    if (!relationIndex.hasOwnProperty(pred)) {
      relationIndex[pred] = [];
    }

    //does it have this relationship already?
    if (relationIndex[pred].indexOf(id1) == -1) {
      relationIndex[pred].push(id1);
    }
    if (relationIndex[pred].indexOf(id2) == -1) {
      relationIndex[pred].push(id2);
    }
  }
}

function filter(clear) {
  if (typeof clear == 'undefined') {clear = true;}

  //are we wiping the nodes out or just adding?
  if (clear) {
    //$("#network").css("visibility","hidden");
    vis.selectAll("g.node").remove();
    vis.selectAll("line.link").remove();

    nodes = [];
    links = [];
    force.nodes([]);
    force.links([]);
    //restart();
  }

  var workingNodes = [];
  var workingLinks = [];

  nodesRemove = {};

  if (visMode == 'person') {
    for (var key in connectionIndex) {
      if (connectionIndex[key].indexOf(usePerson) == -1 && key != usePerson) {
        nodesRemove[key] = true;
      }
    }
  }

  //now build the working arrays of the things we want to keep,
  for (aNode in baseNodes) {
    if (!nodesRemove.hasOwnProperty(baseNodes[aNode].id)) {
      workingNodes.push(baseNodes[aNode]);
    }
  }

  for (aLink in baseLinks) {
    if (nodesRemove.hasOwnProperty(baseLinks[aLink].source.id) == false && nodesRemove.hasOwnProperty(baseLinks[aLink].target.id) == false) {
      workingLinks.push(baseLinks[aLink]);
    }
  }

/*
    for (var i = nodesRemove.length - 1; i >= 0; i--) {
    nodes.splice(nodesRemove[i],1);
    }
    for (var i = linksRemove.length - 1; i >= 0; i--) {
      links.splice(linksRemove[i],1);
    }
*/

  //lock the large nodes to the pattern
  for (aNode in workingNodes) {
    workingNodes[aNode].lock = false;
    //workingNodes[aNode].y = visHeight / 2;
    workingNodes[aNode].x = Math.floor((Math.random()*visWidth)+1);
    if (visMode != "person") {
      for (large in largestNodes) {
        if (largestNodes[large].node == workingNodes[aNode].id) {
          workingNodes[aNode].lockX = largestNodes[large].x;
          workingNodes[aNode].lockY = largestNodes[large].y;
          workingNodes[aNode].lock = true;

        }
      }
    }

    if (visMode == "person" && workingNodes[aNode].id == usePerson) {
      usePersonIndex = aNode;
    }
    if (workingNodes[aNode].id == 'http://data.artic.edu/whistler/person/James_McNeill_Whistler') {
      whistlerPersonIndex = aNode;
    }
    if (workingNodes[aNode].id == 'http://data.artic.edu/whistler/person/Theodore_Casimir_Roussel') {
      roussellPersonIndex = aNode;
    }
  }

  //copy over our work into the d3 node/link array
  nodes = force.nodes();
  links = force.links();

  for (aNode in workingNodes) {
    nodes.push(workingNodes[aNode]);
  }
  for (aLink in workingLinks) {
    links.push(workingLinks[aLink]);
  }

  restart();
}

function restart() {

  vis.selectAll("line.link")
    .data(links)
    .enter().insert("line", "circle.node")
    .attr("class", function(d) {return "link " + d.customClass});
  //.attr("marker-end", function(d) { return  (visMode == "person"||visMode == "dynamic") ? "url(#FOAFknows)" : "none"; })
  /*.attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });*/

  var node = vis.selectAll("g.node")
      .data(nodes);

  var nodeEnter = node.enter().append("svg:g")
      .attr("class", "node")
      .attr("id", function(d) {  return "node_" + d.id.split("/")[d.id.split("/").length-1].replace(cssSafe,'')})
      .on("click",function(d) {
        //$("#network").fadeOut('fast',
        //                    function() {
        usePerson = d.id;
        changeVisMode("person");
        //                  }
        //               );
      });

  if (networkNodeDrag) {
    nodeEnter.call(force.drag);
  }

  nodeEnter.append("circle")
    .attr("id", function(d) {return "backgroundCircle_" + d.id.split("/")[d.id.split("/").length-1].replace(cssSafe,'');})
    .attr("class","backgroundCircle")
    .attr("r", function(d) { return  returnNodeSize(d); });

  nodeEnter.append("svg:image")
    .attr("id", function(d) {  return "imageCircle_" + d.id.split("/")[d.id.split("/").length-1].replace(cssSafe,'')})
    .attr("class","imageCircle")
    .attr("xlink:href", function(d) {
      var useId = $.trim(decodeURI(d.id).split("\/")[decodeURI(d.id).split("\/").length-1]);
      if (fileNames.indexOf(useId+'.png') == -1) {
        return "menu/whistler.png";
      } else {
        return "/image/round/" + useId+'.png';
      }
    })
    .attr("x", function(d) { return  (returnNodeSize(d)*-1); })
    .attr("y", function(d) { return  (returnNodeSize(d)*-1); })
    .attr("width", function(d) { return  (returnNodeSize(d)*2); })
    .attr("height", function(d) { return  (returnNodeSize(d)*2); });
	
	nodeEnter.append("svg:rect")
    .attr("id", function(d) {  return "circleTextRect_" + d.id.split("/")[d.id.split("/").length-1].replace(cssSafe,'')})
	.attr("rx", 6)
    .attr("ry", 6)
    .attr("class",  "circleTextRect");
	
	nodeEnter.append("svg:text")
    .attr("id", function(d) {  return "circleText_" + d.id.split("/")[d.id.split("/").length-1].replace(cssSafe,'')})
    .attr("class",  "circleText")
    .attr("x", function(d) { return  (returnTextLoc(d)*-0.1); })
    .attr("y", function(d) { return returnTextLoc(d)+returnTextLoc(d)/1.8; })
    .text(function(d) { return d.label; });

  	nodeEnter.selectAll(".circleTextRect")
    .attr("x", function(d) { return $("#" + "circleText_" + d.id.split("/")[d.id.split("/").length-1].replace(cssSafe,''))[0].getBBox().x; })
    .attr("y", function(d) { return $("#" + "circleText_" + d.id.split("/")[d.id.split("/").length-1].replace(cssSafe,''))[0].getBBox().y; })
    .attr("width", function(d) { return $("#" + "circleText_" + d.id.split("/")[d.id.split("/").length-1].replace(cssSafe,''))[0].getBBox().width; })
    .attr("height", function(d) { return $("#" + "circleText_" + d.id.split("/")[d.id.split("/").length-1].replace(cssSafe,''))[0].getBBox().height; });

  nodeEnter.append("svg:rect")
    .attr("id", function(d) {  return "labelRect_" + d.id.split("/")[d.id.split("/").length-1].replace(cssSafe,'')})
	.attr("rx", 6)
    .attr("ry", 6)
	.attr("class",  "labelRect");

  nodeEnter.append("svg:text")
    .attr("id", function(d) {  return "labelText_" + d.id.split("/")[d.id.split("/").length-1].replace(cssSafe,'')})
    .attr("class",  "labelText")
    .attr("x", function(d) { return  (returnTextLoc(d)*-0.1); })
    .attr("y", function(d) { return returnTextLoc(d)+returnTextLoc(d)/1.8+20; })
    .attr("visibility", "hidden")
    .text("ARTIST");

  nodeEnter.selectAll(".labelRect")
    .attr("x", function(d) { return $("#" + "labelText_" + d.id.split("/")[d.id.split("/").length-1].replace(cssSafe,''))[0].getBBox().x; })
    .attr("y", function(d) { return $("#" + "labelText_" + d.id.split("/")[d.id.split("/").length-1].replace(cssSafe,''))[0].getBBox().y; })
    .attr("width", function(d) { return $("#" + "labelText_" + d.id.split("/")[d.id.split("/").length-1].replace(cssSafe,''))[0].getBBox().width; })
    .attr("height", function(d) { return $("#" + "labelText_" + d.id.split("/")[d.id.split("/").length-1].replace(cssSafe,''))[0].getBBox().height; });

  for (aNode in nodes) {
    nodes[aNode].width = $("#" + "node_" + nodes[aNode].id.split("/")[nodes[aNode].id.split("/").length-1].replace(cssSafe,''))[0].	getBBox().width;
    nodes[aNode].height = $("#" + "node_" + nodes[aNode].id.split("/")[nodes[aNode].id.split("/").length-1].replace(cssSafe,''))[0].getBBox().height;

    nodes[aNode].x2 = nodes[aNode].x + nodes[aNode].width;
    nodes[aNode].y2 = nodes[aNode].y + nodes[aNode].height;

    if (visMode != 'person') {
      if (nodes[aNode].id == 'http://data.artic.edu/whistler/person/James_McNeill_Whistler') {
        nodes[aNode].x = visWidth/2 + 100;
        nodes[aNode].y = visHeight/2;
        nodes[aNode].fixed = true;
      }
      if (nodes[aNode].id == 'http://data.artic.edu/whistler/person/Theodore_Casimir_Roussel') {
        nodes[aNode].x = visWidth/2 - 100;
        nodes[aNode].y = visHeight/2;
        nodes[aNode].fixed = true;
      }
    }
    else {
      if (nodes[aNode].id == usePerson) {
        nodes[aNode].x = visWidth/2;
        nodes[aNode].y = visHeight/2;
        nodes[aNode].fixed = true;
      }
    }
  }

  //controls the movement of the nodes
  force.on("start", function(e) {
    if (visMode == "person") {
      nodes[usePersonIndex].x = visWidth/2;
      nodes[usePersonIndex].y = visHeight/2;
      nodes[usePersonIndex].fixed = true;
      showPopup(nodes[usePersonIndex]);
	  $("#title").hide();
	  $("#about").hide();
	  d3.selectAll("#filter_family, #filter_friends, #filter_colleagues, #filter_mentors, #filter_employers").style("visibility", "visible");
	  d3.selectAll("#network rect").style("fill", "white");
    }
  });

  force.start();

  force.on("tick", function(e) {
    // Collision detection stolen from: http://vallandingham.me/building_a_bubble_cloud.html
    dampenedAlpha = e.alpha * 0.1;
    jitter = 0.3;
    ratio = 2.77; // xy ratio

    vis.selectAll("g.node")
      .each(gravity(dampenedAlpha))
        .each(collide(jitter))
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")";});

    vis.selectAll("line.link")
      .attr("x1", function(d) { return d.source.x;})
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
  });
}

function gravity(alpha) {
  // start with the center of the display
  cx = visWidth / 2;
  cy = visHeight / 2;

  // use alpha to affect how much to push
  // towards the horizontal or vertical
  ax = alpha / 8;
  ay = alpha;

  // return a function that will modify the
  // node's x and y values
  return function(d) {
    d.x += (cx - d.x) * ax;
    d.y += (cy - d.y) * ay;
  };
}

function collide(jitter) {
  var collisionPadding = 4;
  // return a function that modifies
  // the x and y of a node
  return function(d) {
    nodes.forEach(function(d2) {
      // check that we aren't comparing a node
      // with itself
      if (d != d2) {
        // use distance formula to find distance
        //between two nodes
        x = d.x - d2.x;
        y = d.y - d2.y;
        distance = Math.sqrt(x * x + y * y);
        // find current minimum space between two nodes
        // using the width of the nodes
        minDistance = d.width*0.6 + d2.width*0.6 + collisionPadding;

        // if the current distance is less then the minimum
        // allowed then we need to push both nodes away from one another
        if (distance < minDistance) {
          // scale the distance based on the jitter variable
          distance = (distance - minDistance) / distance * jitter;
          // move our two nodes
          moveX = x * distance * ratio;
          moveY = y * distance;
          if (moveX == 0) { moveX = 1; }
          if (moveY == 0) { moveY = 1; }

          if ((visMode != 'person' && (d.id == 'http://data.artic.edu/whistler/person/James_McNeill_Whistler' || d.id == 'http://data.artic.edu/whistler/person/Theodore_Casimir_Roussel'))
             || (visMode == 'person' && (d.id == usePerson))) {
            d2.x += moveX * 2;
            d2.y += moveY * 2;
          }
          else if ((visMode != 'person' && (d2.id == 'http://data.artic.edu/whistler/person/James_McNeill_Whistler' || d2.id == 'http://data.artic.edu/whistler/person/Theodore_Casimir_Roussel'))
             || (visMode == 'person' && (d2.id == usePerson))) {
            d.x -= moveX * 2;
            d.y -= moveY * 2;
          }
          else {
            d.x -= moveX;
            d.y -= moveY;
            d2.x += moveX;
            d2.y += moveY;
          }
/*
          // Keep nodes within the bounds of the window
          // Left side
          if (d.x < d.width - collisionPadding/2) {
            d.x = d.width - collisionPadding/2;
          }
          // Right side
          if (d.x > visWidth - d.width/2 - collisionPadding) {
            d.x = visWidth - d.width/2 - collisionPadding;
          }
          // Top
          if (d.y < d.height - collisionPadding/2) {
            d.y = d.height - collisionPadding/2;
          }
          // Bottom
          if (d.y > visHeight - d.height - collisionPadding/2) {
            d.y = visHeight - d.height - collisionPadding/2;
          }*/
        }
      }
    });
  };
}

function returnNodeSize(d) {
  if (d.label == "James McNeill Whistler" || d.label == "Theodore Casimir Roussel") {
    return 15;
  } else {
    return 4;
  }
}

//replacing returnNodeSize for testing 2.10.ts
function returnTextLoc(d) {
  if (d.label == "James McNeill Whistler" || d.label == "Theodore Casimir Roussel") {
    return 20;
  } else {
    return 15;
  }
}

//wooo!, from https://groups.google.com/forum/?fromgroups#!topic/d3-js/ndyvibO7wDA
function pointsBetween(circle1,circle2,standOff1,standOff2) {
  var x1 = circle1.x, y1 = circle1.y,
      x2 = circle2.x, y2 = circle2.y,
      dx = x2-x1, dy = y2-y1,
      r1 = returnNodeSize(circle1) + (standOff1||0),
      r2 = returnNodeSize(circle2) + (standOff2||0);
  if ( (r1+r2)*(r1+r2) >= dx*dx+dy*dy ) return [[0,0],[0,0]];
  var a = Math.atan2(dy,dx), c = Math.cos(a), s = Math.sin(a);
  return [
    [x1+c*r1,y1+s*r1],
    [x2-c*r2,y2-s*r2]
  ];
}

function showPopup(d,cords) {
  if (!popupShown) {

    // Clear the popup
    jQuery('#popUp').empty();

    // Headshot
    var useId = $.trim(decodeURI(d.id).split("\/")[decodeURI(d.id).split("\/").length-1]);

    if (headshotFileNames.indexOf(useId+'.png') == -1) {
      var useImage = 'menu/no_headshot.png';
    } else {
      var useImage = '/image/headshot/' + useId+'.png'
    }

    jQuery('#popUp')
      .append(
        $("<a>")
          .attr("href", useImage)
          .attr("class", "cboxElement")
          .attr("title", "<h2>James McNeill Whistler</h2><h3>1876–1942</h3><p>In 1899 Addams entered Whistler’s Académie Carmen in Paris, where he remained a student until it closed in 1901. There he met his future wife Inez Eleanor Bate—the massière, or principle student—who actually admitted Adams to the school. Whistler took the unusual step of making both official apprentices, and they remained faithful followers. Whistler greatly influenced both Addams’s decision to work in the medium of etching and his subject matter, which centered on crowds and architecture.</p>")
          .append(
            $("<div>")
              .attr("class","popup-headshot-cont")
              .append(
                $("<img>")
                  .attr("src", useImage)
                  .attr("class","popup-headshot")
              )
          )
      );

    // Back
    jQuery('#popUp')
      .append(
        $('<a>')
          .attr("href", "/")
          .append(
            $("<div>")
              .attr("class", "popup-back")
              .text("BACK")
          )
      );

    // Name and dates
    jQuery('#popUp')
      .append(
        $("<h2>")
          .text("James McNeill Whistler")
      )
      .append(
        $("<h3>")
          .text("1876–1942")
      );

    // Metadata
    jQuery('#popUp')
      .append(
        $("<div>")
          .attr("class", "popup-metadata")
          .append(
            $("<img>")
              .attr("width", "20px")
              .attr("height", "4px")
              .attr("src", "menu/dash.png")
          )
          .append($("<br/>"))
          .append($("<p>").html("BIRTHPLACE<br/>Woodbury, New Jersey"))
          .append($("<p>").html("OCCUPATION<br/>Printmaker<br/>Painter"))
      );

    // Description
    jQuery('#popUp')
      .append(
        $("<div>")
          .attr("class", "popup-description")
          .append(
            $("<img>")
              .attr("width", "20px")
              .attr("height", "4px")
              .attr("src", "menu/dash.png")
          )
          .append($("<br/>"))
          .append($("<p>").html("In 1899 Addams entered Whistler’s Académie Carmen in Paris, where he remained a student until it closed in 1901. There he met his future wife Inez Eleanor Bate—the massière, or principle student—who actually admitted Adams to the school. Whistler took the unusual step of making both official apprentices, and they remained faithful followers. Whistler greatly influenced both Addams’s decision to work in the medium of etching and his subject matter, which centered on crowds and architecture."))
      );

    jQuery('#popUp')
      .append(
        $("<div>")
          .attr("class", "clear")
      );

    // Works
    jQuery('#popUp')
      .append(
        $("<div>")
          .attr("class", "popup-works")
          .append(
            $("<img>")
              .attr("width", "20px")
              .attr("height", "4px")
              .attr("src", "menu/dash.png")
          )
          .append($("<br/>"))
          .append($("<p>").html("WORKS"))
      );

    jQuery("#popUp")
      .css("left", "0px")
      .css("top", "0px");

    jQuery('.cboxElement').colorbox({transition:"fade", width:"75%", height:"75%", scrolling:false,
                                     onComplete:function () {
                                       jQuery('.cboxPhoto').attr('style','width:55%; height:auto; margin:100px');
                                       jQuery('.cboxPhoto').css({'float': 'right'});
                                     }});


    jQuery("#popUp").fadeIn(200);

    popupShown = true;
  }
}

function highlightText(text, uris) {

  for (var n in uris) {
    var uri = uris[n];

    if (nameObject[uri]) {
      if (nameObject[uri]['http://xmlns.com/foaf/0.1/name']) {
        var name = nameObject[uri]['http://xmlns.com/foaf/0.1/name'][0]['value'];
        var re = new RegExp(name,"gi");

        text = text.replace(re,'<span class="highlight">' + name + '</span>' );
      }
    }
  }

  return text;
}

function changeVisMode(changeTo) {

  if (rendering)
    return false;

  rendering = true;

  if (changeTo == "person") {
    History.pushState({state:idLookup[usePerson]}, "Person Mode", "?person=" + idLookup[usePerson]);
  } else {
    History.pushState({state:changeTo}, changeTo +" Mode", "?mode=" + changeTo);
  }

  visMode = changeTo;

  //$("#network").fadeOut(function() {

  //$("#network").css("visibility","hidden");

  //showSpinner("Rendering<br>Network");
  initalizeNetwork();

  //we need to rest the zoom/pan
  zoom.translate([0,0]).scale(1);
  vis.attr("transform", "translate(" + [0,0] + ")"  + " scale(" + 1 + ")");

  zoomWidgetObjDoZoom = false;
  zoomWidgetObj.setValue(0,0.255555555);

  filter();

  rendering = false;
  //});
}

function hideRelations() {
  var fill = "black";
  d3.selectAll(".marker").attr("stroke-opacity",1).attr("fill-opacity",1)
  d3.selectAll(".marker path").style("fill", fill);
  d3.selectAll(".backgroundCircle").attr("fill-opacity",1).attr("stroke-opacity",1).style("fill", fill).style("stroke", fill);
  d3.selectAll(".imageCircle").attr("display","block");
  d3.selectAll(".circleText").attr("fill-opacity",1).attr("stroke-opacity",1);
  d3.selectAll(".circleTextRect").attr("fill-opacity",1).attr("stroke-opacity",1).style("fill", fill).attr("stroke", fill);
  d3.selectAll(".labelText").attr("fill-opacity",1).attr("stroke-opacity",1);
  d3.selectAll(".labelRect").attr("fill-opacity",1).attr("stroke-opacity",1).style("fill", fill).attr("stroke", fill);
  d3.selectAll(".link").attr("stroke-opacity",1).style("fill-opacity",1).style("fill", fill).style("stroke", fill);
}

function showRelations(rel) {

  // First we grey out everything
  var fill = "black";
  d3.selectAll(".backgroundCircle").attr("fill-opacity",0.03).attr("stroke-opacity",0.03).style("fill", fill).style("stroke", fill);
  d3.selectAll(".circleText").attr("fill-opacity",0.03).attr("stroke-opacity",0.03);
  d3.selectAll(".circleTextRect").attr("fill-opacity",0.03).attr("stroke-opacity",0.03).style("fill", fill).attr("stroke", fill);
  d3.selectAll(".labelText").attr("fill-opacity",0.03).attr("stroke-opacity",0.03);
  d3.selectAll(".labelRect").attr("fill-opacity",0.03).attr("stroke-opacity",0.03).style("fill", fill).attr("stroke", fill);
  d3.selectAll(".imageCircle").attr("display","none");
  d3.selectAll(".link").attr("stroke-opacity",0.03).attr("fill-opacity",0.03).style("fill", fill).style("stroke", fill);

  // Which predicates to show
  var relationsToShow = [];
  if (rel == "friends") {
    relationsToShow.push("http://data.artic.edu/whistler/predicate/is_friend_of");
    fill = "#E9967A";
  }
  else if (rel == "family") {
    relationsToShow.push("http://data.artic.edu/whistler/predicate/is_relative_of");
    relationsToShow.push("http://data.artic.edu/whistler/predicate/is_spouse_of");
    fill = "#E9967A";
  }
  else if (rel == "colleagues") {
    relationsToShow.push("http://data.artic.edu/whistler/predicate/is_colleague_of");
    fill = "#E9967A";
  }
  else if (rel == "mentors") {
    relationsToShow.push("http://data.artic.edu/whistler/predicate/is_student_of");
    relationsToShow.push("http://data.artic.edu/whistler/predicate/is_teacher_of");
    fill = "#E9967A";
  }
  else if (rel == "employers") {
    relationsToShow.push("http://data.artic.edu/whistler/predicate/is_master_of");
    relationsToShow.push("http://data.artic.edu/whistler/predicate/is_assistant_to");
    relationsToShow.push("http://data.artic.edu/whistler/predicate/is_artist_of");
    relationsToShow.push("http://data.artic.edu/whistler/predicate/is_model_for");
    fill = "#E9967A";
  }

  var nodesShown = [];

  // Show circles and names
  for (var r in relationsToShow) {
    var rx = relationsToShow[r];
    for (var e in relationIndex[rx]) {
      var id = relationIndex[rx][e].split("/")[relationIndex[rx][e].split("/").length-1].replace(cssSafe,'');
      d3.selectAll("#backgroundCircle_" + id).attr("fill-opacity",1).attr("stroke-opacity",1).style("fill", fill).style("stroke", fill);
      d3.selectAll("#imageCircle_"+ id).attr("display","block").style("fill", fill).attr("stroke", fill);
      d3.selectAll("#circleText_"+ id).attr("fill-opacity",1).attr("stroke-opacity",1);
      d3.selectAll("#circleTextRect_"+ id).attr("fill-opacity",1).attr("stroke-opacity",1).style("fill", fill).attr("stroke", fill);
      d3.selectAll("#labelText_"+ id).attr("fill-opacity",1).attr("stroke-opacity",1);
      d3.selectAll("#labelRect_"+ id).attr("fill-opacity",1).attr("stroke-opacity",1).style("fill", fill).attr("stroke", fill);
      d3.selectAll(".marker path").style("fill", fill);
      nodesShown.push(id);
    }
  }

  // Now show all the lines between all the nodes that we've shown
  for (var n in nodesShown) {
    for (var m in nodesShown) {
      if (nodesShown[n] != nodesShown[m]) {
        d3.selectAll(".link_" + nodesShown[n] + ".link_" + nodesShown[m]).attr("stroke-opacity",1).style("fill-opacity",1).style("stroke-width",2).style("fill", fill).style("stroke", fill);
      }
    }
  }
}

//build the intial list used for dynamic mode
function buildDynamicList() {

  var listNodes = baseNodes;
  listNodes.sort(function(a,b) {
    var nameA = a.labelLast.toLowerCase(), nameB = b.labelLast.toLowerCase()
    if (nameA < nameB) //sort string ascending
      return -1
    if (nameA > nameB)
      return 1
    return 0 //default return value (no sorting)
  });

  var domFragment = $("<div>");

  for (x in listNodes) {
    var id_css = listNodes[x].id.split("/")[listNodes[x].id.split("/").length-1].replace(cssSafe,'');
    var id_img = $.trim(decodeURI(listNodes[x].id).split("\/")[decodeURI(listNodes[x].id).split("\/").length-1]);

    var descText = '';
    // if (descObject.hasOwnProperty(listNodes[x].id)) {
    //  var desc = descObject[listNodes[x].id]['http://www.w3.org/2000/01/rdf-schema#comment'][0].value;
    //  var r = /\\u([\d\w]{4})/gi;
    //  desc = desc.replace(r, function (match, grp) {
    //    return String.fromCharCode(parseInt(grp, 16)); } );
    //  desc = unescape(desc);
    //  descText = decodeURIComponent(desc);
    //  descText = descText.replace(/&ndash;/gi,'-');
    //  descText = descText.replace(/&amp;/gi,'&');
    // }

    if (descObject[listNodes[x].id]) {
      if (descObject[listNodes[x].id]['http://dbpedia.org/ontology/abstract']) {
        var desc = descObject[listNodes[x].id]['http://dbpedia.org/ontology/abstract'][0].value;
        var r = /\\u([\d\w]{4})/gi;
        desc = desc.replace(r, function (match, grp) {
          return String.fromCharCode(parseInt(grp, 16)); } );
        desc = unescape(desc);
        descText = decodeURIComponent(desc);
        descText = descText.replace(/&ndash;/gi,'-');
        descText = descText.replace(/&amp;/gi,'&');

        var link = listNodes[x].id.replace('dbpedia','wikipedia').replace('resource','wiki');

        descText = descText.substring(0,250) + '...' + '<br>' + '<a class="popup-link" target="_blank" href="' + link + '">From Wikipedia</a><br><br>';
      } else {
        descText = "";
      }
    }

    domFragment.append
    (
      $("<div>")
        .attr("id","dynamic_" + id_css)
        .addClass("dynamicListItem")
        .data("label",listNodes[x].labelLast)
        .data("id",listNodes[x].id)
        .click(function() { if (dynamicPeople.indexOf($(this).data("id")) == -1) {usePerson = $(this).data("id"); dynamicPeople.push(usePerson); filter();}})
        .append
      (
        $("<img>")
          .attr("src",function()
                {

                  if (fileNames.indexOf(id_img+'.png') != -1) {
                    return "/image/round/" + id_img+'.png';
                  } else {
                    return "";
                  }
                })
          .css("visibility",function()
               {
                 if (fileNames.indexOf(id_img+'.png') != -1) {
                   return "visible"
                 } else {
                   return "hidden"
                 }
               })
      )
        .append
      (
        $("<div>")
          .text(listNodes[x].labelLast)
          .attr("title", descText)

      )
    )
  }

  window.orginalDynamicListFragment = domFragment;
}

function dynamicFilterList() {

  var searchTerm = $("#dynamicSearchInput").val().toLowerCase();

  $(".dynamicListItem").each(function() {

    if ($(this).data("label").toLowerCase().indexOf(searchTerm) == -1) {
      $(this).css("display","none");
    } else {
      $(this).css("display","block");
    }
  });
}

//zoom/pan function called by mouse event
function redraw(useScale) {
  //store the last event data
  trans = d3.event.translate;
  scale = d3.event.scale;

  if (scale > 2) {
    //console.log(trans);
    //console.log(scale);
    d3.selectAll(".backgroundCircle").style("fill", "#ffffff");
    d3.selectAll(".imageCircle").transition(800).style("opacity",1).attr("visibility","visible");
  }
  if (scale > 3) {
    d3.selectAll(".labelText").transition(800).style("opacity",1).attr("visibility","visible");
    d3.selectAll(".labelRect").transition(800).style("opacity",1).attr("visibility","visible");
  }


  //transform the vis
  vis.attr("transform",
           "translate(" + trans + ")"
           + " scale(" + scale + ")");
  y = 1/trans[1] + scale*.6;
  d3.selectAll(".circleText").attr("transform",
                                   "translate(" + 1/trans[0] + " " + y + ")"
                                   + " scale(" + 1/scale + ")");
  d3.selectAll(".circleTextRect").attr("transform",
                                       "translate(" + 1/trans[0] + " " + y + ")"
                                       + " scale(" + 1/scale + ")");
  d3.selectAll(".labelText").attr("transform",
                                  "translate(" + 1/trans[0] + " " + y + ")"
                                  + " scale(" + 1/scale + ")");
  d3.selectAll(".labelRect").attr("transform",
                                  "translate(" + 1/trans[0] + " " + y + ")"
                                  + " scale(" + 1/scale + ")");

  //we need to update the zoom slider, set the boolean to false so the slider change does not trigger a zoom change in the vis (from the slider callback function)
  zoomWidgetObjDoZoom = false;
  zoomWidgetObj.setValue(0,(scale/4));
}

function showSpinner(text) {

  $("#spinner").css("left",($("#network").width()/2 ) - 65 + "px");
  $("#spinner").css("top", ($("#network").height()/2 ) - 65 + "px");
  $("#spinner").css("display","block");
  $("#spinner span").html(text);
}

function hideSpinner() {
  $("#spinner").css("display","none");
}

function windowResize() {

  visWidth = $(window).width();
  visHeight = $(window).height();
  if (visMode == "person") {
    visWidth -= 540;
    $("#network").css('float', 'right');
  }
  $("#network").css('width', visWidth + 'px');
  $("#network").css('height',visHeight + 'px');
}
