/**
* Dialog for the Rename Requirement refactoring
*
* @module refactoring/RenameRequirementDialog
* @author Oisín Sheridan
* Started: September 2024
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


class RenameRequirementDialog extends React.Component 
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
    childRequirements: [],
    //Variable for an invalid entered name
    invalidNewName: false,
    //If renaming a fragment, this is the corresponding variable
    fragmentVariable: '',
    reqsWithVariable: [],
    dummyUpdatedReqs: [],
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
      invalidNewName: false,
      fragmentVariable: '',
      reqsWithVariable: [],
      dummyUpdatedReqs: [],
    });
    this.state.dialogCloseListener();
  };


  /**
   * Updates the new name for the requirement.
   * Stores this in the state vaiable newName.
   *  
   */
  updateNewName = () => event => {

    this.setState({ newName: event.target.value });
  };

  handleVariableRenaming = (fragmentVariable) => event => {

    this.setState({
      fragmentVariable: fragmentVariable,
    })

  }

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


  handleInitialOK = () => {

    let fragmentVariable = this.state.fragmentVariable;//Check if the user wants to rename the variable as well

    //                           | Regex for a requirement and a variable | Regex for only a requirement name
    const validNameRegex = fragmentVariable ? /^[A-Za-z]([A-Za-z0-9_])*$/ : /^[A-Za-z0-9]([A-Za-z0-9_.-])*$/;
    let newName = this.state.newName;
    let testResult = validNameRegex.test(newName);

    if(testResult == false){
      this.setState({invalidNewName: true})
    }
    else{

      let getChildRequirementsPromise = ipcRenderer.invoke('getChildRequirements', this.state.selectedRequirement);


      let reqsWithVariablePromise = [[], []];//Initialised to the default values for reqsWithVariable and dummyUpdatedReqs, i.e. two empty arrays
      if(fragmentVariable){

        let semantics = this.state.selectedRequirement.semantics;
        let component_name = semantics.component_name;
        let varNameID = this.state.selectedRequirement.project+component_name+fragmentVariable;

        reqsWithVariablePromise = ipcRenderer.invoke('getRequirementsWithVariable', varNameID).then((reqsWithVariableResult) => {

          //Rename the variable in the retrieved requirements, to provide a preview
          let dummyUpdatedReqs = reqsWithVariableResult.rows.map((req) => {
              
            let replacedFulltext = RefactoringUtils.replaceVariableName(req, fragmentVariable, newName);

            let updatedReqObject = {
              dbid: req.id,
              reqid: req.doc.reqid,
              fulltext: replacedFulltext,
            };
            return updatedReqObject;
          });

          return [reqsWithVariableResult, dummyUpdatedReqs]
        });
      }

      //If we aren't renaming a variable, reqsWithVariablePromise stays as just an empty 2D array and is thus effectively ignored.
      Promise.all([getChildRequirementsPromise, reqsWithVariablePromise]).then((values) => {
        this.setState({
          invalidNewName: false,
          childRequirements: values[0].docs,
          reqsWithVariable: values[1][0].rows,
          dummyUpdatedReqs: values[1][1],
          dialogState : STATE.TYPES,
        });
      });
    }
    
  }


  handleTypesOK = () => {

    //let varTypeMap = this.state.variables;

    let allVarsDefined = true; // we assume, but...
    /*
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
    */

    if(allVarsDefined){

      //ipcRenderer.invoke('updateVariableTypes', [this.state.variableDocs, this.state.variables]);

      let renameRequirementArgs = [this.state.selectedRequirement, this.state.newName, this.state.childRequirements];
      let renameRequirementPromise = ipcRenderer.invoke('renameRequirement', renameRequirementArgs);


      let renameVariablePromise;
      if(this.state.fragmentVariable){
        let varNameID = this.state.selectedRequirement.project+this.state.selectedRequirement.semantics.component_name+this.state.fragmentVariable;
        let renameVariableArgs = [this.state.fragmentVariable, varNameID, this.state.newName, this.state.reqsWithVariable];
      
        let renameVariablePromise = ipcRenderer.invoke('renameVariable', renameVariableArgs);
      }

      Promise.all([renameRequirementPromise, renameVariablePromise]).then((results) => {
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

          this.handleClose();
        })
        
      })
    }

    this.handleClose();

  }



  render() 
  {
  

    var { project, reqid, parent_reqid, rationale, ltl, semantics, fulltext, _id } = this.state.selectedRequirement;

    var isFragment = (this.state.selectedRequirement.isFragment | (rationale && rationale.includes("EXTRACT REQUIREMENT: ") ));
    let response = semantics ? semantics.post_condition_SMV_pt : "";

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
            <DialogTitle id="simple-dialog-title">  Rename Requirement: {reqid}</DialogTitle>

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

              </Grid>

              {this.state.invalidNewName == true &&
                <p style={{ color: "red" }}>Invalid new name
                  <br/>
                  Requirement IDs must start with a letter or number and include only letters, numbers, underscores, hyphens, or dots
                  <br/>
                  Variable IDs cannot start with numbers, and cannot include hyphens or dots.
                </p>
              }

              {isFragment ? 
                <DialogContentText>
                  This is a fragment. Would you like to also rename the corresponding variable, {response}?
                  
                  <Button
                    onClick={this.handleVariableRenaming(response)}
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

        let fragmentVariable = this.state.fragmentVariable;
        let childRequirements = this.state.childRequirements;
        let dummyUpdatedReqs = this.state.dummyUpdatedReqs;

        return (
        <div>
          <Dialog
            open={this.state.open}
            onClose={this.handleClose}
            aria-labelledby="form-dialog-title"
            maxWidth="md"
          >
            <DialogTitle id="simple-dialog-title">  Rename Requirement: {reqid}</DialogTitle>

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

              </Grid>

              {/*Displaying any child requirements of the selected requirement, that are going to be updated*/}
              <br/>
              Child requirements to be updated:

              <Grid container spacing={2}>
              {childRequirements.map(req => {

                return(//React yells at you if the items don't have unique keys
                  <Grid item xs={3} key={req._id}>
                    {req.reqid}
                    <br/>
                    {"Parent: " + req.parent_reqid}
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

              <br/>
              <br/>
              {fragmentVariable ? <div>Requirements including the fragment variable:</div> : <div></div>}
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
      

    }

  }
}

RenameRequirementDialog.propTypes = {
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
  (connect(mapStateToProps,mapDispatchToProps)(RenameRequirementDialog));
