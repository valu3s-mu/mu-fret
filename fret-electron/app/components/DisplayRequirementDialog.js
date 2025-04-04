// Copyright © 2025, United States Government, as represented by the Administrator of the National Aeronautics and Space Administration. All rights reserved.
// 
// The “FRET : Formal Requirements Elicitation Tool - Version 3.0” software is licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0. 
// 
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import TextField from '@material-ui/core/TextField';
import Divider from '@material-ui/core/Divider';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import ImageList from '@material-ui/core/ImageList';
import ImageListItem from '@material-ui/core/ImageListItem';
import ImageListItemBar from '@material-ui/core/ImageListItemBar';
import Tooltip from '@material-ui/core/Tooltip';

import BuildIcon from '@material-ui/icons/Build';
import Menu from '@material-ui/core/Menu';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';

import FRETtoWESTConverter from '../../../tools/FRET to WEST Conversion/JS_FRET_to_WEST_MLTL_Converter_beta';

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

class DisplayRequirementDialog extends React.Component {
  state = {
    open: false,
    selectedRequirement: {},
    refactorAnchorEl: null,
    MLTLObjectForWEST: null,
  };

  handleClose = () => {
    this.setState({ open: false, refactorAnchorEl: null, MLTLObjectForWEST: null});
    this.state.dialogCloseListener();
  };

  handleUpdateRequirement = () => {
    console.log('handleUpdateREquirement called');
    this.handleClose();
    this.state.openCreateDialog();
  }

  handleDeleteRequirement = () => {
    this.handleClose();
    this.state.openDeleteDialog();
  }


  /**
   * Refactoring:
   */
  handleRefactorMenuClick = (event) => {
    this.setState({ refactorAnchorEl: event.currentTarget});
  };

  handleRefactorMenuClose = () => {
    this.setState({refactorAnchorEl: null});
  };

  handleRefactorRequirement = () => {
    this.handleClose();
    this.state.openRefactorDialog();
    //Oisín: I don't think there's any actual need to set the function to a state variable
    //(calling it as a prop seems to work fine), but I think it's best to follow
    //the existing format
  }

  handleInlineRequirement = () => {
    this.handleClose();
    this.state.openInlineDialog();
    //Oisín: I don't think there's any actual need to set the function to a state variable
    //(calling it as a prop seems to work fine), but I think it's best to follow
    //the existing format
  }

  handleRenameRequirement = () => {
    this.handleClose();
    this.state.openRenameRequirementDialog();
  }

  handleRenameVariable = () => {
    this.handleClose();
    this.state.openRenameVariableDialog();
  }


  /**
   * Conversion to WEST
   */
  handleWESTConversion = (ltlFormula) => {
    let result = FRETtoWESTConverter.fretToMltlConverter(ltlFormula);
    this.setState({MLTLObjectForWEST: result});
  }

  componentWillReceiveProps = (props) => {
    // console.log('DisplayRequirementDialog.componentWillReceiveProps selectedRequirement', props.selectedRequirement)
    this.setState({
      selectedRequirement: props.selectedRequirement,
      open: props.open,
      dialogCloseListener : props.handleDialogClose,
      openCreateDialog: props.handleCreateDialogOpen,
      openDeleteDialog: props.handleDeleteDialogOpen,
      openRefactorDialog: props.handleRefactorDialogOpen,
      openInlineDialog: props.handleInlineDialogOpen,
      openRenameRequirementDialog: props.handleRenameRequirementDialogOpen,
      openRenameVariableDialog: props.handleRenameVariableDialogOpen,
    })
  }

