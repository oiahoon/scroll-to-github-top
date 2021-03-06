$(document).ready(function() {
  var headers = $(":header").filter(function(index) {
    return $(this).find("a[href^='#']").length !== 0;
  });

  var rootNode = buildHeadTree(headers);
  generateJstreeData(rootNode);

  var element = '<div id="jstree-container" class="stgt-tree is-hidden"></div>';
  $("body").append(element);

  $(function() {
    $('#jstree-container').jstree({
      'core' : {
        'data' : rootNode,
        "themes" : {
          "icons" : false,
          'ellipsis': false,
          'dots':false,
          'stripes':false,
        },
      }
    })
    .bind("ready.jstree", function (event, data) {
      $(this).jstree("open_all");
    });
  });

  $('#jstree-container').on("changed.jstree", function (e, data) {
    jumpAnchor(data.instance.get_selected(true)[0].original.href);
  });
  $('#jstree-container').on("select_node.jstree", function (e, data) {
    headers.each(function(i){
      text = $(this).text().trim()
      if (text === data.node.text) {
        $(this).css('border', '2px solid red')
        var that = this
        setTimeout(function() {
          $({alpha:1}).animate({alpha:0}, {
              duration: 1000,
              step: function(){
                $(that).css('border-color','rgba(255,0,0,'+this.alpha+')');
              }
          });
        }, 1000)
      }
    })
  });

  $('#jstree-container').on('mouseover', displayJstree);
  $('#jstree-container').on('mouseout', disappearJstree);
  $('#jstree-container').on('click', displayJstree);
  $('input,textarea').on('focus', disappearJstreeRightNow)
});

function jumpAnchor(href) {
  window.location = window.location.origin + window.location.pathname + href;
}

function buildHeadTree(headers) {
  var rootNode = newTreeNode('H0', '[TOC]', -1, '')
  var currentNode = rootNode;
  headers.each(function(i) {
    var text = $(this).text().trim();
    var href = $(this).find("a[href^='#']").attr('href');
    var a = currentNode.value;
    var b = $(this).prop("tagName");
    var ans = compare(a, b);
    if(text.length == 0) { return true; }
    if (ans === -1 || a === -1) {
      var newNode = newTreeNode(b, text, currentNode, href)
      currentNode.children.push(newNode);
      currentNode = newNode;
    } else {
      while(ans === 1 || ans === 0) {
        currentNode = currentNode.parent
        a = currentNode.value;
        ans = compare(a, b);
      }
      var newNode = newTreeNode(b, text, currentNode, href)
      currentNode.children.push(newNode);
      currentNode = newNode;
    }
  })
  return rootNode;
}

function generateJstreeData(rootNode) {
  dfs(rootNode)
}

function dfs(rootNode) {
  delete rootNode.value;
  delete rootNode.parent;
  if (rootNode.children.length === 0) {
    delete rootNode.children;
    return;
  }
  rootNode.children.forEach(function(childrenNode) {
    dfs(childrenNode)
  })
}

function newTreeNode(value, text, parentNode, href) {
  return {
    value: value,
    text: text,
    state: {opened: parentNode === -1 ? true : false},
    children: [],
    parent: parentNode,
    href: href
  }
}

function compare(a, b) {
  var aNumStr = a.replace( /^\D+/g, '');
  var bNumStr = b.replace( /^\D+/g, '');
  if (aNumStr < bNumStr) {
    return -1;
  } else if (aNumStr === bNumStr) {
    return 0;
  } else {
    return 1;
  }
};
