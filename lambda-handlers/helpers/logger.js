
/**
 * FUNCTION USED TO PRINT DEBUG INFOS
 */
function printLog(name, object) {
  if (isJSON(object)) {
    console.log(name + " -----Object----- " + JSON.stringify(object, null, 2));
  } else {
    console.log(name + " -----Autre------ " + object);
  }
}

function isJSON(obj) {
  return obj !== undefined && obj !== null && obj.constructor == Object;
}

exports.printLog = printLog;
