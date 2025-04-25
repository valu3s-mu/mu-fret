/**
* Controller code for the refactoring module backend
* @module Refactoring/refactoring_controller
* @author Matt Luckcuck 
* 2022, 2025
*/


var model = require("./refactoring_model");
var fretSemantics = require("../../fret-electron/app/parser/FretSemantics");
var compare = require("./refactoring_compare");
const refactoring_utils = require('./refactoring_utils.js')


/**
* Finds all the requirements in the given project that contain the given fragment
* Uses `FindRequirementsWithFragment` in refactoring_model.js
*/
exports.requirementsWithFragment = function requirementsWithFragment(allRequirements, req, fragment,  destinationName)
{
	console.log(" +++ requirementsWithFragment +++")
	console.log("req = " + req )
	console.log("req.project = " + req.project)
	console.log("req.reqid = " + req.reqid)

	return model.FindRequirementsWithFragment(allRequirements, req.project, fragment, req.reqid, destinationName, req.semantics.component);
};


/**
* returns a new requirement object, with empty fields
*/
function newRequirement()
{
	// New Req doesn't need a revision number
	return {fulltext: '', parent_reqid: '', project: '',rationale: '', reqid: '', semantics: '', _id: ''};
};

/**
 * Returns a dummy requirement object, with the reqid, fulltext, 
 * semantics.ftExpands, and semantics.variables copied from the req paramter.
 * This is used to test-run the refactoring and becomes hte new requirement if 
 * NuSMV check passes.
 * 
 * @param {Object} req The original requirement to copy
 * @returns A dummy requirement object, copied form the req parameter
 */
function makeDummyUpdatedReq(req)
{
	let dummyUpdatedReq = {}
	dummyUpdatedReq.reqid = req.reqid;
	dummyUpdatedReq.fulltext = req.fulltext;
	dummyUpdatedReq.semantics = {};
	dummyUpdatedReq.semantics.ftExpanded = req.semantics.ftExpanded;
	dummyUpdatedReq.semantics.variables = req.semantics.variables;

	return dummyUpdatedReq
}


/**
 * Handles one request to refactor one requirement
 * 
 * @param {Object} req the source requirement that is having behaviour extracted from it
 * @param {Map<String, String>} reqVars map of the req paramter's variables mapped to their types
 * @param {String} fragment the fragment to be extracted
 * @param {String} destinationName the name to be given to the newly created destination requirement
 * @param {*} newID the new (database) UUID for the newly created requirement
 * @param {Array<Object>} allRequirements List of all the other requirements in the project
 * @returns {Boolean} True if NuSMV says that the original and refactored requirement behaves the same.
 */
