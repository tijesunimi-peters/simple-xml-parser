let test = `<html charset="5">
  <head>
    <title>Testing Title</title>
    <meta charset="utf-8" />
  </head>
  <body>
    <!-- This is a comment -->
    <form class="form" id="formTesting" action="/">
      <input name="email" class="form-email form-email2" max="24" type="text" />
      <br />
    </form>
    <p id="para">paragraph <b>bold</b> and this is not bold</p>
    <div>CONSOLE</div>
  </body>
</html>`;

// Split document in to chars
let tokens = test.split("\n").join("").split("")

// buildTag
function buildTagName(tokens, index) {
  let token = tokens[index];
  let nameChars = []

  while(token != '>') {
    nameChars.push(tokens[index])
    token = tokens[++index];
  }

  let name = nameChars.join("");
  let closingTag = false;
  let attributes, nodes;

  if(nameChars[0] == '/') {
    // close open tag
    name = nameChars.slice(1).join("")
    closingTag = true;
  } else if(nameChars[0] == '!') {
    // handle comments
    name = "comment"
    nodes = [nameChars.join("")]
    closingTag = true

  } else if(nameChars[nameChars.length - 1] == '/') {
    // self closing tag
    let tagParts = nameChars.join("").split(" ")
    name = tagParts[0]
    attributes = tagParts.slice(1, tagParts.length - 1)
    closingTag = true;
  } else {
    // open tag
    let tagParts = nameChars.join("").split(" ")
    name = tagParts[0]
    attributes = tagParts.slice(1)
  }

  return {
    nodes: nodes || [],
    name,
    attributes,
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

// keep track of currently open tag
// Works like a Stack
let openTags = [];

function build(tokens, index, tag) {

  if(index >= tokens.length - 1) {
    // finished the document and exit function
    return openTags;
  } else {
    if(tokens[index] == '<') {
      // Found a new tag
      let tag = buildTagName(tokens, ++index);
      tag.startIndex = index - 1;
      index = tag.index;

      if(!tag.closingTag) {
        // Add tag as last element on openTags
        openTags.push(tag)
      } else {
        // Close the last opened tag in the stack
        // pre-emptively popping the last tag assuming lastTag.name == tag.name
        let lastTag = openTags.pop();
        let parentTag = openTags[openTags.length - 1]

        if(lastTag.name != tag.name) {
          // push back the popped tag
          openTags.push(lastTag);
          parentTag = lastTag;
          lastTag = tag;
        } 

        lastTag.closingTag = true;
        lastTag.closingIndex = index;

        // Parent tag is always tag before the last
        // If there is no parent tag it means we are on the last
        // tag in the stack
        if(parentTag) {
          // Remove the last tag and put in the node (children)
          // in parant tag
          parentTag.add(lastTag)
        } else {
          // We are on the first mode tag which ends the loop
          return lastTag;
        }
      }
    } else {
      let lastTag = openTags[openTags.length - 1]
      if(!lastTag) throw new Error("Invalid XML document");
      // Found a text
      lastTag.add({name: 'text', value: tokens[index], index})
    }
  }


  // Keep building one index at a time
  return build(tokens, ++index, openTags[openTags.length - 1]);
}

module.exports = build
