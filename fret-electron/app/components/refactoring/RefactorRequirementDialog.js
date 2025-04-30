/**
* Dialog component for refactoring, based on existing FRET Code.
*
* @module refactoring/RefactorRequirementDialog
* @author Matt Luckcuck 
* Started: May 2022
*/


import React from 'react';
import PropTypes from 'prop-types';
import { v1 as uuidv1 } from 'uuid';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Grid from '@material-ui/core/Grid';
import Checkbox from '@material-ui/core/Checkbox';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';

import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import WarningIcon from '@material-ui/icons/Warning';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';

import RefactoringUtils from '../../../../tools/Refactoring/refactoring_utils';

const {ipcRenderer} = require('electron');
import { createOrUpdateRequirement } from '../../reducers/allActionsSlice';
import { connect } from "react-redux";

/**
 * Constants for the states the application can be in.
 */
const STATE = {INITIAL:"initial", RESULT_TRUE:"result true", RESULT_FALSE: "result false", TYPES:"types please", ERROR_UNDEF : "error-undefined"};

/**
 * List of variable types that NuSMV (and therefore Mu-FRET) does not support
 */
const unsupported_types = ["undefined", "double", "single",]


const styles = theme => ({
  formula: {
    color: theme.palette.primary.main,
    fontFamily: 'Monospace',
    fontSize: 'medium'
  },
  description: {
    color: theme.palette.primary.main,
    fontFamily: 'San Serif',
    fontSize: 'medium'
  },
  variableDescription: {
    color: theme.palette.primary.main,
    fontFamily: 'sans-serif',
    fontSize: '14px',
    marginLeft: '7%'
  },
  imgWrap: {
    width: '420px',
    position: 'relative',
    display: 'inline-block'
  }
});

/**
 * Provides the dialogue for refactoring, which guides the user through
 * the extract requirements refactoring and calls methods 
 * in refactoring_compare.js
 * 
 * The dialogue has five states, for different parts of the process: 
 * INITIAL, is the initial state where the user hasn't started refactoring yet;
 * TYPES, is the second state, where the user checks the types of the variables;
 * ERROR_UNDEF, is the state where some of the types were undefined in the TYPES state;
 * RESULT_TRUE, is the state where the NuSMV checks pass;
 * RESULT_FALSE, is the state where the NuSMV checks fail 
 * (which the user should hopefully never see). * 
 * 
 * @extends React.Component
 */
class RefactorRequirementDialog extends React.Component 
{
  state = {
    open: false,
    dialogState : STATE.INITIAL,
    selectedRequirement: {},
    variables: new Map(),
    variablesText: "No Variables",
    applyToAll: false,
    refactoringType: '',
    refactoringContent: ' ',
    extractString: 'default extract string',
    newName: '',
    requirements: [],
    refactoringCheckresult: null,
    variableDocs : {},
    //New variables for invalid fragments
    fragmentNotFoundinSelected: false,
    fragmentNotFoundInAll: false,
    //String with the IDs of any requirements to be refactored
    applicableRequirementsNames: "",
    //Variable for an invalid entered name
    invalidNewName: false,
  };

  componentWillReceiveProps = (props) => {
    this.setState({
      selectedRequirement: props.selectedRequirement,
      open: props.open,
      dialogCloseListener: props.handleDialogClose,
      requirements: props.requirements
    });
  }

  /**
   * Opens the refactor requirements dialogue
   */
  handleRefactorRequirement = () => {
    this.handleClose();
    this.state.openRefactorDialog();
  }

  /**
   * Closes the refactor requirements dialogue
   */
  handleClose = () => {
    // Reset the state
    this.setState({ open: false, dialogState: STATE.INITIAL, selectedRequirement: {}, requirements: [], refactoringCheckresult: null, applyToAll: false, refactoringType: '', newName: '', refactoringContent: '', fragmentNotFoundinSelected: false, fragmentNotFoundinAll: false, applicableRequirementsNames: "", invalidNewName: false});
    this.state.dialogCloseListener();
  };

  /**
   * Advance the state to TYPES, where the user checks the types of the variables
   */
  handleErrorUndefClose = () =>
  {
    this.setState({dialogState : STATE.TYPES });
  }

