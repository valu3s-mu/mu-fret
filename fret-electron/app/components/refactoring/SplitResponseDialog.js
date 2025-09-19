/**
* Dialog for the Merge Requirements refactoring
*
* @module refactoring/MergeResponsesDialog
* @author Oisín Sheridan
* Started: August 2025
*/


import React from 'react';
import PropTypes from 'prop-types';
import { v4 as uuid } from 'uuid';
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


class SplitResponseDialog extends React.Component 
{
  state = {
    open: false,
    dialogState : STATE.INITIAL,
    selectedRequirement: {},
    variables: new Map(),
    variablesText: "No Variables",
    updatedDefinition: '',
    newRequirementDefinition: '',
    newName: '',
    updatedName: '',
    requirements: [],
    refactoringCheckresult: null,
    variableDocs : {},
    //String with the IDs of any requirements to be refactored
    applicableRequirementsNames: "",
    //Variables for invalid entered names
    invalidNewName: false,
    invalidUpdatedName: false,
  };

  componentWillReceiveProps = (props) => {
    this.setState({
      selectedRequirement: props.selectedRequirement,
      open: props.open,
      dialogCloseListener: props.handleDialogClose,
      requirements: props.requirements,
      updatedDefinition: this.cutOffResponse(props.selectedRequirement),
      newRequirementDefinition: this.cutOffResponse(props.selectedRequirement),
      updatedName: props.selectedRequirement.reqid,
    });
  }

