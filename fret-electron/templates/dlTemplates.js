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

const fretTemplatesPath = "./"
const ed = require(fretTemplatesPath + 'templateEditor')

function makeTemplates() {

let dlTemplates = []
// =========================== R1
ed.newTemplate("template-dl-threshold1", "DL: Threshold at sample time");
ed.templateSummary("Whenever the sample time is reacheed (cRL >= tS) and the threshold is maintained, \
	the RL agent chooses and action that ensures that the worst case reaction of the overall system, \
	within one sample time still maintains the safety threshold.");
ed.templateStructure("when ([clockTime] >= [sampleTime]) & ([threshold]) RLAgent shall immediately satisfy chooseAction & ([var] + [worst case reaction] ) [thresholdComparison]");


ed.fieldDescription("clockTime", "The clock's time.");
ed.addOption("clockTime", "cRL", "Replace with clock variable name.");

ed.fieldDescription("sampleTime", "The sample time.");
ed.addOption("sampleTime", "sampleTime",  "Replace with sample time variable name.");

ed.fieldDescription("var", "The controlled variable.")
ed.addOption("var", "controlledVariable", "replace with the controlled variable.")


ed.fieldDescription("threshold", "var ~ Threshold");
ed.addOption("threshold", "var < threshold", "var less than threshold");
ed.addOption("threshold", "var <= threshold", "var less than or equal to threshold");
//ed.addOption("threshold", "var > threshold", "var greater than threshold");
//ed.addOption("threshold", "var >= threshold", "var greater than or equal to threshold");
// wcrection([state], [action], [ts])

//ed.fieldDescription("state", "The state for the worst-case reaction function.")
//ed.addOption("state", "state", "Replace with state.")

//ed.fieldDescription("action", "The action for the worst-case reaction function")
//ed.addOption("action", "action","Replace with action")

ed.fieldDescription("thresholdComparison","Comparison to the threshold variable.")
ed.addOption("thresholdComparison", "< threshold", "less than threshold");
ed.addOption("thresholdComparison", "<= threshold", "less than or equal to threshold");
ed.addOption("thresholdComparison", "> threshold", "greater than threshold");
ed.addOption("thresholdComparison", ">= threshold", "greater than or equal to threshold");


ed.fieldDescription("worst case reaction", "The worst-case reaction function. Usually this is defined as the realtion between the state, and action, and the recovery time.");
ed.addOption("worst case reaction", "(state - action) * sampleTime", "Usual worst case reaction relationship.");
ed.addOption("worst case reaction", "wcreaction", "Replace with worst-case reaction function.  Usually this is defined as the realtion between the state, and action, and the recovery time.");

ed.addExample("whenever ([cRL] >= [tS]) & ([T <= TMAX]) RLAgent shall immediately satisfy chooseAction & ([T]+[(hMax-c)*ts] [<= TMAX])");


dlTemplates.push(ed.createFinalTemplateObject());


//============================= R2

ed.newTemplate("template-dl-threshold2", "DL: Threshold not at sample time");
ed.templateSummary("whenever the sample time is not reached (cRL < tS) the RL agent does not change the action");
ed.templateStructure("whenever ([clockTime] < [sampleTime]) RLAgent shall immediately satisfy maintainAction");


ed.fieldDescription("clockTime", "The clock's time.");
ed.addOption("clockTime", "cRL", "Replace with clock variable name.");

ed.fieldDescription("sampleTime", "The sample time.");
ed.addOption("sampleTime", "sampleTime",  "Replace with sample time variable name.");


ed.addExample("[cRL][tS]")

dlTemplates.push(ed.createFinalTemplateObject())


// ============================= R3

//??
ed.newTemplate("template-dl-threshold3", "DL: Maintain Threshold");
ed.templateSummary("System should always keep the controlled variable below the threshold");
ed.templateStructure("System shall always satisfy [threshold]");

ed.fieldDescription("threshold", "var ~ threshold");
ed.addOption("threshold", "var < threshold", "var less than threshold");
ed.addOption("threshold", "var <= threshold", "var less than or equal to threshold");
//ed.addOption("threshold", "var > threshold", "var greater than threshold");
//ed.addOption("threshold", "var >= threshold", "var greater than or equal to threshold");

ed.addExample("[T <= TMAX]");

dlTemplates.push(ed.createFinalTemplateObject())


//=============================== R4

ed.newTemplate("template-dl-rcovery1", "DL: Recovery not at threshold")
ed.templateSummary("? If the system has breached the threshold for a variable, choose and action to do something...")
ed.templateStructure("whenever ([clockTime] >= [sampleTime]) & !([threshold]) RLAgent shall immediately satisfy chooseAction & ([var] + [worst case reaction] [thresholdComparison])")

ed.fieldDescription("clockTime", "The clock's time.");
ed.addOption("clockTime", "cRL", "Replace with clock variable name.");

ed.fieldDescription("sampleTime", "The sample time.");
ed.addOption("sampleTime", "sampleTime",  "Replace with sample time variable name.");

ed.fieldDescription("var", "The controlled variable.");
ed.addOption("var", "controlledVariable", "replace with the controlled variable.");

ed.fieldDescription("threshold", "var ~ Threshold");
ed.addOption("threshold", "var < threshold", "var less than threshold");
ed.addOption("threshold", "var <= threshold", "var less than or equal to threshold");
//ed.addOption("threshold", "var > threshold", "var greater than threshold");
//ed.addOption("threshold", "var >= threshold", "var greater than or equal to threshold");


ed.fieldDescription("thresholdComparison","Comparison to the threshold variable.");
ed.addOption("thresholdComparison", "< threshold", "less than threshold");
ed.addOption("thresholdComparison", "<= threshold", "less than or equal to threshold");
ed.addOption("thresholdComparison", "> threshold", "greater than threshold");
ed.addOption("thresholdComparison", ">= threshold", "greater than or equal to threshold");

ed.fieldDescription("worst case reaction", "The worst-case reaction function. Usually this is defined as the realtion between the state, and action, and the recovery time.");
ed.addOption("worst case reaction", "(state - action) * sampleTime", "Usual worst case reaction relationship.");
ed.addOption("worst case reaction", "wcreaction", "Replace with worst-case reaction function.  Usually this is defined as the realtion between the state, and action, and the recovery time.");



//ed.fieldDescription("state", "The state for the worst-case reaction function.")
//ed.addOption("state", "state", "Replace with state.")

//ed.fieldDescription("action", "The action for the worst-case reaction function")
//ed.addOption("action", "action","ReplaceRecovery with action")

//ed.fieldDescription("tR", " Time")
//ed.addOption("tR", "recoveryTime", "Replace with recovery time variable name.")

ed.addExample("whenever ([cRL] >= [tS]) & ([bigT > TMAX]) RLAgent shall immediately satisfy chooseAction & [(hMax - c*((tDLast+tRMax) - t]) [<= TMAX].");

dlTemplates.push(ed.createFinalTemplateObject())





// =============================== R5

ed.newTemplate("template-dl-recovery2", "DL: Recovery at threshold")
ed.templateSummary("? If the system has not breached the threshold for a variable, choose and action to do something...")
ed.templateStructure("whenever ([clockTime] >= [sampleTime]) & ([threshold]) RLAgent shall immediately satisfy chooseAction & ([var] + [worst case reaction]) [thresholdComparison])")


ed.fieldDescription("clockTime", "The clock's time.");
ed.addOption("clockTime", "cRL", "Replace with clock variable name.");

ed.fieldDescription("sampleTime", "The sample time.");
ed.addOption("sampleTime", "sampleTime",  "Replace with sample time variable name.");

ed.fieldDescription("var", "The controlled variable.")
ed.addOption("var", "controlledVariable", "replace with the controlled variable.")

ed.fieldDescription("threshold", "var ~ Threshold");
ed.addOption("threshold", "var < threshold", "var less than threshold");
ed.addOption("threshold", "var <= threshold", "var less than or equal to threshold");
//ed.addOption("threshold", "var > threshold", "var greater than threshold");
//ed.addOption("threshold", "var >= threshold", "var greater than or equal to threshold");

ed.fieldDescription("thresholdComparison","Comparison to the threshold variable.")
ed.addOption("thresholdComparison", "< threshold", "less than threshold");
ed.addOption("thresholdComparison", "<= threshold", "less than or equal to threshold");
ed.addOption("thresholdComparison", "> threshold", "greater than threshold");
ed.addOption("thresholdComparison", ">= threshold", "greater than or equal to threshold");

ed.fieldDescription("worst case reaction", "The worst-case reaction function. Usually this is defined as the realtion between the state, and action, and the recovery time.")
ed.addOption("worst case reaction", "(state - action) * sampleTime", "Usual worst case reaction relationship.")
ed.addOption("worst case reaction", "wcreaction", "Replace with worst-case reaction function.  Usually this is defined as the realtion between the state, and action, and the recovery time.")


//ed.fieldDescription("threshold","The controlled variable's threshold.")
//ed.addOption("threshold", "variableThreshold", "Replace with the controlled variable's threshold.")


//ed.fieldDescription("state", "The state for the worst-case reaction function.")
//ed.addOption("state", "state", "Replace with state.")

//ed.fieldDescription("action", "The action for the worst-case reaction function")
//ed.addOption("action", "action","Replace with action")

ed.addExample("whenever ([cRL >= tS]) & ([bigT <= TMAX]) RLAgent shall immediately satisfy chooseAction & [(hMax - c) *tS)] [<= TMAX]")


dlTemplates.push(ed.createFinalTemplateObject())





// =============================== R6

ed.newTemplate("template-dl-resilience1", "DL: Resilience at threshold")
ed.templateSummary("When the threshold is maintained, do something..")
ed.templateStructure("whenever ([clockTime] >= [sampleTime]) &  ([threshold]+-[deltaSuff]) RLAgent shall immediately satisfy chooseAction & [action] >= [servDeg] & ([var] + [worst case reaction]) [thresholdComparison])")


ed.fieldDescription("clockTime", "The clock's time.");
ed.addOption("clockTime", "cRL", "Replace with clock variable name.");

ed.fieldDescription("sampleTime", "The sample time.");
ed.addOption("sampleTime", "sampleTime",  "Replace with sample time variable name.");


ed.fieldDescription("var", "The controlled variable.")
ed.addOption("var", "controlledVariable", "replace with the controlled variable.")

ed.fieldDescription("threshold", "var ~ Threshold");
ed.addOption("threshold", "var < threshold", "var less than threshold");
ed.addOption("threshold", "var <= threshold", "var less than or equal to threshold");
//ed.addOption("threshold", "var > threshold", "var greater than threshold");
//ed.addOption("threshold", "var >= threshold", "var greater than or equal to threshold");

ed.fieldDescription("worst case reaction", "The worst-case reaction function. Usually this is defined as the realtion between the state, and action, and the recovery time.")
ed.addOption("worst case reaction", "(state - action) * sampleTime", "Usual worst case reaction relationship.")
ed.addOption("worst case reaction", "wcreaction", "Replace with worst-case reaction function.  Usually this is defined as the realtion between the state, and action, and the recovery time.")

//ed.fieldDescription("state", "The state for the worst-case reaction function.")
//ed.addOption("state", "state", "Replace with state.")

ed.fieldDescription("action", "The action for the worst-case reaction function")
ed.addOption("action", "worstCaseAction","Replace with the action for the worst-case reaction function")

ed.fieldDescription("thresholdComparison","Comparison to the threshold variable.")
ed.addOption("thresholdComparison", "< threshold", "less than threshold");
ed.addOption("thresholdComparison", "<= threshold", "less than or equal to threshold");
ed.addOption("thresholdComparison", "> threshold", "greater than threshold");
ed.addOption("thresholdComparison", ">= threshold", "greater than or equal to threshold");


ed.fieldDescription("deltaSuff" , "?")
ed.addOption("deltaSuff", "deltaSuff", "Replace")

ed.fieldDescription("servDeg", "Least degraded service?")
ed.addOption("servDeg", "servDeg", "Replace")

ed.addExample("whenever ([cRL] >= [tS]) &  (l >  lMin+deltaSuff) RLAgent shall immediately satisfy chooseAction & [s] >= [sDeg] & ([l]+[0*r-s)*(tS)] > [lMin]");

dlTemplates.push(ed.createFinalTemplateObject())




// =============================== R7

ed.newTemplate("template-dl-resilience2", "DL: Resilience not at threshold")
ed.templateSummary("When the threshold is not maintained, do something...")
ed.templateStructure("whenever ([clockTime] >= [sampleTime]) & !([threshold]+-[deltaSuff]) RLAgent shall immediately satisfy chooseAction & [action] = [servDeg]")

ed.fieldDescription("clockTime", "The clock's time.");
ed.addOption("clockTime", "cRL", "Replace with clock variable name.");

ed.fieldDescription("sampleTime", "The sample time.");
ed.addOption("sampleTime", "sampleTime",  "Replace with sample time variable name.");


//ed.fieldDescription("var", "The controlled variable.")
//ed.addOption("var", "controlledVariable", "replace with the controlled variable.")

ed.fieldDescription("threshold", "var ~ Threshold");
ed.addOption("threshold", "var < threshold", "var less than threshold");
ed.addOption("threshold", "var <= threshold", "var less than or equal to threshold");
//ed.addOption("threshold", "var > threshold", "var greater than threshold");
//ed.addOption("threshold", "var >= threshold", "var greater than or equal to threshold");

ed.fieldDescription("threshold","The controlled variable's threshold.")
ed.addOption("threshold", "variableThreshold", "Replace with the controlled variable's threshold.")


ed.fieldDescription("deltaSuff" , "?")
ed.addOption("deltaSuff", "deltaSuff", "Replace")

ed.fieldDescription("servDeg", "Least degraded service?")
ed.addOption("servDeg", "servDeg", "Replace")


ed.fieldDescription("action", "The action for the worst-case reaction function")
ed.addOption("action", "worstCaseAction","Replace with action")

ed.addExample("whenever ([cRL] >= [tS]) & !([l] > [lMin+deltaSuff]) RLAgent shall immediately satisfy chooseAction & [s] = [sDeg]");


dlTemplates.push(ed.createFinalTemplateObject())


return dlTemplates
}

module.exports = {
 makeTemplates
}
