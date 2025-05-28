/**
* Dialog for the Rename Variable refactoring
*
* @module refactoring/RenameVariableDialog
* @author Oisín Sheridan
* Started: November 2024
*/


import React from 'react';
import PropTypes from 'prop-types';
import { v4 as uuid } from 'uuid';

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


class RenameVariableDialog extends React.Component 
{
  state = {
    open: false,
    dialogState : STATE.INITIAL,
    selectedRequirement: {},
    variables: new Map(),
    variablesText: "No Variables",
    requirements: [],
    refactoringCheckresult: null,
    variableDocs : {},
    newName: '',
    chosenOriginalName: '',
    //Variable for an invalid entered name
    invalidNewName: false,
    //Array with the docs of all of the requirements that contain the chosen variable
    requirementsWithVariable: [],
    //Array with the fulltext of the above requirements after the replacement has been done
    dummyUpdatedReqs: [],
    allVarsDefined: true,
    variableErrorMessages: [],
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
   * Closes the rename requirements dialogue
   */
  handleClose = () => {
    // Reset the state
    this.setState({
      open: false,
      dialogState : STATE.INITIAL,
      selectedRequirement: {},
      variables: new Map(),
      variablesText: "No Variables",
      requirements: [],
      refactoringCheckresult: null,
      variableDocs : {},
      newName: '',
      chosenOriginalName: '',
      requirementsWithVariable: [],
      invalidNewName: false,
      dummyUpdatedReqs: [],
      allVarsDefined: true,
      variableErrorMessages: [],
    });
    this.state.dialogCloseListener();
  };


  handleChooseVariable = (varName) => {
    this.setState({chosenOriginalName: varName});
  }

  /**
   * Updates the new name for the variable.
   * Stores this in the state vaiable newName.
   *  
   */
  updateNewName = () => event => {

    this.setState({ newName: event.target.value });
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


  /**
   * 
   * 
   * 
   * 
   */
  handleInitialOK = () => {

    this.setState({invalidNewName:false}); //Reset the error message; I know this is a bit inefficient but it's a lot simpler

    /**Here we use two Regular Expressions to check that the entered New Name is a valid variable name.
     * The first, validNameRegex, checks the case where the name is not quoted, in which case it must start with a letter and contain
     * only letters, numbers, underscores, dots, or %.
     * The second Regex, quotedStringRegex, simply checks if the NewName has quotes on both ends; if so, then we assume it is valid since
     * quoted IDs have almost no restrictions in the FRETish grammar; use at your own risk!
     */
    const validNameRegex = /^[A-Za-z]([A-Za-z0-9_.%])*$/;
    const quotedStringRegex = /^".*"$/
    let newName = this.state.newName;
    let testResult = validNameRegex.test(newName) | quotedStringRegex.test(newName);

    if(testResult == false){//If NewName is found to be invalid, we do not progress and instead display an error message.
      this.setState({
        invalidNewName: true
      });
    }
    else{

      let selectedRequirement = this.state.selectedRequirement;
      let semantics = selectedRequirement.semantics;
      let chosenOriginalName = this.state.chosenOriginalName;
      let self = this;

      if(semantics){
        let component_name = semantics.component_name;

        let varNameID = selectedRequirement.project+component_name+chosenOriginalName;

        ipcRenderer.invoke('getRequirementsWithVariable', varNameID).then((result) => {

          let requirementsWithVariable = result.rows;

          let dummyUpdatedReqs = requirementsWithVariable.map((req) => {
            
            let replacedFulltext = RefactoringUtils.replaceVariableName(req, chosenOriginalName, newName);

            let updatedReqObject = {
              dbid: req.id,
              reqid: req.doc.reqid,
              fulltext: replacedFulltext,
            };
            return updatedReqObject;
          });


          var variableTypeMap = new Map(); // map to hold varname |-> type
          var varList = [];

          // For each requirement that has the fragment in...
          for (var i = 0; i < requirementsWithVariable.length; i++)
          {
            let this_req = requirementsWithVariable[i].doc;
            // Get the variable names embedded in this requirement...
            let varNames = RefactoringUtils.getVariableNames(this_req);
            let newVarList = varList.concat(varNames); // Javascript is a silly language
            varList = newVarList;
          }

          let createVariableMapArgs = [selectedRequirement.project, varList];
          ipcRenderer.invoke('createVariableMap', createVariableMapArgs).then((result) => {

            let variableDocs = result[0];
            let variableTypeMap = result[1];

            self.setState({
              variableDocs: variableDocs,
              variables : variableTypeMap,
              dialogState: STATE.TYPES,
              invalidNewName: false,
              requirementsWithVariable: requirementsWithVariable,
              dummyUpdatedReqs: dummyUpdatedReqs,
            }); 
          })

        })

      }

    }


  }

  //Mostly copying this in for now
  handleTypesOK = () => {

    let varTypeMap = this.state.variables;

    let allVarsDefined = true; // we assume, but...
    let undefinedVars = [];
    let variableErrorMessages = [];
    //Check for unsupported variables
    for (let variable of varTypeMap)
    {
      if (unsupported_types.indexOf(variable[1]) >= 0)
      // If the variable's type is one we don't support
      {
        allVarsDefined = false;
        undefinedVars.push(variable)

        //Create an error message and add it to the list, to be displayed at the bottom of the dialog.
        console.log("Error - " + variable[0] + " is undefined. Please update its type and try again.");
        variableErrorMessages.push("Error - " + variable[0] + " is undefined. Please update its type and try again.");
      }

    }
    this.setState({allVarsDefined : allVarsDefined, variableErrorMessages: variableErrorMessages});


    if(allVarsDefined){

      //ipcRenderer.invoke('updateVariableTypes', [this.state.variableDocs, this.state.variables]);

      let varNameID = this.state.selectedRequirement.project+this.state.selectedRequirement.semantics.component_name+this.state.chosenOriginalName;

      let renameVariableArgs = [this.state.chosenOriginalName, varNameID, this.state.newName, this.state.requirementsWithVariable, this.state.variables, this.state.requirements];

      ipcRenderer.invoke('renameVariable', renameVariableArgs).then((result) => {

        if(result==true){
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
    }

    //We don't need an else statement, because if any variables are undefined, we will stay on the TYPES screen and any error messages will
    //be displayed at the bottom of the dialog.

  }



  render() 
  {
  

    var { project, reqid, parent_reqid, rationale, ltl, semantics, fulltext, _id } = this.state.selectedRequirement;
    let selectedReqVariables = semantics ? semantics.variables : [];

    var isFragment = (this.state.selectedRequirement.isFragment | (rationale && rationale.includes("EXTRACT REQUIREMENT: ") ))

    var dialog_state = this.state.dialogState;

    let chosenOriginalName = this.state.chosenOriginalName;
    let requirementsWithVariable = this.state.requirementsWithVariable;
    let dummyUpdatedReqs = this.state.dummyUpdatedReqs;

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
            <DialogTitle id="simple-dialog-title">  Rename Variable: {reqid}</DialogTitle>

            <DialogContent>
              

              <Grid container spacing={2} direction="row">

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

              </Grid>

              {isFragment ? 

                <DialogContentText>
                  This is a fragment. Would you like to also rename the corresponding variable, {semantics ? semantics.post_condition_SMV_pt : ""}?
                  
                  <Button
                    onClick={this.handleClose}
                    color="secondary"
                  >
                    Yes  
                  </Button>

                </DialogContentText>

                : 
                <DialogContentText>
                This is not a fragment. Don't worry about this for now!
                </DialogContentText>
              }


              <Grid container spacing={2}>

              {//Populates the grid with the variables from the chosen requirement, each having a button to choose that one for renaming.
               //The ternary operator is here in case the requirement is invalid, in which case the semantics object exists but is empty,
               //leaving selectedReqVariables undefined. 
                selectedReqVariables ? selectedReqVariables.map(varName => {

                return(//React yells at you if the items don't have unique keys
                  <Grid item xs={3} key={varName}>
                    <TextField
                      id="definition"
                      multiline
                      fullWidth
                      spellCheck="false"
                      label=""
                      value={varName}
                    />

                    <Button
                    onClick={(event) => this.handleChooseVariable(varName)}
                    color="secondary"
                    >
                      Rename  
                    </Button>
                  </Grid>
                  )
                }

              )
              : <div>
                <p style={{ color: "red" }}>Couldn't find the requirement's list of variables. Is the requirement empty, or invalid?</p>
                Please close the dialog and troubleshoot.
                </div>
              }

              </Grid>


              {chosenOriginalName ?
                <div>
                New name for {chosenOriginalName}:
                <br/>
                <TextField
                  id="newVarName"
                  label={""}
                  placeholder="Type the new name for the chosen variable"
                  spellCheck="false"
                  value={this.state.newName}
                  onChange={this.updateNewName()}
                />
                </div>
              :
              <DialogContentText>
              </DialogContentText>
              }

              {this.state.invalidNewName == true &&
                <p style={{ color: "red" }}>Invalid new name; IDs must start with a letter and include only letters, numbers, underscores, dots, or %</p>
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

        let {allVarsDefined, variableErrorMessages} = this.state;


        var self = this;

        return (
        <div>
          <Dialog
            open={this.state.open}
            onClose={this.handleClose}
            aria-labelledby="form-dialog-title"
            maxWidth="md"
          >
            <DialogTitle id="simple-dialog-title">  Rename Variable: '{chosenOriginalName}' to '{this.state.newName}'</DialogTitle>

            <DialogContent>

              <DialogContentText>
                Please check the variable types listed below. Correct any that are wrong and update any that are "Unknown". Existing variable types are shown in the analysis portal.<br/>

                Mu-FRET will use the Integer type for both signed and Unsigned Integers. If a variable is already set to Unsigned Integer, the list will show a <ErrorOutlineIcon  fontSize="small" /> to warn you. <br/>

                Mu-FRET cannot check Single or Double typed variables, so they must be manually changed to Integers (including any literal values in a requirement, e.g. 2.4). If a variable is already set to Single or Double, then the list will show a <WarningIcon  fontSize="small" /> to warn you. <br/>

                If any variables are left with Unknown, Single, or Double type, pressing OK will provide a warning. You will not be able to proceed with the refactoring until the types are changed.
              </DialogContentText>


              <Grid container spacing={2}>

              {dummyUpdatedReqs.map(req => {

                return(//React yells at you if the items don't have unique keys
                  <Grid item xs={3} key={req.dbid}>
                    {req.reqid}
                    <br/>
                    <TextField
                      id="definition"
                      multiline
                      fullWidth
                      spellCheck="false"
                      label="Definition"
                      value={req.fulltext}
                    />
                  </Grid>
                  )
                }

              )}

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
                                else if (value == "unsigned integer") {
                                  return <div style={{color:'orange'}}>{value} <ErrorOutlineIcon  fontSize="small" /></div> ;
                                }
                                else{
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

            <ul>
            {variableErrorMessages.map(message => (
                <li key = {message}>
                <p style={{ color: "red" }}>{message}</p>
                </li>
              ))
            }
            </ul>







            </DialogContent>

            <DialogActions>

              <Button onClick={this.handleClose} color="secondary">
                Cancel
              </Button>
              <Button
                onClick={this.handleTypesOK}
                color="secondary"
              >
                Ok
              </Button>
            </DialogActions>

          </Dialog>
        </div>
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
          <DialogTitle id="simple-dialog-title">  Sucessfully Renamed Variable: '{chosenOriginalName}' to '{this.state.newName}'
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
          <DialogTitle id="simple-dialog-title">  Rename Variable Failed: {chosenOriginalName}
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
      

    }

  }
}

RenameVariableDialog.propTypes = {
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
  (connect(mapStateToProps,mapDispatchToProps)(RenameVariableDialog));
