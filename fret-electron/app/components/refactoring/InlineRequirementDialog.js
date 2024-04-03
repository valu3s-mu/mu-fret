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


import RefactoringController from '../../../../tools/Refactoring/refactoring_controller';
import RefactoringUtils from '../../../../tools/Refactoring/refactoring_utils';


const sharedObj = require('electron').remote.getGlobal('sharedObj');
const db = sharedObj.db;
const modeldb = sharedObj.modeldb;
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
    refactoringType: '',
    refactoringContent: ' ',
    extractString: 'default extract string',
    requirements: [],
    refactoringCheckresult: null,
    variableDocs : {},
    //New variables for invalid fragments
    fragmentNotFoundinSelected: false,
    fragmentNotFoundInAll: false,
    //String with the IDs of any requirements to be refactored
    applicableRequirementsNames: "",
    //Testing out putting this in the state instead of a variable
    requirementsWithResponse: [],
    //Funny placeholders
    inlinedRequirementPlaceholder: "",
    inlinedName: ""
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
    this.setState({
      open: false,
      dialogState: STATE.INITIAL,
      selectedRequirement: {},
      requirements: [],
      refactoringCheckresult: null,
      applyToAll: false, refactoringType: '',
      refactoringContent: '',
      fragmentNotFoundinSelected: false,
      fragmentNotFoundinAll: false,
      applicableRequirementsNames: "",
      requirementsWithResponse: [],
    });
    this.state.dialogCloseListener();
  };

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


  getRequirementsWithResponse = () =>
  {
    var semantics = this.state.selectedRequirement.semantics;
    let self = this;

    if(semantics){
      var response = semantics.post_condition_SMV_pt;
      var component_name = semantics.component_name;


      var responseID = this.state.selectedRequirement.project+component_name+response;
      console.log(responseID)

      modeldb.get(responseID).then(function(result){
        
        console.log(result);
        console.log(result.reqs);
        
        db.allDocs({
          include_docs: true,
          keys: result.reqs
        }).then(function(result){
          console.log(result.rows);
          self.setState({
            requirementsWithResponse: result.rows
          })
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
    let sourceCondition = semantics.regular_condition_SMV_ft

    let inlineResult = destinationText.replace(sourceResponse, sourceCondition);

    this.setState({
      dialogState : STATE.TYPES,
      inlinedRequirementPlaceholder: inlineResult,
      inlinedName: req.doc.reqid,
    });
  }

  render() 
  {
  

    var { project, reqid, parent_reqid, rationale, ltl, semantics, fulltext, _id } = this.state.selectedRequirement

    var isFragment = (this.state.selectedRequirement.isFragment | (rationale && rationale.includes("EXTRACT REQUIREMENT: ") ))
    var requirementsWithResponse = this.state.requirementsWithResponse;
    console.log(requirementsWithResponse);

    var dialog_state = this.state.dialogState;
    console.log("New Inline Dialog State = " + dialog_state);

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
                    label="Definition"
                    value={fulltext} />
                </Grid>

              </Grid>

              {isFragment ? 

                <DialogContentText>
                  This is a fragment. Would you like to inline it in place of the variable {semantics.post_condition_SMV_pt}?
                  
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

                return(//React yells at you if the items don't have unique keys
                  <Grid item xs={3} key={req.id}>
                    {req.doc.reqid}
                    <br/>
                    <TextField
                      id="definition"
                      multiline
                      fullWidth
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

        return(

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
                    label="Definition"
                    value={fulltext} />
                </Grid>

              </Grid>


              Inlined version of {inlinedName}:
              <br/>
              <TextField
                id="definition"
                multiline
                fullWidth
                label="Definition"
                value={inlinedRequirementPlaceholder}
              />


            </DialogContent>

            <DialogActions>

              <Button onClick={this.handleClose} color="secondary">
                Cancel
              </Button>
              <Button
                onClick={this.handleClose}
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

InlineRequirementDialog.propTypes = {
  selectedRequirement: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  handleDialogClose: PropTypes.func.isRequired,
  requirements: PropTypes.array
};

export default withStyles(styles)(InlineRequirementDialog);