function extractRequirement(req, reqVars, fragment, destinationName, newID, allRequirements)
{
	console.log("Extract One");

	let dummyUpdatedReq = makeDummyUpdatedReq(req);



	// Ramos Step 1: Make New requirement

	let destinationReq = newRequirement();

	let fretishDestinationName = destinationName.replace(/ /g, "_").toUpperCase();


	destinationReq.reqid = fretishDestinationName;
	// Destination needs a new ID
	destinationReq._id = newID;
	// Copying the project name
	destinationReq.project = req.project;
	// Oisín: Marking destination as a fragment
	destinationReq.isFragment = true;

	destinationReq.rationale = "EXTRACT REQUIREMENT: extracted " + fragment + " from " + req.reqid;
	// Matt: Not adding this as a fragment to the dummy requirement because it doesn't need it yet
 	// Plus it triggers the fragment finding behaviour in generateSMV which is sloooow
	console.log("Made New Requirement")
	//console.log(destinationReq);


	// Step 2
  // Build new fretish requirement
	let component = req.semantics.component_name;


  // New fretish requirement
	let newFretish = "if " + fragment + " " + component + " shall satisfy " + fretishDestinationName;

	 destinationReq.fulltext = newFretish;
	 // Compile the new semantics and add to the new req
	 let newSemantics = fretSemantics.compile(newFretish);
	 destinationReq.semantics = newSemantics.collectedSemantics;
	 console.log("destinationReq's semantics = ...");
 	 console.log(destinationReq.semantics);

	// Step 3

	// Dummy Run on the Dummy Req
	model.ReplaceFragment(dummyUpdatedReq, fragment, fretishDestinationName);

	console.log("dummyUpdatedReq semantics = ...");
 	console.log(dummyUpdatedReq.semantics);
 	// Recompile the dummy's sematics...
 	let newDummySemantics = fretSemantics.compile(dummyUpdatedReq.fulltext)
 	dummyUpdatedReq.semantics = newDummySemantics.collectedSemantics;
 	console.log("dummyUpdatedReq semantics after compile = ...");
 	console.log(dummyUpdatedReq.semantics);


	console.log("~~~~~")
	console.log("checking what two reqs I'm comparing...")
	console.log("req text = " + req.fulltext)
	console.log("req semantics = " + req.semantics.ftExpanded)
	console.log("dummyUpdatedReq text = " + dummyUpdatedReq.fulltext)
	console.log("dummyUpdatedReq semantics = " + dummyUpdatedReq.semantics.ftExpanded)
	console.log("~~~~~")



  // Step 4
  // Verify
	var result = compare.compareRequirements(req, reqVars, dummyUpdatedReq, destinationReq, allRequirements);
	console.log("controller, result = " + result);
	if(result)
	{
		console.log("+++ adding requirements to the database +++")
		//Updating original requirement and adding to database

		// New Field to list the fragments that this requirement depends on
		req.fragments = [destinationReq._id]

		// Replace fragment in original requirement with reference to new requirement
		model.ReplaceFragment(req, fragment, fretishDestinationName);

		//Oisín: Recompile the semantics for the source requirement
		let recompiledSemantics = fretSemantics.compile(req.fulltext);
		req.semantics = recompiledSemantics.collectedSemantics;

		model.AddRequirementToDB(req);

	 	//Adding extracted requirement
		model.AddRequirementToDB(destinationReq);

		model.UpdateFragmentVariable(fretishDestinationName, component, req.project, [req._id, destinationReq._id])
	}
	else
	{
		console.log("+++ check failed, not adding +++")
		//delete req.fragments;
		//req.fulltext = reqBackup;
	}

	console.log(req);


	console.log(destinationReq);

	//Matt: This is empty if the check fails. I'm expecting NuSMV to return some information if the check fails,
 	// but it seems to not, because boolResults in callNuSMV is empty... This, in turn, means that the 
 	// dialogue has nothing to show.
	return result
}
exports.extractRequirement = extractRequirement;

/**
*

/**
 * Handles a request to extract a fragment from all requirements that contain it.
 * 
* @param {Object} req the requirement that is having behaviour extracted from it
 * @param {Map<String, String>} reqVars map of the req parameter's variables mapped to their types
 * @param {String} fragment the fragment to be extracted
 * @param {String} destinationName the name to be given to the newly created requirement
 * @param {*} newID the new (database) UUID for the newly created requirement
 * @param {Array<Object>} allRequirements List of all the other requirements in the project
 * @returns {Boolean} True if NuSMV says that the original and refactored requirement behaves the same.
 */