  renderFormula(ltlFormula, ltlDescription, ltlFormulaPt, diagramVariables, path) {
    const { classes } = this.props;
    if (ltlFormula || ltlFormulaPt)
    return(
      <div>
        <Typography variant='button'>
        Semantic Description
        </Typography>
        <br />
        <div id="qa_disReq_div_semDesc" color='primary' variant='body1'
        dangerouslySetInnerHTML={{ __html: ltlDescription}} />
        <br />
        <Typography variant='button'>
        Semantic Diagram
        </Typography>
        <div className={classes.imgWrap}>
        <img id="qa_disReq_div_semImg" src= {path}/>
        </div>
        <div id="qa_disReq_div_semDiagram" className={classes.variableDescription}
        dangerouslySetInnerHTML={{ __html: diagramVariables}} />
        <br />
        <Typography variant='button' color='primary'>
        Future Time Formula
        </Typography>
        <br />
        <div id="qa_disReq_div_futureTime" className={classes.formula}
        dangerouslySetInnerHTML={{ __html: ltlFormula}} />
        <Typography variant='button' color='primary'>
        <br />
        Past Time Formula
        </Typography>
        <br />
        <div id="qa_disReq_div_pastTime" className={classes.formula}
        dangerouslySetInnerHTML={{ __html: ltlFormulaPt}} />
        <br />
      </div>)
    else
      return(
        <div>
          <Typography variant='button'>Formalization</Typography>
          <br />
          <Typography variant='body1' color='primary'>Not Applicable</Typography>
        </div>)
  }

