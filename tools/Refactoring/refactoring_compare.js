/**
 * refactoring_compare
 * 
 * Supports the comparison of an original version of a requirement
 * with the refactored version, using NuSMV for model checking.
 * 
 * @module Refactoring/refactoring_compare
 * @author Matt Luckcuck 
 * 2022, 2025
 */
const fs = require('fs');
const execSync = require('child_process').execSync;

const fretSupportPath = "../../fret-electron/support/";
const utils = require('../../fret-electron/support/utils.js'); // /home/matt/work/mu-fret/fret-electron/support/utils.js
const utilities = require('../../fret-electron/support/utilities.js');
const refactoring_utils = require('./refactoring_utils.js')

const tempPath = './temp/'
const commandsFileName = 'commands';
const modelFileName = 'model'

const verboseNuSMV = true;

/*const nusmv_keywords = ["MODULE", "DEFINE", "MDEFINE", "CONSTANTS", "VAR", "IVAR", "FROZENVAR",
"INIT", "TRANS", "INVAR", "SPEC", "CTLSPEC", "LTLSPEC", "PSLSPEC", "COMPUTE",
"NAME", "INVARSPEC", "FAIRNESS", "JUSTICE", "COMPASSION", "ISA", "ASSIGN",
"CONSTRAINT", "SIMPWFF", "CTLWFF", "LTLWFF", "PSLWFF", "COMPWFF", "IN", "MIN",
"MAX", "MIRROR", "PRED", "PREDICATES", "process", "array", "of", "boolean",
"integer", "real", "word", "word1", "bool", "signed", "unsigned", "extend",
"resize", "sizeof", "uwconst", "swconst", "EX", "AX", "EF", "AF", "EG", "AG", "E", "F", "O", "G",
"H", "X", "Y", "Z", "A", "U", "S", "V", "T", "BU", "EBF", "ABF", "EBG", "ABG", "case", "esac", "mod", "next",
"init", "union", "in", "xor", "xnor", "self", "TRUE", "FALSE", "count", "abs", "max", "min"]
*/

const batchCommands = `reset ;
read_model -i FILE_NAME ;
go ;
check_property ;
show_property ;
quit`



var placeholderSubsts =
      [
    ['\\$regular_condition\\$','pre'],
    ['\\$post_condition\\$', 'post'],
    ['\\$stop_condition\\$', 'stop'],
    ['\\$scope_mode\\$', 'm'],
    ['\\$duration\\$', '0']
      ];

function substitutePlaceholders (ltlspec,n) {
    placeholderSubsts[4][1] = '' + n;
    return utilities.replaceStrings(placeholderSubsts,ltlspec);
}


/**
* Compares the original requirement with the refactored version.
* The method pulls any extracted fragments from the requirement set, using
* the `fragment` variable present in a previously refactored requirement.
*
* @param {Object} originalReq - the original requirement
* @param {Object} newReq - the refactored requirement
* @param {Map<String, String>} variableMap - the variables of the requirements, mapped to their types
* @param {String} fragmentName - the name/reqid of the fragment involved in the current refactoring
* @param {String} fragmentMacro - an NuSMV macro used to check the current refactoring
* @param {Set} requirementSet - the set of requirements the requirement belongs to
*/
function compareRequirements(originalReq, newReq, variableMap, fragmentName, fragmentMacro, requirementSet)
{
  let len = 11;
  let n = 4;


  console.log("+++ Comparing Requirements +++")

  console.log("== compareRequirements arguments: ==");
  console.log("originalReq:");
  console.log(originalReq);
  console.log("newReq");
  console.log(newReq)
  console.log("variableMap");
  console.log(variableMap);
  //console.log("requirementSet");
  //console.log(requirementSet);

  let checkResult = checkInNuSMV(originalReq, newReq, variableMap, fragmentName, fragmentMacro, len, n, requirementSet);

  if (checkResult)
  {
    console.log("PASS: Requirements behave the same");
  }
  else
  {
    console.log("FAIL: Requirements behave differently");
  }
  return checkResult;
}
exports.compareRequirements = compareRequirements;


/**
 * Uses NuSMV to check that the originalReq and the newReq translate 
 * to temporal logic that behaves the same.
 * 
 * @param {Object} originalReq 
 * @param {Object} newReq 
 * @param {Map<String, String>} variableMap 
 * @param {String} fragmentName
 * @param {String} fragmentMacro
 * @param {int} len 
 * @param {int} n 
 * @param {Array<Object>} allRequirements 
 * 
 */
