/* 
 tr3x.js
 tree explorer
 2014, Jan Oevermann
*/

// set global application object
window.tr3x = {

  init: function () {
    // get default values
    tr3x.title = d3.select('body').attr('data-title');
    tr3x.zoom = d3.select('#app-zoom').property('value');              // zoom value of range input (should be same as default scale) 
    tr3x.scale = d3.select('.app-tree').attr('data-scale');            // scale value of generated svg (should be 30)
    tr3x.root = d3.select('.tr3')[0][0].parentNode.getAttribute('id'); // traversing to parent of .tr3
    
    // build ui
    tr3x.buildUI();
    // build index
    tr3x.buildIndex();
    // bind handlers
    tr3x.bindEvents();
    // generate error report
    tr3x.generateErrorReport();
    // generate tree stats
    tr3x.generateTreeStats();
    // jump to root position
    tr3x.jumpToNode(tr3x.root);
  },

  buildUI: function () {
    // write title of browser window
    document.title = tr3x.title;
    // write sidebar header
    d3.select('.app-heading').html(tr3x.title);

    // make sub panels minimizable
    d3.selectAll('.app-sub').each(function () {
      // add a trigger to each sub panel
      _trigger = document.createElement('span');
      this.appendChild(_trigger);
    });

    // localize to German
    tr3x.localizeUI('de'); 
  },

  bindEvents: function () {
    // bind click handler on title to jump to root node
    d3.select('.app-heading').on('click', function(){
      tr3x.jumpToNode(tr3x.root);
    });

    // bind click handler on title to jump to root node
    d3.selectAll('.app-sub span').on('click', function(){
      tr3x.toggleSubPanel(this);
    });
    
    // bind click handler on all clickable nodes (rects, texts)
    d3.selectAll('.svg-node')
      .on('click', function(){
        _node = this; // clicked node is context
        _mode = d3.select('input[type="radio"]:checked').attr('value'); // current application mode 
        switch (_mode) {  // switch actions dependent on application mode
          case "info":
            tr3x.setNodeActive(_node);      // highlight the clicked node
            tr3x.generateNodeInformation(_node); // gather node information and execute setNodeInformation()
            tr3x.showContentPreview(_node); // load external content in preview panel
            break;
          case "collapse": 
            tr3x.toggleNodeState(_node);        // collapse/expand all child nodes dependent on current state
            break;
        }
      });

    // bind change handler on change for zoom functionality
    d3.select('#app-zoom')
      .on('change', function() {
        // value from user input
        tr3x.zoom = d3.select('#app-zoom').property('value');
        // zoom svg canvas
        tr3x.zoomCanvas(tr3x.zoom);
      });

    // bind change handler on 'show links' checkbox
    d3.select('#app-links')
      .on('change', function() {
        // zoom svg canvas
        tr3x.toggleLinks();
      });  

    // bind change handler on search field
    d3.select('#app-search')
    .on('keyup', function() {
      // get search field input
      _term = d3.select(this).property('value');
      // start searching th eindex
      tr3x.searchNodeText(_term);
    });
  },

  buildIndex: function () {
    // index all nodes for faster searching
    tr3x.nodes = [];
    d3.selectAll('g.svg-node').each(function() {
      _text = d3.select(this).attr('title'); // get node text
      _id = d3.select(this).attr('id');      // get node id
      // push nodes to array
      tr3x.nodes.push({  
        'text': _text,
        'id': _id
      });
    });
  },

  setNodeActive: function (node) {
    d3.selectAll('.svg-node').classed('active', false);
    d3.select(node).classed('active', true);
  },

  generateNodeInformation: function (node) {
    // get basic properties
    _id = d3.select(node).attr('id');                 // contains generate-id value or custom id
    _title = d3.select(node).attr('title');           // contains full text (not shortened version vor svg)

    // get number of all descendants of current node
    _descendants = tr3x.getNodeDescendantsCount(_id);
    // get all possible paths that are possible from that node (including resolved links) and generate links
    _choices = tr3x.getNodeChoices(_id);
    // get parent node and generate link
    _parent = tr3x.getNodeParent(node);
    // get node type 
    _type = tr3x.getNodeType(node);
    // get tr3-class of node (altering front end interpretation)
    _class = tr3x.getNodeClass(node);
    // get additional attributes if available (note: only possible for links by now)
    _additional = tr3x.getNodeAdditionals(node);

    // write all information to panel
    tr3x.writeNodeInformation(_title, _descendants, _type, _choices, _additional, _tr3classes, _parent);
  },

  generateErrorReport: function () {
    // get total errors
    _errors = [];
    _report = "";

    // select all error nodes by class (error classes from transformation) and push them to array
    d3.selectAll('text.tr3-error:not(.copy)').each(function() { 
      _text = d3.select(this).text();
      _id = d3.select(this.parentNode).attr('id');
      _errors.push({'text': _text, 'id': _id});
    });

     // select all faulty answers (no label on connection)
    d3.selectAll('.svg-connection').each(function() { 
      _label = d3.select(this).text();
      if (_label == ''){
        _id = d3.select(this).attr('class').split(' ')[0].split('c-to-')[1];
        _text = '[error] no label for connection';
        _errors.push({'text': _text, 'id': _id});
      }
    });

    // small hack for uniqueness of array when handling copied nodes
    _unique = {};
    for (var u = 0; u < _errors.length; u++){
      // builiding an temporary object with attribute 'id' as key forces the id to be unique
      _unique[_errors[u]['id']] = _errors[u];   
    }  
    _errors = []; // delete alle entries of array
    for (key in _unique){
      _errors.push(_unique[key]); // push unique entries back to array
    }

    // make errors public
    tr3x.errors = _errors;

    // indicate error level
    if (_errors.length == 0) {
      _errlevel = '<div class="indicator good"></div><div>' + tr3x.l.noerrors + '</div>';
    } else {
      _errlevel = '<div class="indicator bad"></div><div>' + _errors.length + ' ' + tr3x.l.nrerrors + ':</div>';
      // for each error generate description and link
      for (var i = 0; i < _errors.length; i++) {
        _report += "<p onclick=tr3x.jumpToNode('" + _errors[i].id + "')>" + _errors[i].text + " (ID:" + _errors[i].id  + ")</p>";
      }
    } 

    // write to panel
    d3.select('.app-report').html(_errlevel + _report);
  },

  generateTreeStats: function () {
    // get stats over tree
    _leafs = [];
    // get all paths by selecting leafs and d-of-classes (shows descendants)
    d3.selectAll('rect.leaf').each(function(){
      _id = d3.select(this.parentNode).attr('id');
      _text = d3.select(this.parentNode).select('text').text(); 
      _classes = d3.select(this).attr('class').split(' ');
      // filter classes with regular expression to get descendants (descs)
      _descs = _classes.filter(function(item){
        return /d-of-\w*/.test(item);
      });
      // push id and filtered results to array
      _leafs.push({'id': _id, 'descs': _descs, 'text': _text});
    });
    
    // make array public for debugging purposes
    tr3x.leafs = _leafs;

    // build array with path lengths
    // NOTE: these path lenghts do not follow links, because there 
    //       could be a possible recursion loop. Therefore the numbers
    //       are NOT accurate for trees that use a lot of links
    _paths = [];
    for (var p = 0; p < _leafs.length; p++){
      _paths.push(_leafs[p].descs.length)
    }

    // global stats object
    tr3x.stats = {};
    // count all nodes
    tr3x.stats.total = tr3x.nodes.length;
    tr3x.stats.leafs = tr3x.leafs.length;
    // count copied nodes
    tr3x.stats.copied = d3.selectAll('rect.copy')[0].length;
    // calculate maximum and minimum
    tr3x.stats.max = Math.max.apply(Math, _paths);
    tr3x.stats.min = Math.min.apply(Math, _paths);
    // calculate average by dividing sum and length
    _sum = 0;
    for (var q = 0; q < _paths.length; q++){
      _sum += _paths[q];
    }
    // calculate reuse factor
    tr3x.stats.reuse = Math.round(tr3x.stats.copied / tr3x.stats.total * 1000) / 10;
    // get whole number or .5 by rounding doubled value and dividing by 2
    tr3x.stats.avg = Math.round(_sum / _paths.length * 2) / 2; 
    
    // write stats
    _stats = tr3x.l.pathlength + ': ø ' + tr3x.stats.avg + ' (+' + tr3x.stats.max + ' / -' + tr3x.stats.min + ')<br/>' + 
             tr3x.l.totalnodes + ': ' + tr3x.stats.total + ' / ' + tr3x.l.leafnodes + ': ' + tr3x.stats.leafs;
    // show reuse factor only if copied nodes are present
    if (tr3x.stats.copied > 0) {
      _stats += '<br/>' + tr3x.l.reusefactor + ': ' + tr3x.stats.reuse + '%';
    } 
             
    d3.select('.app-stats').html(_stats);
  },

  // zoom the svg canvas corresponding to user input
  zoomCanvas: function (zoom) {
    // init values from transformation
    _maxlevel = d3.select('.app-tree').attr('data-maxlevel');
    _maxwidth = d3.select('.app-tree').attr('data-maxwidth');
    // element anchors
    _svg = d3.select('svg');
    _main = d3.select('#main');
    // set new attributes
    _main.attr('transform', 'translate(' + (tr3x.zoom * 2) + ',' + (tr3x.zoom / 2) + ') scale(' + tr3x.zoom + ')');
    _svg.attr('width', (_maxwidth * tr3x.zoom * 4.5) + 'mm');
    _svg.attr('height', (_maxlevel * tr3x.zoom) + 'mm');
  },


  // convenience function to jump to a specific element position 
  jumpToNode: function (id) {
    _s = (tr3x.zoom) ? tr3x.zoom : tr3x.scale; // get scale (either default or user value)
    _x = d3.select('#' + id + ' rect').attr('x'); // get position on x-axis
    _y = d3.select('#' + id + ' rect').attr('y'); // get position on y-axis

    d3.select("body").transition().duration(1000)
        .tween("scrollLeft", tr3x.scrollLeftTween((_x * _s) - (2 * _s))) // do a transition to the calculated position on screen (scale * value) 
        .tween("scrollTop", tr3x.scrollTopTween((_y * _s) - (2 * _s)));  // and do a slight offset towards the application bar (-2 * scale)

    d3.select('#' + id + ' rect').transition().delay(800).duration(1000).style('stroke', 'orange').style('stroke-width', '0.25');    // highlight node
    d3.select('#' + id + ' rect').transition().delay(2000).duration(500).style('stroke', 'none').style('stroke-width', '0');  // delete highlight
  },

  // search for specific term over all nodes in index
  searchNodeText: function (term) {
    _results = [];
    // iterate over index and push matches to results (except links and errors)
    for (var j = 0; j < tr3x.nodes.length; j++) {
      if (~tr3x.nodes[j].text.toLowerCase().indexOf(term.toLowerCase()) && !~tr3x.nodes[j].text.indexOf('[link]') && !~tr3x.nodes[j].text.indexOf('[error]') ){
        _results.push(tr3x.nodes[j]);
      }
    }
    // write results and link to nodes
    _list = "";
    _limit = (_results.length > 15) ? 16 : _results.length; // limit maximum number of results (15)
    for (var k = 0; k < _limit; k++) {
      // use tabindex to make results accesible by tab key, start with 101 to avoid collisons with browser internal tabindices
      _list += "<p tabindex=" + (101+k) + " onclick=tr3x.jumpToNode('" + _results[k].id + "')>" + _results[k].text + " (ID:" + _results[k].id  + ")</p>";
    }
    // if number of resuts exceeds limit then show limiter text
    if (_results.length > 15) {_list += "<br/><p style='text-align:center'>" + tr3x.l.moreresults + "</p>";}  
    
    // append results to panel
    d3.select('.app-search div').html(_list);
    
    // make enter key work to jump to resutl for better accessibility
    d3.selectAll('.app-search p').each(function () {
      d3.select(this).on('keyup', function () {
        if (d3.event.keyCode == 13) { // key code 13 for enter key
          // simulate click-Event on Element to trigger onclick-action (works only for IE9+)
          event = document.createEvent('HTMLEvents');
          event.initEvent('click', true, false);
          this.dispatchEvent(event);
        }
      });
    });

    // show no results if search query is empty
    if (term == '') {d3.select('.app-search div').selectAll('*').remove()}

    return _results; // return search results for API
  },

  // expand or collapse nodes dependent on current state
  toggleNodeState: function (node) {
    _id = d3.select(node).attr('id');  // contains generate-id value or custom id
    // get all descendants and hide them
    d3.selectAll('.d-of-' + _id).each(function() {
      this.classList.toggle('hide');
    });
    // set node state to minimized
    d3.selectAll('.' + _id).each(function() {
      this.classList.toggle('minimized');
    });
  },

  toggleLinks: function () {
    d3.selectAll('.linkline line').each(function () {
      this.classList.toggle('hide');
    });
  },

  toggleSubPanel: function (node) {
    node.parentNode.nextElementSibling.classList.toggle('hide'); // in this case pure JavaScript is the most elegant solution
    node.classList.toggle('closed'); // mark as closed to change trigger symbol
  },

  // show content in preview box
  showContentPreview: function (node) {
    _path = d3.select(node).select('desc').text(); // contains path to (additional) content file
    _panel = d3.select('.app-preview');

    if (_path != '') {
      // ajax load content and append to preview panel
      d3.html(_path, function(html) {
        _panel.html('');
        _panel[0][0].appendChild(html);
      });
    } else {
      _panel.html('<i>' + tr3x.l.nocontent + '</i>');
    }
  },

  // set text in information panel
  writeNodeInformation: function (title, descs, type, choices, additional, tr3class, parent) {
    // build html based on available information
    _html = "<table><tr class='muted'><td>" + tr3x.l.type + ":</td><td>" + type + "</td></tr>" +       // always display type
                   "<tr class='muted'><td>" + tr3x.l.class + ":</td><td>" + tr3class + "</td></tr>" +  // always display class of node
                   "<tr class='muted'><td>" + tr3x.l.parent + ":</td><td>" + parent + "</td></tr>";    // always display preceding node           
    // choose if standard node or not (links need different fields)
    if (additional == "") {        
      _html +=  "<tr><td>" + tr3x.l.title + ":</td><td>" + title + "</td></tr>" +                      // node text
                "<tr><td>" + tr3x.l.choices + ":</td><td>" + choices + "</td></tr>" +                  // child nodes
                "<tr class='muted'><td>" + tr3x.l.descs + ":</td><td>" + descs + "</td></tr>";         // number of descendants
    } else {
      _html +=  additional;
    }
    _html += "</table>";
    // append to panel
    d3.select('.app-data').html(_html);
  },

  getNodeDescendantsCount: function (id) {
    // count descendants
    _descendants = 0;
    d3.selectAll('rect.d-of-' + id).each(function() {
      _descendants++;
    });
    return _descendants;
  },

  getNodeParent: function (node) {
    // get all classes
    _allclasses = d3.select(node).attr('class').split(' '); // array of classes
    // filter classes with regular expression to get parent via child-of class (prefixed with 'c-of-')
    _parentid = _allclasses.filter(function (item){ 
      return /c-of-\w*/.test(item);      // find nodes with prefix
    }).map(function (name){
      return name.replace(/c-of-/g, ''); // remove prefix
    });
    if (!_parentid.length) {
      _parent = tr3x.l.noparent; // when no parent found show default text
    } else {
      _parenttext = d3.select('#' + _parentid).attr('title'); // get parent text
      _parent = '<p onclick=tr3x.jumpToNode("' + _parentid + '")>' + _parenttext + '</p>'; // link to parent node
    }
    return _parent;
  },

  getNodeChoices: function (id) {
    // get children
    _children = [];
    d3.selectAll('g.c-of-' + id + ':not(.copy) line').each(function() {
      _c = d3.select(this.nextElementSibling).text();
      _children.push({
        'text': _c 
      });
    });
    // get corresponding next nodes
    d3.selectAll('g.c-of-' + id + ':not(.copy) rect').each(function(d,ix) {
      _nid = d3.select(this.parentNode).attr('id');
      _ntext = d3.select(this.parentNode).attr('title');
      
      if (~_ntext.indexOf('[link]')){
        // go to node that is referenced by link node
        _children[ix]['nextid'] = _ntext.substr(7);
        _children[ix]['nexttext'] = d3.select('#' + _ntext.substr(7)).attr('title');;
      } else {
        // match next nodes with choices by index ('ix')
        _children[ix]['nextid'] = _nid;
        _children[ix]['nexttext'] = _ntext;
      }
    });
    // write list of children
    _choices = "<ul>";
    for (var l = 0; l < _children.length; l++) {
      _choices += '<li onclick=tr3x.jumpToNode("' + _children[l].nextid + '")>' + _children[l].text + ' <i>(' + _children[l].nexttext + ')</i></li>';
    }
    _choices += "</ul>";
    return _choices;
  },

  // get the fucntional type of a node
  getNodeType: function (node) {
    // get node type via class
    _element = d3.select(node).select('rect');
    _text = d3.select(node).select('text').text();

    // standard element types: tr3 (root), branch & leaf
    if (_element.classed('tr3')){
      _type = tr3x.l.root;
    } else if (_element.classed('leaf')){
      _type = tr3x.l.leaf;
    } else if (_element.classed('branch')) { 
      _type = tr3x.l.branch;
    }
    // special element types: error & link
    if (~_text.indexOf('[error]')) { 
      _type = tr3x.l.error;
    } else if (~_text.indexOf('[link]')) { 
      _type = tr3x.l.link;
    } 
    return _type;
  },

  // get the tr3-class of a node
  getNodeClass: function (node) {
    // get all classes
    _allclasses = d3.select(node).attr('class').split(' '); // array of classes
    // filter classes with regular expression to get tr3-classes (prefixed with 'tr3-')
    _tr3classes = _allclasses.filter(function (item){ // I <3 JavaScript
      return /tr3-\w*/.test(item);
    }).map(function (name){  // mapping new values (removing prefix)
      return name.replace(/tr3-/g, '');
    });;
    // default value if no special class is assigned
    if (!_tr3classes.length) {
      _tr3classes = tr3x.l.noclass;
    }
    return _tr3classes;
  },

  // if node type is 'link' get the referenced node text and link to it
  getNodeAdditionals: function (node) {
    _additional = "";
    _text = d3.select(node).select('text').text();
    if (~_text.indexOf('[link]')) { 
      _refid = _text.substr(7);
      _additional = '<tr><td>' + tr3x.l.references + ':</td><td><p onclick=tr3x.jumpToNode("' + _refid + '")>' + _refid + '</p></td></tr>';
      return _additional;
    } else { 
      return _additional;
    }
  },

  // d3js scroll tweeners (source: http://bl.ocks.org/humbletim/5507619)
  scrollTopTween: function (scrollTop) {
    return function() {
      var i = d3.interpolateNumber(this.scrollTop, scrollTop);
      return function(t) { this.scrollTop = i(t); };
   };
  },

  scrollLeftTween: function (scrollLeft) {
    return function() {
      var i = d3.interpolateNumber(this.scrollLeft, scrollLeft);
      return function(t) { this.scrollLeft = i(t); };
   };
  },

  // localize
  localizeUI: function (locale) {
    tr3x.l = tr3x.dict[locale]; // map dictionary for given locale to global localization object 'tr3x.l'
  },

  // locales (only german for now)
  // normally these should be in a seperate file but for the sake of simplicity they are embedded here
  dict: {
    de: {
      'references':'Referenziert', 'noerrors':'keine Fehler', 'nrerrors':'Fehler aufgetreten', 'nocontent':'kein Content verknüpft',
      'root':'Startpunkt', 'branch':'Verzweigung', 'leaf':'Endpunkt (Diagnose)', 'link':'Link (Referenz)', 'error':'Fehler', 'type':'Knotentyp',
      'parent':'Vorgänger', 'noparent':'kein Vorgänger', 'class':'Klasse', 'title':'Text', 'choices':'Auswahl', 'descs':'Nachfolger',
      'moreresults':'Weitere Suchergebnisse', 'pathlength':'Pfadlänge', 'totalnodes': 'Knoten', 'noclass':'default', 'leafnodes':'Blätter', 'reusefactor':'Reuse'
    }
  }
};