  render() {
    const {classes} = this.props;
    // console.log('DisplayRequirementDialog.render state selectedRequirement', this.state.selectedRequirement)
    // console.log('DisplayRequirementDialog.render props selectedRequirement', this.props.selectedRequirement)
    var { project, reqid, parent_reqid, rationale, ltl, semantics, fulltext } = this.props.selectedRequirement
    const reqidLabel = (reqid ? reqid : "None")
    const projectLabel = project ? project : "None"
    var ltlFormula = ltl ? ltl : (semantics ? semantics.ftExpanded : undefined);
    var ltlFormulaPt = (semantics ? semantics.ptExpanded : undefined);
    var diagramVariables = (semantics ? semantics.diagramVariables : undefined);
    var path = (semantics ? (`../docs/`+ semantics.diagram) : undefined);
    var ltlDescription = semantics ? (semantics.description ? semantics.description : "No description available.") : "No description available.";
    if (!rationale) rationale = 'Not specified'
    if (!parent_reqid) parent_reqid = 'Not specified'
    fulltext += '.'
    let MLTLObjectForWEST = this.state.MLTLObjectForWEST;
    return (
      <div>
        <Dialog
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="form-dialog-title"
          maxWidth="md"
        >
        <DialogTitle>
          <ImageList rowHeight='auto' cols={2}>
            <ImageListItem>
              <div style={{display:'flex'}}>
                <Tooltip title={reqidLabel} id="qa_disReq_dt_reqId">
                  <Typography noWrap variant='h6' id="qa_disReq_dt_reqId">{reqidLabel}</Typography>
                </Tooltip>
                <IconButton id="qa_disReq_ic_edit" onClick={this.handleUpdateRequirement} size="small" color="secondary" aria-label="edit" >
                  <Tooltip id="tooltip-icon-edit" title="Edit Requirement">
                    <EditIcon />
                  </Tooltip>
                </IconButton>
                <IconButton id="qa_disReq_ic_refactor" onClick={this.handleRefactorMenuClick} size="small" color="default" aria-label="refactor" >
                  <Tooltip id="tooltip-icon-build" title="Refactor Requirement">
                    <BuildIcon />
                  </Tooltip>
                </IconButton>
                <IconButton id="qa_disReq_ic_delete" onClick={this.handleDeleteRequirement} size="small" aria-label="delete" >
                  <Tooltip id="tooltip-icon-delete" title="Delete Requirement">
                    <DeleteIcon color='error'/>
                  </Tooltip>
                </IconButton>
              </div>
            </ImageListItem>
            <ImageListItem>
              <Tooltip title={projectLabel} id="qa_disReq_dt_project">
                <Typography noWrap variant='h6' style={{textAlign: 'right'}}>{projectLabel}</Typography>
              </Tooltip>
            </ImageListItem>
          </ImageList>
        </DialogTitle>
          <//Oisín: Menu to select refactoring method to be applied
             Menu
              id="refactor-menu"
              anchorEl={this.state.refactorAnchorEl}
              open={Boolean(this.state.refactorAnchorEl)}
              onClose={this.handleRefactorMenuClose}
            >
              <MenuItem
                onClick={this.handleRefactorRequirement}
                dense
                >
                <ListItemText primary = "Extract Requirement" />
              </MenuItem>

              <MenuItem
                onClick={this.handleInlineRequirement}
                dense
                >
                <ListItemText primary = "Inline Requirement" />
              </MenuItem>

              <MenuItem
                onClick={this.handleRenameRequirement}
                dense
                >
                <ListItemText primary = "Rename Requirement" />
              </MenuItem>

              <MenuItem
                onClick={this.handleRenameVariable}
                dense
                >
                <ListItemText primary = "Rename Variable" />
              </MenuItem>
            </Menu>
          
          <Divider/>
          <DialogContent>
            <br />
            <ImageList cols={1} rowHeight="auto"  gap={10}>
              <ImageListItem>
                <Typography variant='button'>Rationale</Typography><br/>
                <Typography id="qa_disReq_typ_rationale" color='primary' variant='body1'>{rationale}</Typography>
              </ImageListItem>
              <ImageListItem>
                <Typography variant='button'>Requirement</Typography><br/>
                <Typography id="qa_disReq_typ_req" color='primary' variant='body1'>{fulltext}</Typography>
              </ImageListItem>
              <ImageListItem>
                {this.renderFormula(ltlFormula, ltlDescription, ltlFormulaPt, diagramVariables, path)}
              </ImageListItem>
            </ImageList>

            {ltlFormula ? //This ternary statement prevents the button from appearing for an empty or invalid requirement
              <Button
                onClick={(event) => this.handleWESTConversion(ltlFormula)}
                color="secondary"
              >
                Convert to WEST
              </Button>
              :
              <div></div>
            }
            {//Pressing the button above updates MTLObjectForWEST, which allows this section to render
              MLTLObjectForWEST ?
              <div>
                <Typography variant='button' color='primary'>
                MLTL OUTPUT
                </Typography>
                <br/>
                {MLTLObjectForWEST.formula}
                <br/>
                <br/>
                <Typography variant='button' color='primary'>
                Variable Mapping
                </Typography>
                <br/>
                {Object.entries(MLTLObjectForWEST.variableMap).map(mapPair => {
                    return(
                      <div key={mapPair}>
                      {mapPair[1] + ": " + mapPair[0]}
                      <br/>
                      </div>
                      )
                  })
                }
                <br/>
                <Typography variant='button' color='primary'>
                Ignored Time Operators
                </Typography>
                <br/>
                {MLTLObjectForWEST.ignoredSymbols.map(symbolsObject => {
                  return(
                    <div key={symbolsObject.symbol}>
                    {symbolsObject.symbol + ": "} {symbolsObject.meaning}
                    <br/>
                    </div>
                    )
                  })
                }
                <br/>
                <Typography variant='button' color='primary'>
                Conversion Steps
                </Typography>
                <br/>
                {MLTLObjectForWEST.steps.map(stepObject => {
                  return(
                    <div key={stepObject.step}>
                    <i>{stepObject.step + ": "}</i> {stepObject.formula}
                    <br/>
                    </div>
                    )
                  })
                }
              </div>
              :
              <div></div>
            }


          </DialogContent>
          <DialogActions>
            <Button id="qa_disReq_btn_close" onClick={this.handleClose} color="secondary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

DisplayRequirementDialog.propTypes = {
  selectedRequirement: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  handleDialogClose: PropTypes.func.isRequired,
  handleCreateDialogOpen: PropTypes.func.isRequired,
  handleDeleteDialogOpen: PropTypes.func.isRequired,
  handleRefactorDialogOpen: PropTypes.func.isRequired,
  handleInlineDialogOpen: PropTypes.func.isRequired,
  handleRenameRequirementDialogOpen: PropTypes.func.isRequired,
  handleRenameVariableDialogOpen: PropTypes.func.isRequired,
};

export default withStyles(styles)(DisplayRequirementDialog);
