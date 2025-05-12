document.addEventListener('DOMContentLoaded', () => {
  // 等待 jQuery 和 jsTree 加载完成
  if (typeof $ === 'undefined' || typeof $.fn.jstree === 'undefined') {
    console.error('jQuery or jsTree not loaded');
    return;
  }

  const headers = Array.from(document.querySelectorAll(':header')).filter(header =>
    header.querySelector("a[href^='#']")
  );

  if (headers.length === 0) {
    console.log('No headers found with anchor links');
    return;
  }

  const rootNode = buildHeadTree(headers);
  generateJstreeData(rootNode);

  const element = document.createElement('div');
  element.id = 'jstree-container';
  element.className = 'stgt-tree is-hidden';
  document.body.appendChild(element);

  // 初始化jsTree
  $('#jstree-container').jstree({
    'core': {
      'data': rootNode,
      'themes': {
        'icons': false,
        'ellipsis': false,
        'dots': false,
        'stripes': false,
      },
    },
    'plugins': ['wholerow']
  }).on('ready.jstree', function() {
    $(this).jstree('open_all');
  });

  // 事件处理
  $('#jstree-container')
    .on('changed.jstree', (e, data) => {
      const selectedNode = data.instance.get_selected(true)[0];
      if (selectedNode && selectedNode.original.href) {
        jumpAnchor(selectedNode.original.href);
      }
    })
    .on('select_node.jstree', (e, data) => {
      headers.forEach(header => {
        const text = header.textContent.trim();
        if (text === data.node.text) {
          // 添加高亮动画
          header.classList.add('highlight-animation');
          setTimeout(() => {
            header.classList.remove('highlight-animation');
          }, 2000);
        }
      });
    })
    .on('mouseover', displayJstree)
    .on('mouseout', disappearJstree)
    .on('click', displayJstree);

  // 输入框获得焦点时隐藏目录
  document.querySelectorAll('input, textarea').forEach(element => {
    element.addEventListener('focus', disappearJstreeRightNow);
  });
});

function jumpAnchor(href) {
  const targetElement = document.querySelector(href);
  if (targetElement) {
    targetElement.scrollIntoView({ behavior: 'smooth' });
  }
}

function buildHeadTree(headers) {
  const rootNode = newTreeNode('H0', '[TOC]', -1, '');
  let currentNode = rootNode;

  headers.forEach(header => {
    const text = header.textContent.trim();
    const href = header.querySelector("a[href^='#']")?.getAttribute('href');
    if (!text || !href) return;

    const currentLevel = currentNode.value;
    const headerLevel = header.tagName;
    const comparison = compare(currentLevel, headerLevel);

    if (comparison === -1 || currentLevel === -1) {
      const newNode = newTreeNode(headerLevel, text, currentNode, href);
      currentNode.children.push(newNode);
      currentNode = newNode;
    } else {
      while (comparison === 1 || comparison === 0) {
        currentNode = currentNode.parent;
        const newComparison = compare(currentNode.value, headerLevel);
        if (newComparison === -1) break;
      }
      const newNode = newTreeNode(headerLevel, text, currentNode, href);
      currentNode.children.push(newNode);
      currentNode = newNode;
    }
  });

  return rootNode;
}

function generateJstreeData(rootNode) {
  dfs(rootNode);
}

function dfs(rootNode) {
  delete rootNode.value;
  delete rootNode.parent;
  if (rootNode.children.length === 0) {
    delete rootNode.children;
    return;
  }
  rootNode.children.forEach(childNode => dfs(childNode));
}

function newTreeNode(value, text, parentNode, href) {
  return {
    value,
    text,
    state: { opened: parentNode === -1 },
    children: [],
    parent: parentNode,
    href
  };
}

function compare(a, b) {
  const aNumStr = a.replace(/^\D+/g, '');
  const bNumStr = b.replace(/^\D+/g, '');
  return aNumStr < bNumStr ? -1 : aNumStr === bNumStr ? 0 : 1;
}
