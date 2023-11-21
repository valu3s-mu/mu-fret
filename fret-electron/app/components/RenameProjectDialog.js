/**
 * A dialogue for renaming a project
 * @author Oisín Sheridan
 * November 2023
 */


import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
const modelDbSupport = require('../../support/modelDbSupport/deleteVariables.js');
const dbSupport = require('../../support/fretDbSupport/deleteRequirements.js');

import { setChangeRequirementFlag } from "../../support/fretDbSupport/changeRequirementFlag.js";

const db = require('electron').remote.getGlobal('sharedObj').db;
const modeldb = require('electron').remote.getGlobal('sharedObj').modeldb;

class RenameProjectDialog extends React.Component {
  state = {
    open: false,
    project: '',
    newProjectName: ''
  };

  handleTextFieldChange = (event) => {
    this.setState({
      newProjectName: event.target.value,
    });

    //console.log(event.target.value);
    //console.log(this.state.newProjectName);
  };

  handleClose = () => {
    this.setState({ open: false });
    this.state.dialogCloseListener();
  };

  handleCloseOKtoRename = () => {
    const self = this;
    const {project} = this.state; 
    const {newProjectName} = this.state;
    this.setState({ open: false});
    this.state.dialogCloseListener();


    //Find all requirements in the project, and push them back with the new project name
    db.find({
      selector: {
        project: this.state.project,
      }
    }).then(function (moveReqsList){
        
      moveReqsList.docs.forEach(r => {

        db.put({
          ...r,
          project: newProjectName,
        });
      }) 

    })

    //Find all variables in the project, and push them back with the new project name and a new id
    modeldb.find({
      selector: {
        project: this.state.project,
      }
    }).then(function (moveVarsList){

      self.cloneVariablesToNewProject(moveVarsList, newProjectName);

    })


   //Get the list of projects, find the old name and replace it with the new one.
   //Then put the altered list back into the database.
   db.get('FRET_PROJECTS').then((doc) => {
     const list = doc.names
     const index = list.indexOf(project);
     if (index > -1) {
       list[index] = newProjectName;
     }else{
      console.log("ERROR: original project name not found");
      console.log(project);
      console.log(list);
      return;
     }
     return db.put({
       _id: 'FRET_PROJECTS',
       _rev: doc._rev,
       names: list
     }).then(() => { //I think I'll need to change this so it goes back to the newly-renamed project if that was selected before
      if(this.props.selectedProject === project) {
        this.props.initializeSelectedProject();
      }
    })
   }).catch((err) => {
     console.log(err);
   });
  };


  cloneVariablesToNewProject = (moveVarsList, newProjectName) => {

    moveVarsList.docs.forEach(v => {

      let modeldbid = newProjectName + v.component_name + v.variable_name;

      let newVariable = {
        ...v,
        _id: modeldbid,
        project: newProjectName,
      };

      delete newVariable._rev;

      modeldb.remove(v);
      modeldb.put(newVariable);
    })
  }


  componentWillReceiveProps = (props) => {
    this.setState({
      open: props.open,
      project: props.projectTobeRenamed,
      dialogCloseListener : props.handleDialogClose,
    })
  }

  render() {
    if (!this.state.project) return null //I'm almost certain this line is useless, but it's in Delete so I'm leaving it here too.

    const projectid = this.state.project;
    return (
      <div>
        <Dialog
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"Renaming " + projectid + ":"}</DialogTitle>
          <DialogContent>
            <Grid style={{ textAlign: 'right' }} item xs={3}>
              New title:
            </Grid>
            <Grid item xs={9}>
              <TextField
                id="newTitle"
                fullWidth
                autoFocus
                label="New Project Title"
                onChange={this.handleTextFieldChange}
                />
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button id="qa_renameProj_btn_cancel" onClick={this.handleClose} color="primary">
              Cancel
            </Button>
            <Button id="qa_renameProj_btn_ok" onClick={this.handleCloseOKtoRename} color="primary" autoFocus>
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

RenameProjectDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  projectTobeRenamed: PropTypes.string.isRequired,
  handleDialogClose: PropTypes.func.isRequired,
}
export default RenameProjectDialog;