function checkInNuSMV (originalReq, newReq, variableMap, fragmentName, fragmentMacro, len, n, allRequirements)
{
  //console.log("checkInNuSMV allRequirements -> ");
  //console.log(allRequirements); Oisín: this log is horrible in backend code so I'm getting rid of it
  
  let r = generateSMV(originalReq, newReq, variableMap, fragmentName, n, allRequirements);
  let smvCode = preamble(r.vars, len, fragmentMacro) + r.specs.join('\n') + '\n'; //

  let checkName =  originalReq.reqid;
  

  var smvModelFileName = modelFileName + '_' + checkName + '.smv'
  let smvModelFilePath = tempPath + smvModelFileName

  fs.writeFileSync(smvModelFilePath,smvCode,function(err) {
    if (err) return console.log(err);
  });
  console.log('SMV Model saved in ' + smvModelFilePath);

  let boolVec = callNuSMV(checkName, smvModelFileName);
  //console.log('\n[' + boolVec + ']\n')
  //console.log("Checking the problem: " + r.keys.length);

  if (boolVec.length = 1)
  {
    return boolVec[0]; //bit hacky for now
  }
  else
  {
      console.error("NuSMV returned an unexpectedly long array of results. (Length 1 was expected)");
  }
}


/**
* Generates the SMV file used to check that the original and new requirements
* behave in the same way.

 * @param {Object} originalReq 
 * @param {Object} newReq 
 * @param {Map<String, String>} variableMap 
 * @param {String} fragmentName
 * @param {int} n 
 * @param {Array<Object>} allRequirements 
 * @returns 
 */
function generateSMV(originalReq, newReq, variableMap, fragmentName, n, allRequirements)
{
  let ltlspecs = [];
  let fragList = [];
  let fragsToGet = [];

  console.log("GENERATE SMV\n");
  console.log(originalReq);
  console.log(newReq);


  //console.log("generateSMV allRequirements -> ");
  //console.log(allRequirements); Oisín: this log is horrible in backend code so I'm getting rid of it

  // Store the temporal logic of the original requirement
  let origFT = originalReq.semantics.ftExpanded;
  console.log("origFT = " + origFT)

  // check if the original requirement has fragments that should be merged back in
  if ("fragments" in originalReq)
  {
    console.log("merging original req")

    let fragments = getFragmentReqs(originalReq.fragments, allRequirements)

    for (let f of fragments)
    {
      origFT = mergeFragment(origFT, f.doc)//Oisin: can maybe fix by changing 'f' to 'f.doc'
      fragList.push(f)
    }
  }

  let newFT = newReq.semantics.ftExpanded;
  // Merge in the fragment extracted to the destination requirement
  // newFT = mergeFragment(newFT, destinationReq) 

  // Check if the new requirement has any fragments in the database that should be merged back in
  console.log("newReq.fragments:");
  console.log(newReq.fragments);
  if ("fragments" in newReq)
  {
    console.log("merging new req")

    let fragments = getFragmentReqs(newReq.fragments, allRequirements)
    console.log(fragments)
    for (let f of fragments)
    {
      newFT = mergeFragment(newFT, f.doc)//Oisin: can maybe fix by changing 'f' to 'f.doc
      fragList.push(f)
    }
  }


  let variables = getVars(originalReq, newReq, variableMap, fragmentName, fragList);
  let name = originalReq.reqid;

    let rawSaltSpec = `${origFT} <-> ${newFT}`;
    //let nothingAfterLast = "G(LAST -> (G (!pre & !post & !m)))";
    //let checkEquiv = `((G(LAST -> ${ptexp})) <-> ${ftexp})`;
    //let rawSaltSpec = nothingAfterLast + ' -> ' + checkEquiv;
    let saltSpec = substitutePlaceholders(rawSaltSpec,n);
    let smvSpec = utils.salt2smv(saltSpec);
    ltlspecs.push(`LTLSPEC NAME ${name} := ` + smvSpec + ';');

    console.log("LTL Specs:");
    console.log(ltlspecs);

  return {specs: ltlspecs,  vars: variables};
}


/**
* Gets the requirements are extracted fragments.
* This could become obsolete if we had a central list of them all.
*
 * @param {*} fragmentNames 
 * @param {Array<Object>} allRequirements 
 * @returns 
 */
function getFragmentReqs(fragmentNames, allRequirements)
{
  console.log("getting fragment requirements");
 let fragments = [];
 console.log(fragmentNames)


 //console.log("getFragmentReqs allRequirements -> ");
 //console.log(allRequirements); Oisín: this log statement is awful in terminal

 // Nested loops...would be nice if we could get rid of that.
 for (let req of allRequirements)
 {
   console.log("-- req = ")
   console.log(req);
   console.log("-- reqid = " + req.doc.reqid);
   for (let name of fragmentNames)
   {
     console.log(name);
     //req.doc because allRequirements is actually a list of docs from the database *sigh*
     if (req.doc.reqid == name)
     {
       console.log("req in fragment names")
       fragments.push(req);
       fragmentNames.splice(fragmentNames.indexOf(name),1);
     }
   }

 }

 return fragments
}

/**

*/

/**
 * Returns the common preamble to the SMV file.
 * This defines the variables (both common and specific, via the `variables` parameter)
 * that the specification uses.
 * 
 * @param {string} variables - the extra variables from the requirements
 * @param {int} len 
 * @param {string} fragmentMacro - the fragment name mapped to the fragment's definition
 * @returns 
 */