  /**
   * Callback, used by SortableTable.js (I think)
   */
  handleRefactorDialogClose = () => {
    this.setState({ refactorDialogOpen: false });

  };

  /**
   * Unused draft event handler for the preview button
   */
  handlePreview = () => {
    console.log('Preview Button');
  };


/**
* Event Handler for the OK Button on the initial
* refactor screen. Advances the state to TYPES.
*/
handleInitialOK = () =>
{
  /**
   * @TODO Interesting corner case here, if the user inputs a fragment that doesn't
   * exist, then the state never advances
   */

  //Oisín: Reset the error messages
  this.setState({fragmentNotFoundinSelected: false, fragmentNotFoundinAll: false, invalidNewName: false});

  const validNameRegex = /^[A-Za-z]([A-Za-z0-9_])*$/;
  let newName = this.state.newName;
  let found = newName.match(validNameRegex);
  let testResult = validNameRegex.test(newName);
  //console.log("Regex check for valid fragment name (requirement and variable):");
  //console.log(found);
  //console.log(testResult);

  if(testResult == false){
    this.setState({
      invalidNewName: true
    });
  }
  else if(this.state.applyToAll == false) //Extracting only from the selected requirement
  {
    if(this.fragmentInCurrent() == false){
      this.setState({fragmentNotFoundinSelected: true});
    }else{
      let selectedRequirement = this.state.selectedRequirement
      let varList = RefactoringUtils.getVariableNames(selectedRequirement);

      let args = [selectedRequirement.project, varList];
      ipcRenderer.invoke('createVariableMap', args).then((result) => {

        let variableDocs = result[0];
        let variableTypeMap = result[1];

        this.setState({
          variableDocs: variableDocs,
          variables : variableTypeMap,
          dialogState: STATE.TYPES
        }); 
      })

    }
  }
  else{ //Extracting from all applicable requirements in the project

    //Find the requirements that have the fragment in.
    let args = [this.state.requirements, this.state.selectedRequirement, this.state.extractString, this.state.newName]
    ipcRenderer.invoke('requirementsWithFragment', args).then((applicableRequirements) => {

      let applicableRequirementsNames = [];

      //If we have some requirements that contain the fragment we're extracting
      if (applicableRequirements.length >0)
    	{

        var variableTypeMap = new Map(); // map to hold varname |-> type
        var varList = [];

        // For each requirement that has the fragment in...
    		for (var i = 0; i < applicableRequirements.length; i++)
    		{
          let this_req = applicableRequirements[i];
          // Get the variable names embedded in this requirement...
          let varNames = RefactoringUtils.getVariableNames(this_req);
          let newVarList = varList.concat(varNames); // Javascript is a silly language
          varList = newVarList;

          //Oisín: Add the requirement names to a list, so we can display them to the user
          applicableRequirementsNames.push(" " + this_req.reqid);
        }
        applicableRequirementsNames.sort();


        let selectedRequirement = this.state.selectedRequirement
        let args = [selectedRequirement.project, varList];
        ipcRenderer.invoke('createVariableMap', args).then((result) => {

          let variableDocs = result[0];
          let variableTypeMap = result[1];

          this.setState({
            variableDocs: variableDocs,
            variables : variableTypeMap,
            dialogState: STATE.TYPES,
            applicableRequirementsNames: applicableRequirementsNames.toString()
          }); 
        })

      }else{
        this.setState({fragmentNotFoundinAll: true});
      }
    })

  }
}

//Oisín: Checks if the entered fragment is present in the selected requirement
fragmentInCurrent = () => {
  let fragment = this.state.extractString;
  let this_req_text = this.state.selectedRequirement.fulltext;

  if(this_req_text.split(" ").join("").includes(fragment.split(" ").join(""))) {
    return true;
  }else {
    return false;
  }
}


/**
* Event Handler for the OK Button on the types dialogue
* Calls the requested extract requirement method
*/
handleOk = () => {
  var newID = uuidv1();
  var result;
  var varTypeMap = this.state.variables;


  var undefinedVars = []
  var allVarsDefined = true; // we assume, but...
  //Check for unsupported variables
  for (const variable of varTypeMap)
  {
    if (unsupported_types.indexOf(variable[1]) >= 0)
    // If the variable's type is one we don't support
    {
      allVarsDefined = false;
      console.log("Error - " + variable[0] + " is undefined. Please update its type and try again.");
      undefinedVars.push(variable)
    }

  }

  if(allVarsDefined)
  {

    let extractArgs = [this.state.selectedRequirement, this.state.variables, this.state.extractString, this.state.newName, newID, this.state.requirements]
    let applyToAll = this.state.applyToAll;

    //Update ModelDB
    //RefactoringController.updateVariableTypes(this.state.variableDocs, this.state.variables);
    ipcRenderer.invoke('updateVariableTypes', [this.state.variableDocs, this.state.variables]).then((result) => {

      ipcRenderer.invoke('extractRequirement', extractArgs, applyToAll).then((result) => {
        if(result == true)
        {

          ipcRenderer.invoke('initializeFromDB', undefined).then((result) => {

            this.props.createOrUpdateRequirement({ type: 'actions/createOrUpdateRequirement',
                                                  requirements: result.requirements,
                                                  // analysis
                                                  components : result.components,
                                                  completedComponents : result.completedComponents,
                                                  cocospecData : result.cocospecData,
                                                  cocospecModes : result.cocospecModes,
                                                  // variables
                                                  variable_data : result.variable_data,
                                                  modelComponent : result.modelComponent,
                                                  modelVariables : result.modelVariables,
                                                  selectedVariable : result.selectedVariable,
                                                  importedComponents : result.importedComponents,
                                                  })

            this.setState({dialogState:STATE.RESULT_TRUE, refactoringCheckresult: result});
            
          })
          
        }
        else
        {
          this.setState({dialogState:STATE.RESULT_FALSE, refactoringCheckresult: result});
        }
      })
    })

  }
  else
  {
    this.setState({dialogState : STATE.ERROR_UNDEF, undefinedVariables : undefinedVars });
    return;
  }

};


/**
 * Updates the string that should be extracted from a requirement, the 'fragment'.
 * Stores this in the state variable extractString.
 * 
 */
handleChangeExtract = () => event => {
  let extractString = event.target.value;
  extractString = extractString.trim();

  this.setState({ extractString: extractString });
};

/**
 * Updates the name of the new requirement.
 * Stores this in the state vaiable newName.
 *  
 */
updateNewName = () => event => {

  this.setState({ newName: event.target.value });
};

/**
 * Updates the (boolean) state variable applyToAll, indicates 
 * if the user has selected that the extract requirement functionality 
 * should check all the requirements for the fragment to extract.
 * 
 */
updateApplytoAllStatus = () => event => {

  this.setState({applyToAll: event.target.checked});
};

/**
 * Updates the type of a variable in the states variables map
 * @param {String?} varName 
 *  
 */
handleTypeChange = (varName) => event =>
{
  var value =  event.target.value;
  var name = event.target.name;

  console.log("handleTypeChange - " + value + " from: " + name);

  var variableTypeMap = this.state.variables;

  variableTypeMap.set(varName, value);

  this.setState({variables: variableTypeMap});
};

/**
 * Returns the type of the variable called variableName, as
 * stored in the state's variables Map
 * 
 * @param {String?} variableName the name of a variable
 * @returns {String?} the type of the variable called variableName
 */
getType = (variableName) =>
{
  return this.state.variables.get(variableName)
};