function extractRequirement_ApplyAll(req, reqVars, fragment,  destinationName, newID, allRequirements)
{
	console.log("Extract All")

	// Step 1

	// The destination of the extracted fragment
	let destinationReq = newRequirement();

	let fretishDestinationName = destinationName.replace(/ /g, "_").toUpperCase();


	destinationReq.reqid = fretishDestinationName;
	// Destination needs a new ID
	destinationReq._id = newID;
	// Copying the project name
	destinationReq.project = req.project;
	// Oisín: Marking destination as a fragment
	destinationReq.isFragment = true;


	destinationReq.rationale = "EXTRACT REQUIREMENT: extracted " + fragment + " from " + req.reqid;

	// Step 2
  // Build new fretish requirement
	let component = req.semantics.component_name;

  // New fretish requirement
	let newFretish = "if " + fragment + " " + component + " shall satisfy " + fretishDestinationName;

	 destinationReq.fulltext = newFretish;
	 // Compile the new semantics and add to the new req
	 let newSemantics = fretSemantics.compile(newFretish)
	 destinationReq.semantics = newSemantics.collectedSemantics;

	console.log("Made New Requirement")
	console.log(destinationReq);

	console.log("knockons");
  // Do the thing
  // Similar to this method, but the destination requirement already exists.

	let reqKnockons = exports.requirementsWithFragment(allRequirements, req, fragment, fretishDestinationName);

	console.log("Lets see what requirements I've got to update...");
	console.log(reqKnockons);
	var result = false;
	if(reqKnockons.length >0)
	{
		//check first
		for (var i = 0; i < reqKnockons.length; i++)
		{

			let kreq = reqKnockons[i];

			console.log("checking requirement");
			console.log(kreq);
			let dummyUpdatedReq = makeDummyUpdatedReq(kreq);

			// Dummy Run on the Dummy Req
			model.ReplaceFragment(dummyUpdatedReq, fragment, fretishDestinationName);
			dummyUpdatedReq.fragments = [destinationReq._id]

			let newDummySemantics = fretSemantics.compile(dummyUpdatedReq.fulltext)
 			dummyUpdatedReq.semantics = newDummySemantics.collectedSemantics;
 			console.log("dummyUpdatedReq semantics after compile = ...");
 			console.log(dummyUpdatedReq.semantics);

			console.log("~~~~~")
			console.log("checking what two reqs I'm comparing...")
			console.log("req text = " + req.fulltext)
			console.log("req semantics = " + req.semantics.ftExpanded)
			console.log("dummyUpdatedReq text = " + dummyUpdatedReq.fulltext)
			console.log("dummyUpdatedReq semantics = " + dummyUpdatedReq.semantics.ftExpanded)
			console.log("~~~~~")

			// Step 4
			// Verify

			// This call to compareRequirements can reuse reqVars because if we are doing extract all
			// then `reqvars` will contain all the variables (and types) for all the requirements that
			// contain the fragment being extracted.
			result = compare.compareRequirements(kreq, reqVars, dummyUpdatedReq, destinationReq, allRequirements);
			console.log("controller, result = " + result);

			if(!result)
			{
				console.log("+++ check failed aborting +++")
				console.log("+++ failed on the following requirement +++")
				console.log(kreq);
				break;
			}


		}

		let dbIDList = [destinationReq._id]

		if(result)
		{
			console.log("+++ adding requirements to the database +++")
			//Checks passed so now add
			for (var i = 0; i < reqKnockons.length; i++)
			{

				let kreq = reqKnockons[i];

				kreq.fragments = [destinationReq._id]
				model.ReplaceFragment(kreq, fragment, fretishDestinationName);

				let recompiledSemantics = fretSemantics.compile(kreq.fulltext);
				kreq.semantics = recompiledSemantics.collectedSemantics;
				dbIDList.concat(kreq._id);

				model.AddRequirementToDB(kreq);

			}

			console.log("+++ Adding Extracted Requirement +++")
			//Adding extracted requirement
			model.AddRequirementToDB(destinationReq);

		}
		 model.UpdateFragmentVariable(fretishDestinationName, component, req.project, dbIDList);
	}
	return result;
}
exports.extractRequirement_ApplyAll = extractRequirement_ApplyAll;

/**
 * Updates the variable types in the database using the types that the
 * user added on the RefactorRequirementDialog's TYPES input fields. 
 * 
 * @param {Object} variableDocs collection of database documents for the variables in this project
 * @param {Map} variables Map of variable names to type names
 */
function updateVariableTypes(variableDocs, variables)
{

	console.log("updateVariableTypes")
	console.log("variableDocs ->")
	console.log(variableDocs)
	console.log()
	console.log("variables ->")
	console.log(variables)
	for(let doc of variableDocs) // "of", not "in", because javascript is a silly language
	{
		console.log(doc)
		let varName = doc.variable_name;
		let varType = variables.get(varName);
		console.log("setting " + varName + " to type " + varType );
		doc.dataType = varType;
		doc.description = "Variable Type added by Mu-FRET Refactoring Dialogue.(refactoring_controller.updateVariableTypes())";

	}
	model.UpdateDataTypes(variableDocs);
}
exports.updateVariableTypes = updateVariableTypes;


