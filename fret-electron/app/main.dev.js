// Copyright © 2025, United States Government, as represented by the Administrator of the National Aeronautics and Space Administration. All rights reserved.
// 
// The “FRET : Formal Requirements Elicitation Tool - Version 3.0” software is licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0. 
// 
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
/* eslint global-require: 0, flowtype-errors/show-errors: 0 */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import {leveldbDB, modelDB, system_DBkeys} from '../model/fretDB'
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
require('@electron/remote/main').initialize()
import MenuBuilder from './menu';
import FretModel from '../model/FretModel';

//Mu-FRET: Refactoring Tools
const refactoringModel = require("../../tools/Refactoring/refactoring_model");
const refactoringController = require("../../tools/Refactoring/refactoring_controller");


// console.log('main.dev __dirname: ', __dirname)
const path = require('path');
const fs = require("fs");

var fretModel = new FretModel();

let mainWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = [
    'REACT_DEVELOPER_TOOLS',
    'REDUX_DEVTOOLS'
  ];

  return Promise
    .all(extensions.map(name => installer.default(installer[name], {loadExtensionOptions: {allowFileAccess: true}, forceDownload: forceDownload})))
    .catch(console.log);
};


/**
 * Add controllers
 */

ipcMain.handle('closeFRET', async (evt, arg) => {
  app.quit();
})

// initialization
ipcMain.handle('initializeFromDB', async(evt, arg) => {
  // console.log('main.dev initializeFromDB arg: ', arg);
  const result = await fretModel.initializeFromDB();
  //console.log('main.dev initializeFromDB result return: ', result);
  return result
})

// project slice

ipcMain.handle('selectProject', async (evt, arg) => {
  // console.log('main.dev selectProject called, arg: ', arg);
  const result = await fretModel.selectProject(evt, arg);
  // console.log('*** main.dev selectProject result.completedComponents: ', result.completedComponents);
  // console.log('*** main.dev selectProject result.importedComponents: ', result.importedComponents);

  return result
})
ipcMain.handle('mapVariables', async (evt, components) => {
  const result = await fretModel.mapVariables(components);
  return result
})
// project slice

ipcMain.handle('selectProjectRequirements', async (evt, arg) => {
  return fretModel.selectProjectRequirements(arg);
})

ipcMain.handle('selectGlossaryVariables', async (evt, args) => {
  return fretModel.selectGlossaryVariables(...args);
})

ipcMain.handle('addProject', async (evt, arg) => {
  const result = await fretModel.addProject(evt, arg);
  //console.log('main.dev addProject result return: ', result);
  return result
})

ipcMain.handle('renameProject', async (evt, [oldName, newName]) => {
  const result = await fretModel.renameProject(oldName, newName);
  return result
})

ipcMain.handle('copyProject', async (evt, [oldName, newName]) => {
  const result = await fretModel.copyProject(oldName, newName);
  return result
})

ipcMain.handle('deleteProject', async (evt, arg) => {
  const result = await fretModel.deleteProject(evt, arg);
  //console.log('main.dev deleteProject result return: ', result);
  return result
})

ipcMain.handle('updateFieldColors', async (evt, arg) => {
  const result = await fretModel.updateFieldColors(evt, arg);
  //console.log('main.dev.js updateFieldColors result: ', result)
  return result
})

// requirement slice
ipcMain.handle('createOrUpdateRequirement', async(evt, arg) => {
  //console.log('main.dev createOrUpdateRequirement arg: ', arg);
  const result = await fretModel.createOrUpdateRequirement(evt, arg);
  //console.log('main.dev createOrUpdateRequirement result return: ', result);
  return result
})

ipcMain.handle('retrieveRequirement', async(evt, arg) => {
  const result = await fretModel.retrieveRequirement(evt, arg);
  //console.log('main.dev retrieveRequirement result: ', result);
  return result
})

ipcMain.handle('deleteRequirement', async (evt, arg) => {
  // console.log('main.dev deleteRequirement arg: ', arg);
  const result = await fretModel.deleteRequirement(evt, arg);
  return result
})