  render() 
  {
    
    var { project, reqid, parent_reqid, rationale, ltl, semantics, fulltext } = this.state.selectedRequirement
    let req_component_name = semantics ? semantics.component : "";

    var dialog_state = this.state.dialogState;

    switch(dialog_state)
    {
      case STATE.INITIAL:
        return (
        <div>
          <Dialog
            open={this.state.open}
            onClose={this.handleClose}
            aria-labelledby="form-dialog-title"
            maxWidth="md"
          >
        <DialogTitle id="simple-dialog-title">  Extract Requirement: {reqid}</DialogTitle>
          <DialogContent>

            <DialogContentText>
              Copy the part of {reqid} that you want to extract from its Definition into the Extract field, and add the New Requirement Name. The Apply to all Requirements tick box toggles if the extraction will search for the Extract field in all requirements in this project.
            </DialogContentText>

          <Grid container spacing={2} >

                      <Grid style={{ textAlign: 'right' }} item xs={3}>
                        Definition:
                      </Grid>
                      <Grid item xs={9}>
                        <TextField
                          id="definition"
                          multiline
                          fullWidth
                          spellCheck="false"
                          label="Definition"
                          value={fulltext} />
                      </Grid>

                      <Grid style={{ textAlign: 'right' }} item xs={3}>
                        Extract:
                      </Grid>
                      <Grid item xs={9}>
                        <TextField
                          id="extract"
                          multiline
                          fullWidth
                          spellCheck="false"
                          label="Extract"
                          placeholder="Copy the part of the definition to extract"
                          value={this.state.extract}
                          onChange={this.handleChangeExtract()}
                        />
                      </Grid>
                          <Grid style={{ textAlign: 'right' }} item xs={3}>
                            New Requirement Name:
                          </Grid>
                          <Grid item xs={9}>
                            <TextField
                              id="newReqName"
                              label="New Name"
                              placeholder="Type the name you want to give to the extracted requirement"
                              spellCheck="false"
                              value={this.state.newName}
                              onChange={this.updateNewName()}
                            />
                          </Grid>

                          <Grid style={{ textAlign: 'right' }} item xs={3}>
                            Apply to all {req_component_name} Requirements in {project}:
                          </Grid>
                          <Grid item xs={9}>
                            <Checkbox
                              inputProps={{ 'aria-label': 'controlled' }}
                              onChange={this.updateApplytoAllStatus()}
                              />
                          </Grid>
                    </Grid>

            {this.state.invalidNewName == true &&
              <p style={{ color: "red" }}>Invalid new name; IDs must start with a letter and include only letters, numbers, and underscores</p>
            }
            {this.state.fragmentNotFoundinSelected == true &&
              <p style={{ color: "red" }}>Specified fragment not found in selected requirement</p>
            }
            {this.state.fragmentNotFoundinAll == true &&
              <p style={{ color: "red" }}>Specified fragment not found in selected project</p>
            }

            </DialogContent>
            <DialogActions>

              <Button onClick={this.handleClose} color="secondary">
                Cancel
              </Button>
              <Button
                onClick={this.handleInitialOK}
                color="secondary"
              >
                Ok
              </Button>
            </DialogActions>
          </Dialog>
        </div>
    );
    break;

      case STATE.TYPES:


      let reqVariables = []
      this.state.variables.forEach (function(value, key) {
        reqVariables.push(key);
      })

      var self = this;

      let dialogTitle = this.state.applyToAll ?
                          "Check Types Before Extracting:" :
                          "Check Types Before Extracting Requirement:" + reqid;

     return(
          <Dialog
            open={this.state.open}
            onClose={this.handleClose}
            aria-labelledby="form-dialog-title"
            maxWidth="md"
          >
          <DialogTitle id="simple-dialog-title">  {dialogTitle}
          </DialogTitle>

          <DialogContent>

            {//Oisín: List of applicable requirements, to be displayed only when Apply to All is selected
            }
            {this.state.applyToAll && ("Requirements to be refactored: " + this.state.applicableRequirementsNames)}
            {this.state.applyToAll && <br/>}

            <DialogContentText>
            Please check the variable types listed below. Correct any that are wrong and update any that are "Unknown". Existing variable types are shown in the analysis portal.<br/>

            Mu-FRET will use the Integer type for both signed and Unsigned Integers. If a variable is already set to Unsigned Integer, the list will show a <ErrorOutlineIcon  fontSize="small" /> to warn you. <br/>

            Mu-FRET cannot check Single or Double typed variables, so they must be manually changed to Integers (including any literal values in a requirement, e.g. 2.4). If a variable is already set to Single or Double, then the list will show a <WarningIcon  fontSize="small" /> to warn you. <br/>

            If any variables are left with Unknown, Single, or Double type, pressing OK will provide a warning. You will not be able to proceed with the refactoring until the types are changed.
            </DialogContentText>

          <Grid spaceing={2}>
            <Grid item xs={3}>
              {reqid} Definition:
            </Grid>
            <Grid item xs={9}>
              <TextField

                multiline
                fullWidth
                spellCheck="false"

                value={fulltext} />
            </Grid>
          </Grid>

              <ul>
              {
              reqVariables.map(varName =>
                    (
                      <li key={varName}>
                          {varName} :
                        <Select
                              labelId={varName}
                              id={varName}
                              name = {varName}
                              onChange={self.handleTypeChange(varName)}
                              value = {self.getType(varName)}
                              autoWidth
                              renderValue={(value) => {
                           if (unsupported_types.indexOf(value) >= 0) {
                                  return <div style={{color:'red'}}>{value} <WarningIcon  fontSize="small" /></div> ;
                          }
                          else if (value == "unsigned integer")
                          {
                            return <div style={{color:'orange'}}>{value} <ErrorOutlineIcon  fontSize="small" /></div> ;
                          }
                          else
                          {
                              return <div>{value}</div>;
                          }
                                }}
                        >
                        <MenuItem value={"boolean"}>Boolean</MenuItem>
                        <MenuItem value={"integer"}>Integer</MenuItem>
                        <MenuItem value={"undefined"}>Unknown</MenuItem>
                        </Select>
                      </li>
                    )
                  ,
                  <Divider variant="inset" component="li" />
                )

            }
            </ul>

          </DialogContent>

          <DialogActions>
            <Button   onClick={this.handleOk} color="secondary">
              Ok
            </Button>
          </DialogActions>

        </Dialog>
        );
    break;


    case STATE.RESULT_TRUE:
    // Check has passed
      return(
        <Dialog
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="form-dialog-title"
          maxWidth="md"
        >
        <DialogTitle id="simple-dialog-title">  Sucessfully Extracted Requirement: {reqid}
        </DialogTitle>
          <DialogContent>
              <DialogContentText>
                The checks have passed and the refactoring is complete. You may Close this dialogue.
              </DialogContentText>
              <CheckCircleIcon/> Checks Passed. The original and new requirements behave the same.
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} color="secondary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      );
      break;

    case STATE.RESULT_FALSE:
    // Check has failed. The user should probably never see this
      return(
        <Dialog
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="form-dialog-title"
          maxWidth="md"
        >
        <DialogTitle id="simple-dialog-title">  Extract Requirement Failed: {reqid}
        </DialogTitle>
          <DialogContent>
            <DialogContentText>
              The checks have failed and the refactoring was not performed. Please Close this dialogue, review the types and part of the requirement you were trying to extract, and try again.
            </DialogContentText>
            <CancelIcon/> The check failed, the original and new requirement behave differently.
            Result: {this.state.refactoringCheckresult}
          </DialogContent>
          <DialogActions>
          <Button onClick={this.handleClose} color="secondary">
            Close
          </Button>
          </DialogActions>
        </Dialog>
      );
      break;

    case STATE.ERROR_UNDEF:
    // Some of the variables were still undefined

        return(
          <Dialog
            open={this.state.open}
            onClose={this.handleClose}
            aria-labelledby="form-dialog-title"
            maxWidth="md"
          >
          <DialogTitle id="simple-dialog-title">  Error while Extracting: {reqid}
          </DialogTitle>
            <DialogContent>
              <DialogContentText>
                We cannot proceed yet, some of the variable types are still undefined. Please Close this dialogue to return to the types list and try again.
              </DialogContentText>
                 <CancelIcon/> Error - the following variables are undefined. Please update its type and try again.
                 <ul >
                 {
                   this.state.undefinedVariables.map(variable =>
                     (
                       <li>
                        {variable[0]} = {variable[1]}
                       </li>
                     )
                   )
                 }
                 </ul >
            </DialogContent>
            <DialogActions>
            <Button onClick={this.handleErrorUndefClose} color="secondary">
              Close
            </Button>
            </DialogActions>
          </Dialog>
        );
      break;
    }
}
}

RefactorRequirementDialog.propTypes = {
  selectedRequirement: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  handleDialogClose: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  const requirements = state.actionsSlice.requirements;
  return {
    requirements,
  };
}

const mapDispatchToProps = {
  createOrUpdateRequirement
};

export default withStyles(styles)
  (connect(mapStateToProps,mapDispatchToProps)(RefactorRequirementDialog));
