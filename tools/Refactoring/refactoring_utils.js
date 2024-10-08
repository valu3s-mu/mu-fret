/**
 * Utility methods to help the refactoring code.
 * 
 * @module Refactoring/refactoring_utils
 * @author Matt Luckcuck
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