ipcMain.handle('importRequirements', async (evt, arg) => {
  const result = await fretModel.importRequirements(evt, arg)
  //console.log('main.dev importRequirements result: ', result);
  return result
})

ipcMain.handle('importRequirementsCsv', async (evt, arg) => {
  const result = await fretModel.importRequirementsCsv(evt, arg)
  return result
})

ipcMain.handle('formalizeRequirement', async (evt, arg) => {
  const result = await fretModel.formalizeRequirement(evt, arg);
  return result
})

ipcMain.handle('changeRequirementStatus', async (evt, arg) => {
  const result = await fretModel.changeRequirementStatus(evt, arg);
  return result
})

ipcMain.handle('exportRequirements', async (evt, arg) => {
  const result = await fretModel.exportRequirements(evt, arg);
  //console.log('exportRequirements: ', result)
  return result
})

ipcMain.handle('exportVariables', async (evt, arg) => {
  const result = await fretModel.exportVariables(evt, arg);
  //console.log('exportVariables: ', result)
  return result
})

ipcMain.handle('exportRequirementsAndVariables', async (evt, arg) => {
  const result = await fretModel.exportRequirementsAndVariables(evt, arg);
  //console.log('exportRequirementsAndVariables: ', result)
  return result
})

ipcMain.handle('selectVariable', async(evt, arg) => {
  const result = await fretModel.selectVariable(evt, arg);
  return result
})

ipcMain.handle('updateVariable_checkNewVariables', async(evt, arg) => {
  const result = await fretModel.updateVariable_checkNewVariables(evt, arg);
  return result
})

ipcMain.handle('updateVariable_noNewVariables', async(evt, arg) => {
  const result = await fretModel.updateVariable_noNewVariables(evt, arg);
  return result
})

ipcMain.handle('importComponent', async (evt, arg) => {
  // console.log('main.dev.js starting importComponent')
  const result = await fretModel.importComponent(evt, arg);
  // console.log('main.dev.js returning importComponent')
  return result
})

ipcMain.handle('exportComponent', async (evt, arg) => {
  const result = await fretModel.exportComponent(evt, arg);
  return result
})

ipcMain.handle('exportTestObligations', async (evt, arg) => {
  const result = await fretModel.exportTestObligations(evt, arg);
  return result
})

ipcMain.handle('selectCorspdModelComp', async (evt, arg) => {
  const result = await fretModel.selectCorspdModelComp(evt, arg);
  return result
})

// realizability

ipcMain.handle('selectRealizabilityComponent', async (evt, arg) => {
  const result = await fretModel.selectRealizabilityComponent(evt, arg);
  return result
})

ipcMain.handle('updateConnectedComponents', async (evt, arg) => {
  const result = await fretModel.updateConnectedComponents(evt, arg);
  return result
})

ipcMain.handle('ltlsimSaveJson', async (evt, arg) => {
  const result = await fretModel.ltlsimLoadProject(evt, arg);
  return result
})

ipcMain.handle('checkRealizabilityDependencies', async(evt) => {
  const result = await fretModel.checkRealizabilityDependencies(evt);
  return result
})

ipcMain.handle('checkRealizability', async (evt, args) => {
  const result = await fretModel.checkRealizability(evt, args);
  return result
})

ipcMain.handle('diagnoseUnrealizableRequirements', async (evt, args) => {
  const result = await fretModel.diagnoseUnrealizableRequirements(evt, args);
  return result
})

ipcMain.handle('calculateProjectSemantics', async(evt, projectName) => {
  return fretModel.calculateProjectSemantics(projectName);
})

//test case generation

// ipcMain.handle('identifyBooleanOnlyComponents', async(evt, arg) => {
//   const result = await fretModel.identifyBooleanOnlyComponents(evt, arg);
//   return result
// })

ipcMain.handle('checkTestGenDependencies', async(evt) => {
  const result = await fretModel.checkTestGenDependencies(evt);
  return result
})

ipcMain.handle('selectTestGenComponent', async (evt, arg) => {
  const result = await fretModel.selectTestGenComponent(evt, arg);
  return result
})

ipcMain.handle('generateTests', async (evt, arg) => {
  const result = await fretModel.generateTests(evt, arg);
  return result
})

//Mu-FRET additions:

//Oisín: Added in a Mu-FRET update to get VersionDialog working with the new IPC paradigm
ipcMain.handle('getVersion', async(evt) => {
  const result = app.getVersion();
  return result;
})

//Oisín: used in InlineRequirementDialog
ipcMain.handle('getRequirementsWithVariable', async(evt, variableID) => {
  const result = await refactoringModel.getRequirementsWithVariable(variableID);
  return result;
})

//Oisín: used in RefactorRequirementDialog for ApplyToAll
//  args for this one are: [allRequirements, req, fragment,  destinationName]
ipcMain.handle('requirementsWithFragment', async(evt, args) => {
  const result = await refactoringController.requirementsWithFragment(...args);
  return result;
})

//Oisín: used in InlineRequirementDialog and RefactorRequirementDialog
// args for this one are [projectName, variableNameList]
ipcMain.handle('createVariableMap', async(evt, args) => {
  const result = await refactoringModel.createVariableMap(args);
  return result;
})

//Oisín: Used for refactoring to add the selected variable types to the
// variables in the database.
ipcMain.handle('updateVariableTypes', async(evt, args) => {
  return refactoringController.updateVariableTypes(...args);
})


ipcMain.handle('extractRequirement', async(evt, args, applyToAll) => {
  let result;
  if (applyToAll == true)
  {
    result = await refactoringController.extractRequirement_ApplyAll(...args);
  }
  else {
    // Now this needs all the requirements too, to pass to the compare method
    result = await refactoringController.extractRequirement(...args);
  }

  return result;

})

ipcMain.handle('inlineRequirement', async(evt, args) => {
  return refactoringController.InlineRequirement(...args);
})

ipcMain.handle('renameRequirement', async(evt, args) => {
  return refactoringController.RenameRequirement(...args);
})

ipcMain.handle('renameVariable', async(evt, args) => {
  return refactoringController.RenameVariable(...args);
})


//Oisín: Added for debugging, since it's impossible to parse anything printed from the
// main process (gets put in the command line rather than the electron console)
ipcMain.handle('fetchModelDatabase', async() => {
  return refactoringModel.fetchModelDatabase();
})

//Oisín: Takes in a requirement and returns the docs of its children, i.e. requirements
//in the same project that have that requirement's reqid in their "parent_reqid" field
ipcMain.handle('getChildRequirements', async(evt, requirement) => {
  return refactoringModel.getChildRequirements(requirement);
})

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


app.on('ready', async () => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    await installExtensions();
  }

  try {
    // console.log('main.dev __dirname: ', __dirname)
    mainWindow = new BrowserWindow({

      webPreferences: {
        nodeIntegration: true,   // remove for context isolation
        enableRemoteModule: true,   // remove for context isolation
        contextIsolation: false, // add this for context isolation
        //preload: path.join(__dirname,'preload.js'),   // add this for context isolation
      },
      show: false,
      width: 1200,
      height: 1050
    });
  } catch(error){
    console.log(`Error in main.dev : ${error}`);
  }
  require('@electron/remote/main').enable(mainWindow.webContents)
  mainWindow.loadURL(`file://${__dirname}/app.html`);

/*
  if(process.env.EXTERNAL_TOOL=='1'){
    var splash = new BrowserWindow({
      width: 800,
      height: 600,
      transparent: true,
      frame: false,
      alwaysOnTop: true
    });

    splash.loadFile('FRETsplash.html');
    splash.center();
    setTimeout(function () {
      splash.close();
      mainWindow.center();
    }, 2000);
} */

  ipcMain.on('closeFRET', (evt, arg) => {
    //console.log('main received closeFRET')
    app.quit();
  })

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('enter-full-screen', () =>  {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Fullscreen',
      message: 'To exit fullscreen mode, press F11 (Windows, Linux) or Ctrl+Cmd+F (MacOS).'
    })
  })

  mainWindow.on('closed', () => {
    mainWindow = null;
    leveldbDB.close();
    modelDB.close();
  });

  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault()
    const win = new BrowserWindow({show: false})
    win.once('ready-to-show', () => win.show())
    win.loadURL(url)
    event.newGuest = win
  })

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});
