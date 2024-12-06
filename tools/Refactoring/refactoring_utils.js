/**
 * Utility methods to help the refactoring code.
 * 
 * @module Refactoring/refactoring_utils
 * @author Matt Luckcuck & Oisín Sheridan
 */

/**
 * Gets the variable names out of the requirement parameter's JSON object.
 * 
 * @param {Object} requirement the requirement 
 * @returns {Array} array of variable names
 */
exports.getVariableNames = function getVariableNames(requirement)
{
  let variables = requirement.semantics.variables;

  // If variables is an object, then I'm going to asssume
  // that it's the version of the requirement with 'regular' and 'modes'
  if (variables.constructor === Object) // Javascript is stupid...
  {
    let varList = variables.regular ;
    varList = varList.concat(variables.modes);
    console.log("if object: " + varList);
    return varList;
  }
  else
  {
    // If variables isn't an object, I'm going to assume that its'
    //  the version of the requirement with all the variables listed under
    // variables.
    console.log("if not object: " +variables);
    return variables;
  }
}


/**
 * Replaces all instances of the variable 'chosenOriginalName' with 'newName' in the given requirement
 * 
 * @param {Object} requirement the database JSON of the requirement
 * @param {String} chosenOriginalName the original name of the variable
 * @param {String} newName the new name for the variable
 * 
 * @returns {String} requirement.doc.fulltext with the variable renamed
 */
exports.replaceVariableName = function replaceVariableName(requirement, chosenOriginalName, newName){
  
  let simpleReplaceRegexString = "(?<=^|[^A-Za-z0-9_.%])" + chosenOriginalName + "(?=$|[^A-Za-z0-9_.%])";
  const simpleReplaceRegex = new RegExp(simpleReplaceRegexString);

  let reqFulltext = requirement.doc ? requirement.doc.fulltext : requirement.fulltext;//Just in case I get inconsistent with how this gets passed in
  let replacedFulltext = reqFulltext.replace(simpleReplaceRegex, newName);

  return replacedFulltext;

}
