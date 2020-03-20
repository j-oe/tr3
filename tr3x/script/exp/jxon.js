/* 
 jxon.js
 JXON conversion from Mozilla Developer Network
 https://developer.mozilla.org/en-US/docs/JXON
*/

function parseText (sValue) {
  if (/^\s*$/.test(sValue)) { return null; }
  if (/^(?:true|false)$/i.test(sValue)) { return sValue.toLowerCase() === "true"; }
  if (isFinite(sValue)) { return parseFloat(sValue); }
  if (isFinite(Date.parse(sValue))) { return new Date(sValue); }
  return sValue;
}

function getJXONTree (oXMLParent) {
  var vResult = true, nLength = 0, sCollectedTxt = "";
  if (oXMLParent.hasAttributes()) {
    vResult = {};
    for (nLength; nLength < oXMLParent.attributes.length; nLength++) {
      oAttrib = oXMLParent.attributes.item(nLength);
      // vResult["@" + oAttrib.name.toLowerCase()] = parseText(oAttrib.value.trim());
      vResult[oAttrib.name.toLowerCase()] = parseText(oAttrib.value.trim());
    }
  }
  if (oXMLParent.hasChildNodes()) {
    for (var oNode, sProp, vContent, nItem = 0; nItem < oXMLParent.childNodes.length; nItem++) {
      oNode = oXMLParent.childNodes.item(nItem);
      if (oNode.nodeType === 4) { sCollectedTxt += oNode.nodeValue; }
      else if (oNode.nodeType === 3) { sCollectedTxt += oNode.nodeValue.trim(); }
      else if (oNode.nodeType === 1 && !oNode.prefix) {
        if (nLength === 0) { vResult = {}; }
        // sProp = oNode.nodeName.toLowerCase();
        sProp = "children";
        vContent = getJXONTree(oNode);
        if (vResult.hasOwnProperty(sProp)) {
          if (vResult[sProp].constructor !== Array) { vResult[sProp] = [vResult[sProp]]; }
          vResult[sProp].push(vContent);
        // } else { vResult[sProp] = vContent; nLength++; }
        } else { vResult[sProp] = [vContent]; nLength++; }
      }
    }
  }
  if (sCollectedTxt) { nLength > 0 ? vResult.keyValue = parseText(sCollectedTxt) : vResult = parseText(sCollectedTxt); }
  return vResult;
}

//var tr3 = getJXONTree(root);