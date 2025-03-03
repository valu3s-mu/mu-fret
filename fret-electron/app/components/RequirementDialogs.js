// *****************************************************************************
// Notices:
//
// Copyright © 2019, 2021 United States Government as represented by the Administrator
// of the National Aeronautics and Space Administration. All Rights Reserved.
//
// Disclaimers
//
// No Warranty: THE SUBJECT SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF
// ANY KIND, EITHER EXPRESSED, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED
// TO, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL CONFORM TO SPECIFICATIONS,
// ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
// OR FREEDOM FROM INFRINGEMENT, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL BE
// ERROR FREE, OR ANY WARRANTY THAT DOCUMENTATION, IF PROVIDED, WILL CONFORM TO
// THE SUBJECT SOFTWARE. THIS AGREEMENT DOES NOT, IN ANY MANNER, CONSTITUTE AN
// ENDORSEMENT BY GOVERNMENT AGENCY OR ANY PRIOR RECIPIENT OF ANY RESULTS,
// RESULTING DESIGNS, HARDWARE, SOFTWARE PRODUCTS OR ANY OTHER APPLICATIONS
// RESULTING FROM USE OF THE SUBJECT SOFTWARE.  FURTHER, GOVERNMENT AGENCY
// DISCLAIMS ALL WARRANTIES AND LIABILITIES REGARDING THIRD-PARTY SOFTWARE, IF
// PRESENT IN THE ORIGINAL SOFTWARE, AND DISTRIBUTES IT ''AS IS.''
//
// Waiver and Indemnity:  RECIPIENT AGREES TO WAIVE ANY AND ALL CLAIMS AGAINST
// THE UNITED STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS
// ANY PRIOR RECIPIENT.  IF RECIPIENT'S USE OF THE SUBJECT SOFTWARE RESULTS IN
// ANY LIABILITIES, DEMANDS, DAMAGES, EXPENSES OR LOSSES ARISING FROM SUCH USE,
// INCLUDING ANY DAMAGES FROM PRODUCTS BASED ON, OR RESULTING FROM, RECIPIENT'S
// USE OF THE SUBJECT SOFTWARE, RECIPIENT SHALL INDEMNIFY AND HOLD HARMLESS THE
// UNITED STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY
// PRIOR RECIPIENT, TO THE EXTENT PERMITTED BY LAW.  RECIPIENT'S SOLE REMEDY FOR
// ANY SUCH MATTER SHALL BE THE IMMEDIATE, UNILATERAL TERMINATION OF THIS
// AGREEMENT.
// *****************************************************************************
import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import Snackbar from '@material-ui/core/Snackbar';
import CloseIcon from '@material-ui/icons/Close';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';

import DisplayRequirementDialog from './DisplayRequirementDialog';
import CreateRequirementDialog from './CreateRequirementDialog';
import DeleteRequirementDialog from './DeleteRequirementDialog';

import RefactorRequirementDialog from './refactoring/RefactorRequirementDialog';
import InlineRequirementDialog from './refactoring/InlineRequirementDialog';
import RenameRequirementDialog from './refactoring/RenameRequirementDialog';
import RenameVariableDialog from './refactoring/RenameVariableDialog';


const styles = theme => ({
});

class RequirementDialogs extends React.Component {
  state = {
    createDialogOpen: false,
    deleteDialogOpen: false,
    snackbarOpen: false,
    snackBarDisplayInfo: {},
    refactorDialogOpen: false,
    inlineDialogOpen: false,
    renameRequirementDialogOpen: false,
    renameVariableDialogOpen: false,
  };

  constructor(props){
    super(props);
  }

  handleCreateDialogOpen = () => {
    this.setState({
      createDialogOpen: true
    });
  }

  handleDeleteDialogClose = () => {
    this.setState({
      deleteDialogOpen: false
    });
  }

  handleDeleteDialogOpen = () => {
    this.setState({
      deleteDialogOpen: true
    });
  }

  handleCreateDialogClose = (requirementUpdated, newReqId, actionLabel) => {
    this.setState({
      createDialogOpen: false,
      snackbarOpen: requirementUpdated,
      snackBarDisplayInfo: {
        modifiedReqId: newReqId,
        action: actionLabel
      }
    });
  }

  handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    this.setState({ snackbarOpen: false });
  };

  /*
  ****Refactoring:
  */
  handleRefactorDialogOpen = () => {
    console.log('handleRefactorDialogOpen');
    this.setState({ refactorDialogOpen: true });
  }

  handleRefactorDialogClose = () => {
    this.setState({refactorDialogOpen: false});
  }

  handleInlineDialogOpen = () => {
    this.setState({inlineDialogOpen: true });
  }

  handleInlineDialogClose = () => {
    this.setState({inlineDialogOpen: false});
  }

  handleRenameRequirementDialogOpen = () => {
    this.setState({renameRequirementDialogOpen: true });
  }

  handleRenameRequirementDialogClose = () => {
    this.setState({renameRequirementDialogOpen: false});
  }

  handleRenameVariableDialogOpen = () => {
    this.setState({renameVariableDialogOpen: true });
  }

  handleRenameVariableDialogClose = () => {
    this.setState({renameVariableDialogOpen: false});
  }

  render() {
    const {
      classes, selectedProject, listOfProjects, selectedRequirement, handleDialogClose
    } = this.props;
    const { snackBarDisplayInfo } = this.state;
    return (
      <div>
        <DisplayRequirementDialog
          selectedRequirement={selectedRequirement}
          open={this.props.displayRequirementOpen}
          handleDialogClose={this.props.handleDialogClose}
          handleCreateDialogOpen={this.handleCreateDialogOpen}
          handleDeleteDialogClose={this.handleDeleteDialogClose}
          handleDeleteDialogOpen={this.handleDeleteDialogOpen}
          handleRefactorDialogOpen={this.handleRefactorDialogOpen}
          handleInlineDialogOpen={this.handleInlineDialogOpen}
          handleRenameRequirementDialogOpen={this.handleRenameRequirementDialogOpen}
          handleRenameVariableDialogOpen={this.handleRenameVariableDialogOpen}
        />
        <CreateRequirementDialog
          open={this.state.createDialogOpen}
          handleCreateDialogClose={this.handleCreateDialogClose}
          selectedProject={selectedProject}
          editRequirement={selectedRequirement}
        // TODO: Update eventually
          addChildRequirementToParent={null}
          listOfProjects={listOfProjects}
          requirements={this.props.requirements}
        />
        <DeleteRequirementDialog
          open={this.state.deleteDialogOpen}
          requirementsToBeDeleted={[selectedRequirement]}
          handleDialogClose={this.handleDeleteDialogClose}
        />
        <RefactorRequirementDialog
          selectedRequirement={selectedRequirement}
          open={this.state.refactorDialogOpen}
          handleDialogClose={this.handleRefactorDialogClose}
          requirements={this.props.requirements}
        />
        <InlineRequirementDialog
          selectedRequirement={selectedRequirement}
          open={this.state.inlineDialogOpen}
          handleDialogClose={this.handleInlineDialogClose}
          requirements={this.props.requirements}
        />
        <RenameRequirementDialog
          selectedRequirement={selectedRequirement}
          open={this.state.renameRequirementDialogOpen}
          handleDialogClose={this.handleRenameRequirementDialogClose}
          requirements={this.props.requirements}
        />
        <RenameVariableDialog
          selectedRequirement={selectedRequirement}
          open={this.state.renameVariableDialogOpen}
          handleDialogClose={this.handleRenameVariableDialogClose}
          requirements={this.props.requirements}
        />

        <Snackbar
          anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
          open={this.state.snackbarOpen}
          autoHideDuration={2000}
          onClose={this.handleSnackbarClose}
          snackbarcontentprops={{
          'aria-describedby': 'message-id',
        }}
          message={<span id="message-id">Requirement Updated</span>}
          action={[
            <Button key="undo" color="secondary" size="small" onClick={this.handleSnackbarClose}>
              {this.state.snackBarDisplayInfo.modifiedReqId}
            </Button>,
            <IconButton
              key="close"
              aria-label="Close"
              color="inherit"
              onClick={this.handleSnackbarClose}
            >
            <CloseIcon />
          </IconButton>,
        ]} />
      </div>
    );
  }
}


RequirementDialogs.propTypes = {
  classes: PropTypes.object.isRequired,
  selectedProject: PropTypes.string.isRequired,
  selectedRequirement: PropTypes.object.isRequired,
  listOfProjects: PropTypes.array.isRequired,
  displayRequirementOpen: PropTypes.bool.isRequired,
  handleDialogClose: PropTypes.func.isRequired,
  requirements: PropTypes.array.isRequired
};

export default withStyles(styles)(RequirementDialogs);