/**
* Handles one request to move a definition to another requirement
* This should have no knock-on effects, since we can only refer to a requirement
* not a definition within a requirement.
* @todo Implement
*/
function MoveDefinition(sourceReq, definition, destinationReq)
{
  // Ramos
  // 1. Select the activities you want to move.
  // 2. Move them to the desired requirement.
 // 3. Update references to these activities if needed.

// Step 1 is done in the View


// Step 2
model.MoveFragment(sourceReq, definition, destinationReq) // Not yet working

// Step 3
 // (Ramos' step 3 isn't needed so...) Verify


}


/**
* Handles one request to rename a requirement, including the knock-on effect to
* other requirements that reference this requirement
* @todo Implement
*/
function RenameRequirement(requirement, newName, childRequirements)
{
  // Ramos
  // 1. Select the requirement you want to rename.
  // 2. Change the name of the requirement.
 // 3. Update the references in dependent requirements.

 // Step 1 is done in the view

 // Step 2
 // probably get the references to requirement.getName() first ...


// Step 3
//update the knockons


	requirement.reqid = newName;
	model.AddRequirementToDB(requirement);

	childRequirements.map(kreq => {
		kreq.parent_reqid = newName;
		model.AddRequirementToDB(kreq)
	})


	return true;

}
exports.RenameRequirement = RenameRequirement;


function RenameVariable(variableOldName, variableDBID, newVariableName, targetRequirements)
{
	model.FetchVariableFromDB(variableDBID).then((variableDBObject) => {
		
		variableDBObject._id = newVariableName;
		variableDBObject.variable_name = newVariableName;

		model.ReplaceVariableInDB(variableDBID, variableDBObject);
	})


	targetRequirements.map((req) => {

		let reqDoc = req.doc;

		let replacedFulltext = refactoring_utils.replaceVariableName(reqDoc, variableOldName, newVariableName);
		reqDoc.fulltext = replacedFulltext;

		let newSemantics = fretSemantics.compile(replacedFulltext);
		reqDoc.semantics = newSemantics.collectedSemantics;

		model.AddRequirementToDB(reqDoc);
	})

	return true;
}
exports.RenameVariable = RenameVariable;

/**
* Handles one request to inline a requirement, including the knock-on effects to
* other requirements that reference the requirement being inlined.
* @todo Implement
* 
* @param {Object} source the requirement (currently, specifically a fragment) that is being inlined from
* @param {Array<Object>} destinationReqs a list of the requirements that are being inlined into
*/
function InlineRequirement(source, destinationReqs)
{

// Ramos
// 1. Copy the activities (including pre and post conditions if applicable) described in the requirement to all requirements that uses this one.
// 2. Update the affected requirements to reflect the inlined activities and other requirements information.
// 3. Remove references to the inlined requirement.
// 4. Remove the inlined requirement.

	for (let i = 0; i < destinationReqs.length; i++){

		let currentDestination = destinationReqs[i].doc;

		let destinationText = currentDestination.fulltext;

    let semantics = source.semantics; //We pull from the source requirement's semantics
    let sourceResponse = semantics.post_condition_SMV_pt; //The text to be replaced
    let sourceCondition = semantics.pre_condition; //The text to be inlined

    let inlineResult = destinationText.replace(sourceResponse, sourceCondition);

    currentDestination.fulltext = inlineResult;

    //Recompile the requirement's semantics based on the new text
    let newSemantics = fretSemantics.compile(inlineResult);
		currentDestination.semantics = newSemantics.collectedSemantics;

		//Remove reference to the source fragment from the destination's list of fragments
		if(currentDestination.fragments){
			let fragIndex = currentDestination.fragments.indexOf(source._id);
			if(fragIndex > -1){
				currentDestination.fragments.splice(fragIndex, 1);
			}
			
		}

		//Add to the database
    model.AddRequirementToDB(currentDestination);

	}


	return true;

}
exports.InlineRequirement = InlineRequirement;