function preamble(variables, len, fragmentMacro) {
    return `MODULE main
VAR
  t : 0 .. ` + len + `;
  m : boolean;
  pre : boolean;
  stop : boolean;
  post : boolean;\n`
  + variables + `\n
ASSIGN
  init(t) := 0;
  next(t) := (t >= ` + len +`) ? ` + len + ` : t + 1;
DEFINE
  LAST := (t = ` + (len - 1) + `);\n`
 + fragmentMacro + '\n\n';
}



/**
 * Replace each instance of the fragment name in the requirement's 
 * property, with the pre-condition of the fragment requirement
 *
 * @param {*} property 
 * @param {*} fragment 
 * @returns 
 */
function mergeFragment(property, fragment)
{
  console.log("mergeFragment")
  let mergedProperty = property;

  let frag_condition = fragment.semantics.pre_condition; //Oisín: Error here

  console.log(frag_condition);

  console.log(mergedProperty);

  // Regular Expression for global (g) and case insensitive (i) search
  const re = new RegExp(`(${fragment.reqid})`, 'gi')
  console.log(re)

  mergedProperty = mergedProperty.replace(re, frag_condition)

  console.log(mergedProperty);

  return mergedProperty;
}


/**
 * Generates the SMV variables for the two requirements
 * using the variables listed in the requirement JSON.
 * In the SMV file these will be subbed in as booleans.
 * If there are requirements in the fragList (requirements that
 * were originally fragments) their variables will be included too.
 * 
 * @param {Object} originalReq 
 * @param {Object} newReq 
 * @param {Map<String, String>} variableMap 
 * @param {Array<Object>} fragList 
 * @returns {String} The variable names and types for the SMV file
 */
function getVars(originalReq, newReq, variableMap, fragmentName, fragList)
{
  console.log("getVars");
  let varSet = new Set();
  let variables = "";

  let origVars = refactoring_utils.getVariableNames(originalReq);
  let newVars = refactoring_utils.getVariableNames(newReq)


  for (let v of origVars)
  {    
    if (v != fragmentName)
    {
      varSet.add(v);
    }
  }

  for (let v of newVars)
  {
    if (v != fragmentName)
    {
      varSet.add(v);
    }
  }

  console.log("fragList:");
  console.log(fragList);
  if (fragList != [])//Oisín: This check seems to always pass, even if fragList actually is empty. I don't think it matters though, may just remove
  {
    console.log("Processing the FragList... " + fragList )
    for (let f of fragList)
    {
      let fragVars = refactoring_utils.getVariableNames(f.doc); //Oisín: Error here. Changing 'f' to 'f.doc
      for (let v of fragVars)
      {
        varSet.add(v);
      }
    }
  }

  // For each variable in the set, add it to the variables string (with a little conversion for the integers)
  varSet.forEach
  ( function(value)
    {
      console.log("making smv variable: " + value );
      console.log(variableMap);
      console.log(typeof(variableMap));
      let type = variableMap.get(value); // Big assumption here is that the new requirement doesn't have new variables...
      // Assumes the types are right, UI should prevent incorrect types from coming through.
      if (type == "integer")
      {
        variables += value + " :  0..4 ;\n";
      }
      else if (type == "unsigned integer") // silently treats unsigned integer as an integer
      {
        variables += value + " :  0..4 ;\n";
      }
      else
      {
        variables += value + " : " + type + ";\n";
      }

    }
  )
  console.log("Variables string:");
  console.log(variables);
  return variables;
}

/**
 * 
 * @param {*} checkName 
 * @param {*} file_name 
 * @returns 
 */
function callNuSMV (checkName, file_name) 
{   
  // The tempPath + file_name here is because Mu-FRET runs the nusmv command from the fret-electron directory
    const commands = batchCommands.replace('FILE_NAME',tempPath+file_name);
    const commandFile = writeSMVCommandFile(checkName ,commands);
    var NuSMV_command = 'nusmv  -source ' + commandFile;
    console.log(NuSMV_command);
    
    var nu_command = NuSMV_command;
    let NuSMV_output;
    try {
    NuSMV_output = execSync(nu_command).toString();
    } catch (error) { console.log(error); }

    if (verboseNuSMV) { console.log('NuSMV output: ' + NuSMV_output); }

    const regexp = /\[LTL\s+(True|False)/g;
    let matches = NuSMV_output.match(regexp);
    if (verboseNuSMV) console.log('smv results: ' + JSON.stringify(matches));
    let boolResults = [];
    for (let m of (matches==null ? [] : matches)) {
    if (m.includes('True')) boolResults.push(true);
    else if (m.includes('False')) boolResults.push(false);
    else console.log('smv returned unexpected value: ' + matches);
    }
    console.log('boolResults: ', boolResults);
    console.log(boolResults[0]);    console.log(boolResults[1]);
    return boolResults;
}

/**
 * 
 * @param {*} testID 
 * @param {*} str 
 * @returns 
 */
function writeSMVCommandFile(testID,str) {
    var smvFileName = commandsFileName + "_" + testID;
    var smvFilePath = tempPath + smvFileName;
    fs.writeFileSync(smvFilePath,str,function(err){
    if (err) {return console.log(err);}
    console.log('SMV batch commands saved in ' + smvFilePath);
    });
    return smvFilePath;
}