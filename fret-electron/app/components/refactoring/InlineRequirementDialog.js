/**
* Dialog for the Inline Requirement refactoring
*
* @module refactoring/InlineRequirementDialog
* @author Oisín Sheridan
* Started: January 2024
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


class InlineRequirementDialog extends React.Component 
{
  state = {
    open: false,
    dialogState : STATE.INITIAL,
    selectedRequirement: {},
    variables: new Map(),
    variablesText: "No Variables",
    applyToAll: false,
    extractString: 'default extract string',
    requirements: [],
    refactoringCheckresult: null,
    variableDocs : {},
    //String with the IDs of any requirements to be refactored
    applicableRequirementsNames: "",
    //Requirements which contain the response variable of the chosen fragment, i.e. those that reference the chosen fragment
    requirementsWithResponse: [],
    //A preview of the text of the chosen destination requirement after Inline has been performed
    inlinedRequirementPlaceholder: "",
    inlinedName: "",
    //Used for error messages on the Types screen
    allVarsDefined: true,
    variableErrorMessages: [],
    //List of destination requirements to be inlined into
    destinationReqs: [],
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
   * Closes the inline requirements dialogue
   */
  handleClose = () => {
    // Reset the state
    this.setState({
      open: false,
      dialogState: STATE.INITIAL,
      selectedRequirement: {},
      requirements: [],
      refactoringCheckresult: null,
      applyToAll: false,
      applicableRequirementsNames: "",
      requirementsWithResponse: [],
      allVarsDefined: true,
      variableErrorMessages: [],
      destinationReqs: [],
    });
    this.state.dialogCloseListener();
  };


  /**
   * Updates the (boolean) state variable applyToAll, indicates 
   * if the user has selected that the extract requirement functionality 
   * should check all the requirements for the fragment to extract.
   * 
   */
  //Oisín: Not currently used
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


  getRequirementsWithResponse = () =>
  {
    var semantics = this.state.selectedRequirement.semantics;
    let self = this;

    if(semantics){
      var response = semantics.post_condition_SMV_pt;
      var component_name = semantics.component_name;

      var responseID = this.state.selectedRequirement.project+component_name+response;

      ipcRenderer.invoke('getRequirementsWithVariable', responseID).then((result) => {
        self.setState({
          requirementsWithResponse: result.rows
        })
      })

    }
  }

  //This will eventually be more elaborate, placeholder for now
  handleInitialOK = () => {
    this.setState({
      dialogState : STATE.TYPES,
    });
  }

  handleChooseDestination = (req) => {

    let destinationText = req.doc.fulltext;

    let semantics = this.state.selectedRequirement.semantics;
    let sourceResponse = semantics.post_condition_SMV_pt;
    //let sourceCondition = semantics.regular_condition_SMV_ft;
    let sourceCondition = semantics.pre_condition; //Oisín: This one is better, other ones add extra brackets

    let inlineResult = destinationText.replace(sourceResponse, sourceCondition);

    let destinationVarList = RefactoringUtils.getVariableNames(req.doc);
    let selectedVarList = RefactoringUtils.getVariableNames(this.state.selectedRequirement);
    let args = [req.doc.project, destinationVarList.concat(selectedVarList)];
    ipcRenderer.invoke('createVariableMap', args).then((result) => {

      let variableDocs = result[0];
      let variableTypeMap = result[1];
      
      this.setState({
        dialogState : STATE.TYPES,
        inlinedRequirementPlaceholder: inlineResult,
        inlinedName: req.doc.reqid,
        destinationReqs: [req],
        variableDocs: variableDocs,
        variables : variableTypeMap,
      }); 
    })

  }


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

      ipcRenderer.invoke('updateVariableTypes', [this.state.variableDocs, this.state.variables]);

      ipcRenderer.invoke('inlineRequirement', [this.state.selectedRequirement, this.state.destinationReqs, this.state.variables, this.state.requirements]).then((result) => {

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
  

    var { project, reqid, parent_reqid, rationale, ltl, semantics, fulltext, _id } = this.state.selectedRequirement

    var isFragment = (this.state.selectedRequirement.isFragment | (rationale && rationale.includes("EXTRACT REQUIREMENT: ") ))
    var requirementsWithResponse = this.state.requirementsWithResponse;

    var dialog_state = this.state.dialogState;

    //Funny placeholders
    var {inlinedRequirementPlaceholder, inlinedName} = this.state;

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
            <DialogTitle id="simple-dialog-title">  Inline Requirement: {reqid}</DialogTitle>

            <DialogContent>

              <DialogContentText>
                Response: {semantics ? semantics.post_condition_SMV_pt : ""}
                <br/>
                {isFragment ? "This is a fragment" : "This is not a fragment"}
              </DialogContentText>
              

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
                  This is a fragment. Would you like to inline it in place of the variable {semantics ? semantics.post_condition_SMV_pt : ""}?
                  
                  <Button
                    onClick={this.getRequirementsWithResponse}
                    color="secondary"
                  >
                    Yes  
                  </Button>

                </DialogContentText>

                : 
                <DialogContentText>
                This is not a fragment. Support coming soon!
                </DialogContentText>
              }


              <Grid container spacing={2}>

              {requirementsWithResponse.map(req => {

                if(req.doc.reqid != reqid){
                  return(//React yells at you if the items don't have unique keys
                    <Grid item xs={3} key={req.id}>
                      {req.doc.reqid}
                      <br/>
                      <TextField
                        id="definition"
                        multiline
                        fullWidth
                        spellCheck="false"
                        label="Definition"
                        value={req.doc.fulltext}
                      />

                      <Button
                      onClick={(event) => this.handleChooseDestination(req)}
                      color="secondary"
                      >
                        Inline here  
                      </Button>
                    </Grid>
                    )
                  }
                }

              )}

              </Grid>




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

        return(

          <Dialog
            open={this.state.open}
            onClose={this.handleClose}
            aria-labelledby="form-dialog-title"
            maxWidth="md"
          >
            <DialogTitle id="simple-dialog-title">  Inline Requirement: {reqid}</DialogTitle>

            <DialogContent>

              <DialogContentText>
                Please check the variable types listed below. Correct any that are wrong and update any that are "Unknown". Existing variable types are shown in the analysis portal.<br/>

                Mu-FRET will use the Integer type for both signed and Unsigned Integers. If a variable is already set to Unsigned Integer, the list will show a <ErrorOutlineIcon  fontSize="small" /> to warn you. <br/>

                Mu-FRET cannot check Single or Double typed variables, so they must be manually changed to Integers (including any literal values in a requirement, e.g. 2.4). If a variable is already set to Single or Double, then the list will show a <WarningIcon  fontSize="small" /> to warn you. <br/>

                If any variables are left with Unknown, Single, or Double type, pressing OK will provide a warning. You will not be able to proceed with the refactoring until the types are changed.
              </DialogContentText>
              
              {reqid}:
              <TextField
                id="definition"
                multiline
                fullWidth
                spellCheck="false"
                label="Definition"
                value={fulltext}
              />
                
              <br/>
              <br/>

              Inlined version of {inlinedName}:
              <TextField
                id="definition"
                multiline
                fullWidth
                spellCheck="false"
                label="Definition"
                value={inlinedRequirementPlaceholder}
              />


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
        <DialogTitle id="simple-dialog-title">  Sucessfully Inlined Requirement: {reqid}
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
        <DialogTitle id="simple-dialog-title">  Inline Requirement Failed: {reqid}
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

InlineRequirementDialog.propTypes = {
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
  (connect(mapStateToProps,mapDispatchToProps)(InlineRequirementDialog));
