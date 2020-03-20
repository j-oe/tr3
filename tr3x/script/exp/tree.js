/*
experimental d3 visualisation

##################################
Hallo Herr Ziegler,
wenn Sie andere Visualisierungen ausprobieren möchten, dann jeweils einen dieser Befehle in die
Browser-Konsole (z.B. von Google Chrome) eingeben:
 - tree()
 - force()
 - network()
 - fdtree()
und  die letzte Zeile dieser Datei auskommentieren.
*/

//
// tree
//

tree = function () { 

var margin = {top: 20, right: 20, bottom: 20, left: 220},
    width = 2200 - margin.right - margin.left,
    height = 1200 - margin.top - margin.bottom;
    
var i = 0,
    duration = 750,
    root;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var svg = d3.select(".app-tree").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.xml("src/tr3.xml", function(error, doc) {
  tr3 = d3.select(doc).select('tr3')[0][0];
  root = getJXONTree(tr3);
  root.x0 = height / 2;
  root.y0 = 0;

  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  //root.children.forEach(collapse);
  update(root);
});

d3.select(self.frameElement).style("height", "800px");

function update(source) {

  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse(),
      links = tree.links(nodes);
      console.log(nodes);

  // Normalize for fixed-depth.
  //nodes.forEach(function(d) { d.y = d.depth * 180; });

  // Update the nodes…
  var node = svg.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .on("click", click);

  nodeEnter.append("circle")
      .attr("r", 1e-6)
      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeEnter.append("text")
      .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .text(function(d) { if(d.out) { return d.out.substr(0,26) + '...'} })
      .style("fill-opacity", 1e-6);

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

  nodeUpdate.select("circle")
      .attr("r", 4.5)
      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeUpdate.select("text")
      .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .remove();

  nodeExit.select("circle")
      .attr("r", 1e-6);

  nodeExit.select("text")
      .style("fill-opacity", 1e-6);

  // Update the links…
  var link = svg.selectAll("path.link")
      .data(links, function(d) { return d.target.id; });


  // Enter any new links at the parent's previous position.
  link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal({source: o, target: o});
      });



  // var labels = svg.selectAll("path.link").data(links);
  // link.enter().append("g").attr("class", "linklabelholder")
  //    .append("text")
  //    .attr("x", function(d) { return (d.source.x + px) / 2; })
  //    .attr("y", function(d) { return (d.source.y + py) / 2; })
  //    .attr("text-anchor", "middle")
  //    .text(function(d) { return d.source.in; });

  // Transition links to their new position.
  link.transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {x: source.x, y: source.y};
        return diagonal({source: o, target: o});
      })
      .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

// Toggle children on click.
function click(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update(d);
}
}

//
// force
//

force = function () { 

var width = 2000,
    height = 1000,
    root;

var force = d3.layout.force()
    .linkDistance(80)
    .charge(-120)
    .gravity(.05)
    .size([width, height])
    .on("tick", tick);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(100, 20)");

var link = svg.selectAll(".link"),
    node = svg.selectAll(".node");

d3.xml("src/tr3.xml", function(error, doc) {
  tr3 = d3.select(doc).select('tr3')[0][0];
  root = getJXONTree(tr3);
  update();
});

function update() {
  var nodes = flatten(root),
      links = d3.layout.tree().links(nodes);

  // Restart the force layout.
  force
      .nodes(nodes)
      .links(links)
      .start();

  // Update links.
  link = link.data(links, function(d) { return d.target.id; });

  link.exit().remove();

  link.enter().insert("line", ".node")
      .attr("class", "link");

  // Update nodes.
  node = node.data(nodes, function(d) { return d.id; });

  node.exit().remove();

  var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .on("click", click)
      .call(force.drag);

  nodeEnter.append("circle")
      .attr("r", function(d) { return Math.sqrt(d.size) / 10 || 4.5; });

  nodeEnter.append("text")
      .attr("dy", ".35em")
      .text(function(d) { return d.out; });

  node.select("circle")
      .style("fill", color);
}

function tick() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
}

function color(d) {
  return d._children ? "#3182bd" // collapsed package
      : d.children ? "#c6dbef" // expanded package
      : "#fd8d3c"; // leaf node
}

// Toggle children on click.
function click(d) {
  if (d3.event.defaultPrevented) return; // ignore drag
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update();
}

// Returns a list of all nodes under the root.
function flatten(root) {
  var nodes = [], i = 0;

  function recurse(node) {
    if (node.children) node.children.forEach(recurse);
    if (!node.id) node.id = ++i;
    nodes.push(node);
  }

  recurse(root);
  return nodes;
}

}

//
// network
//