  cutOffResponse = (requirement) => {
    if (requirement.semantics){
      let responseStart = requirement.semantics.responseTextRange[0] + 7;
      let result = requirement.fulltext.substring(0, responseStart);
      return result;
    }else{
      return "";
    }
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
    this.setState({ open: false, dialogState: STATE.INITIAL, selectedRequirement: {}, requirements: [], refactoringCheckresult: null, newName: '', invalidNewName: false});
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

  //Oisín: Reset the error messages and trim the new definitions
  this.setState({
    invalidNewName: false,
    invalidUpdatedName: false,
    updatedDefinition: this.state.updatedDefinition.trim(),
    newRequirementDefinition: this.state.newRequirementDefinition.trim()
  });

  let validNewName = this.validRequirementName(this.state.newName);
  let validUpdatedName = this.validRequirementName(this.state.updatedName)

  if(validNewName == false){
    this.setState({
      invalidNewName: true
    });
  }
  if(validUpdatedName == false){
    this.setState({
      invalidUpdatedName: true
    });
  }

  if(validNewName & validUpdatedName){
    
    let selectedRequirement = this.state.selectedRequirement;
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


validRequirementName = (reqName) => {
  const validNameRegex = /^[A-Za-z0-9]([A-Za-z0-9_.-\s])*$/;
  return(validNameRegex.test(reqName))
}



/**
* Event Handler for the OK Button on the types dialogue
* Calls the requested split response method
*/
handleOk = () => {
  var newUUID = uuidv1();
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

    let splitArgs = [this.state.selectedRequirement, this.state.updatedName, this.state.updatedDefinition,  this.state.newName, this.state.newRequirementDefinition, newUUID, this.state.variables, this.state.requirements];


    ipcRenderer.invoke('updateVariableTypes', [this.state.variableDocs, this.state.variables]).then((result) => {

      ipcRenderer.invoke('splitResponse', splitArgs).then((result) => {
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


handleUpdateDefinition = () => event => {
  let updatedDefinition = event.target.value;

  this.setState({ updatedDefinition: updatedDefinition });

}

/**
 * Updates the string that should be extracted from a requirement, the 'fragment'.
 * Stores this in the state variable newRequirementDefinition.
 * 
 */
handleChangeNewRequirementDefinition = () => event => {
  let newRequirementDefinition = event.target.value;

  this.setState({ newRequirementDefinition: newRequirementDefinition });
};

/**
 * Updates the name of the new requirement.
 * Stores this in the state vaiable newName.
 *  
 */
updateNewName = () => event => {

  this.setState({ newName: event.target.value });
};

updateUpdatedName = () => event => {

  this.setState({ updatedName: event.target.value });
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
    
    var { project, reqid, parent_reqid, rationale, ltl, semantics, fulltext } = this.state.selectedRequirement;
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
        <DialogTitle id="simple-dialog-title">  Split Response: {reqid}</DialogTitle>
          <DialogContent>

            <DialogContentText>
              Cut the portions of {reqid} that you want to split from its Response definition fields, and add names for the split requirements. 
              The first name and definition will replace {reqid}, and the second will be created as a new requirement.
            </DialogContentText>

          <Grid container spacing={2} >


                      <Grid style={{ textAlign: 'right' }} item xs={3}>
                        {reqid}:
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
                        Updated Name:
                      </Grid>
                      <Grid item xs={9}>
                        <TextField
                          id="newReqName"
                          label="New Name"
                          placeholder="Type the name you want to give to the extracted requirement"
                          spellCheck="false"
                          value={this.state.updatedName}
                          onChange={this.updateUpdatedName()}
                        />
                      </Grid>

                      <Grid style={{ textAlign: 'right' }} item xs={3}>
                        Updated Definition:
                      </Grid>
                      <Grid item xs={9}>
                        <TextField
                          id={reqid}
                          multiline
                          fullWidth
                          spellCheck="false"
                          label="Definition"
                          value={this.state.updatedDefinition}
                          onChange={this.handleUpdateDefinition()}
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
                        New Requirement Definition:
                      </Grid>
                      <Grid item xs={9}>
                        <TextField
                          id="extract"
                          multiline
                          fullWidth
                          spellCheck="false"
                          label="Definition"
                          value={this.state.newRequirementDefinition}
                          onChange={this.handleChangeNewRequirementDefinition()}
                        />
                      </Grid>

            </Grid>

            {this.state.invalidUpdatedName == true &&
              <p style={{ color: "red" }}>Invalid updated name; Requirement IDs must start with a letter or number and include only letters, numbers, underscores, hyphens, dots, or spaces</p>
            }
            {this.state.invalidNewName == true &&
              <p style={{ color: "red" }}>Invalid new name; Requirement IDs must start with a letter or number and include only letters, numbers, underscores, hyphens, dots, or spaces</p>
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


     return(
          <Dialog
            open={this.state.open}
            onClose={this.handleClose}
            aria-labelledby="form-dialog-title"
            maxWidth="md"
          >
          <DialogTitle id="simple-dialog-title">  Split Response: {reqid}
          </DialogTitle>

          <DialogContent>

            <DialogContentText>
            Please check the variable types listed below. Correct any that are wrong and update any that are "Unknown". Existing variable types are shown in the analysis portal.<br/>

            Mu-FRET will use the Integer type for both signed and Unsigned Integers. If a variable is already set to Unsigned Integer, the list will show a <ErrorOutlineIcon  fontSize="small" /> to warn you. <br/>

            Mu-FRET cannot check Single or Double typed variables, so they must be manually changed to Integers (including any literal values in a requirement, e.g. 2.4). If a variable is already set to Single or Double, then the list will show a <WarningIcon  fontSize="small" /> to warn you. <br/>

            If any variables are left with Unknown, Single, or Double type, pressing OK will provide a warning. You will not be able to proceed with the refactoring until the types are changed.
            </DialogContentText>

          <Grid spaceing={2}>
            <Grid item xs={3}>
              {reqid} Original Definition:
            </Grid>
            <Grid item xs={9}>
              <TextField

                multiline
                fullWidth
                spellCheck="false"

                value={fulltext} />
            </Grid>
          </Grid>
          <br/>
          <Grid spaceing={2}>
            <Grid item xs={3}>
              {this.state.updatedName}:
            </Grid>
            <Grid item xs={9}>
              <TextField

                multiline
                fullWidth
                spellCheck="false"

                value={this.state.updatedDefinition} />
            </Grid>
          </Grid>
          <br/>
          <Grid spaceing={2}>
            <Grid item xs={3}>
              {this.state.newName}:
            </Grid>
            <Grid item xs={9}>
              <TextField

                multiline
                fullWidth
                spellCheck="false"

                value={this.state.newRequirementDefinition} />
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
        <DialogTitle id="simple-dialog-title">  Sucessfully Split Response: {reqid}
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
        <DialogTitle id="simple-dialog-title">  Split Response Failed: {reqid}
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
          <DialogTitle id="simple-dialog-title">  Error while Splitting: {reqid}
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

SplitResponseDialog.propTypes = {
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
  (connect(mapStateToProps,mapDispatchToProps)(SplitResponseDialog));
