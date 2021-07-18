let test = `<html>
  <head>
    <title>Testing Title</title>
  </head>
  <body>
    <p id="para">paragraph <b>bold</b> and this is not bold</p>
    <div>CONSOLE</div>
  </body>
</html>`;

let tokens = test.split("")

function buildTagName(tokens, index) {
  let token = tokens[index];
  let nameChars = []

  while(token != '>') {
    nameChars.push(tokens[index])
    token = tokens[++index];
  }

  let name = nameChars.join("");
  let closingTag = false;

  if(nameChars[0] == '/') {
    name = nameChars.slice(1).join("")
    closingTag = true;
  }

  return {
    nodes: [],
    name,
    index,
    closingTag,
    add: function(node) {
      let lastNode = this.nodes[this.nodes.length - 1]

      if(node.name != 'text') {
        this.nodes.push(node)
      } else if(lastNode) {
        if(lastNode.name == "text" && node.name == 'text') {
          lastNode.value += node.value
          if(!lastNode.startIndex) {
            lastNode.startIndex = lastNode.index
            lastNode.closingIndex = lastNode.index;
          } else {

            let indexSpan = node.index - lastNode.startIndex

            lastNode.closingIndex = indexSpan + lastNode.startIndex
          }
        } else { 
          this.nodes.push(node)
        }
      } else {
        this.nodes.push(node) 
      } 
    }
  }
}

let openTags = [];

function build(tokens, index, tag) {

  if(index >= tokens.length - 1) {
    return openTags;
  } else {
    if(tokens[index] == '<') {
      let tag = buildTagName(tokens, ++index);
      tag.startIndex = index - 1;
      index = tag.index;

      if(!tag.closingTag) {
        openTags.push(tag)
      } else {
        let lastTag = openTags.pop();
        let parentTag = openTags[openTags.length - 1]
        lastTag.closingTag = true;
        lastTag.closingIndex = index;

        if(parentTag) {
          parentTag.add(lastTag)
        } else {
          return lastTag;
        }
      }
    } else {
      openTags[openTags.length - 1].add({name: 'text', value: tokens[index], index})
    }
  }


  return build(tokens, ++index, openTags[openTags.length - 1]);
}

let document = build(tokens, 0)
// console.log(document)
console.log(JSON.stringify(document, true, 1))
console.log(tokens.slice(27, 40))