network = function () { 


var w = 1200,
    h = 800,
    maxNodeSize = 50,
    root;
 
var vis;
var force = d3.layout.force(); 

vis = d3.select("body").append("svg");
 
d3.xml("src/tr3.xml", function(error, doc) {
  
  tr3 = d3.select(doc).select('tr3')[0][0];
  root = getJXONTree(tr3);
  root.fixed = true;
  root.x = w / 2;
  root.y = 120;
 
 
        // Build the arrow
  var defs = vis.insert("svg:defs").selectAll("marker")
      .data(["end"]);
 
 
  defs.enter().append("svg:marker")
      .attr("id", "end")               // As explained here: http://www.d3noob.org/2013/03/d3js-force-directed-graph-example-basic.html
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
    .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");
 
     update();
});
  
function update() {
  var nodes = flatten(root),
      links = d3.layout.tree().links(nodes);
 
  // Restart the force layout.
  force.nodes(nodes)
        .links(links)
        .gravity(0.05)
    .charge(-150)
    .linkDistance(500)
    .friction(0.5)
    .linkStrength(function(l, i) {return 1; })
    .size([w, h])
    .on("tick", tick)
        .start();
 
   var path = vis.selectAll("path.link")
      .data(links, function(d) { return d.target.id; });
 
    path.enter().insert("svg:path")
      .attr("class", "link")
      .attr("marker-end", "url(#end)")
      .style("stroke", "#ccc");
 
 
  // Exit any old paths.
  path.exit().remove();
 
 
 
  // Update the nodes…
  var node = vis.selectAll("g.node")
      .data(nodes, function(d) { return d.id; });
 
 
  // Enter any new nodes.
  var nodeEnter = node.enter().append("svg:g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .on("click", click)
      .call(force.drag);
 
  // Append a circle
  nodeEnter.append("svg:circle")
      .attr("r", function(d) { return Math.sqrt(d.size) / 10 || 4.5; })
      .style("fill", color);
 
  // Add text to the node (as defined by the json file) 
  nodeEnter.append("svg:text")
      .attr("text-anchor", "middle")
      .attr("dx", function(d) { return Math.sqrt(d.size) / 10 || 4.5; })
      .attr("dy", ".35em")
      .text(function(d) { return d.out; });
 
  // Exit any old nodes.
  node.exit().remove();
 
 
  // Re-select for update.
  path = vis.selectAll("path.link");
  node = vis.selectAll("g.node");
 
function tick() {
 
 
    path.attr("d", function(d) {
 
     var dx = d.target.x - d.source.x,
           dy = d.target.y - d.source.y,
           dr = Math.sqrt(dx * dx + dy * dy);
           return   "M" + d.source.x + "," 
            + d.source.y 
            + "A" + dr + "," 
            + dr + " 0 0,1 " 
            + d.target.x + "," 
            + d.target.y;
  });
    node.attr("transform", nodeTransform);    
  }
}
 
 
 
 
/**
 * Gives the coordinates of the border for keeping the nodes inside a frame
 * http://bl.ocks.org/mbostock/1129492
 */ 
function nodeTransform(d) {
  d.x =  Math.max(maxNodeSize, Math.min(w - (d.logowidth/2 || 16), d.x));
    d.y =  Math.max(maxNodeSize, Math.min(h - (d.logoheight/2 || 16), d.y));
    return "translate(" + d.x + "," + d.y + ")";
   }
 
/**
 * Color leaf nodes orange, and packages white or blue.
 */ 
function color(d) {
  return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
}
 
/**
 * Toggle children on click.
 */ 
function click(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
 
  update();
}
 
 
/**
 * Returns a list of all nodes under the root.
 */ 
function flatten(root) {
  var nodes = []; 
  var i = 0;
 
  function recurse(node) {
    if (node.children) 
      node.children.forEach(recurse);
    if (!node.id) 
      node.id = ++i;
    nodes.push(node);
  }
 
  recurse(root);
  return nodes;
} 

} 

//
// fdtree
//

fdtree = function () {

var w = 2000,
    h = 1000,
    r = 6,
    fill = d3.scale.category20();

var force = d3.layout.force()
    .charge(-120)
    .linkDistance(30)
    .size([w, h]);

var svg = d3.select(".app-tree").append("svg:svg")
    .attr("width", w)
    .attr("height", h);

d3.xml("src/tr3.xml", function(error, doc) {
  tr3 = d3.select(doc).select('tr3')[0][0];
  root = getJXONTree(tr3);
  
  json = {};

  json.nodes = flatten(root);
  json.links = d3.layout.tree().links(json.nodes);
  console.log(json.nodes);


  var link = svg.selectAll("line")
      .data(json.links)
    .enter().append("svg:line")
      .style("stroke", "#ccc");;

  var node = svg.selectAll("circle")
      .data(json.nodes)
    .enter().append("svg:circle")
      .attr("r", r - .75)
      .style("fill", function(d) { return fill(d.group); })
      .style("stroke", function(d) { return d3.rgb(fill(d.group)).darker(); })
      .call(force.drag);

  force
      .nodes(json.nodes)
      .links(json.links)
      .on("tick", tick)
      .start();

  function tick(e) {

    // Push sources up and targets down to form a weak tree.
    var k = 6 * e.alpha;
    json.links.forEach(function(d, i) {
      d.source.y -= k;
      d.target.y += k;
    });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });

    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
  }

  function flatten(root) {
    var nodes = []; 
    var i = 0;
   
    function recurse(node) {
      if (node.children) 
        node.children.forEach(recurse);
      if (!node.id) 
        node.id = ++i;
      nodes.push(node);
    }
   
    recurse(root);
    return nodes;
  } 
});

}

tree();