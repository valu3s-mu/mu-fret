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
ed.newTemplate("template-dl-threshold1", "Threshold at sample time");
ed.templateSummary("Whenever the sample time is reacheed (cRL >= tS) and the threshold is maintained, \
	the RL agent chooses and action that ensures that the worst case reaction o the overall system, \
	within one sample time still maintains the safety threshold.");
ed.templateStructure("whenever ([cRL] >= [tS]) & ([var] <= [threshold]) RLAgent shall immediately statisfy chooseAction & ([var] + wcrection([state], [action], [ts]) ) <= [threshold]");

ed.fieldDescription("cRL", "The clock's time.");
ed.addOption("cRL", "cRL", "Replace with clock variable name.");

ed.fieldDescription("tS", "The sample time.")
ed.addOption("ts", "Replace with sample time variable name.")

ed.fieldDescription("var", "The controlled variable.")
ed.addOption("var", "replace with the controlled variable.")

ed.fieldDescription("threshold","The controlled variable's threshold.")
ed.addOption("threshold", "Replace with the controlled variable's threshold.")

ed.fieldDescription("state", "The state for the worst-case reaction function.")
ed.addOption("state", "Replace")

ed.fieldDescription("action", "The action for the worst-case reaction function")
ed.addOption("action", "Replace")

ed.addExample("whenever ([cRL] >= [tS]) & ([T] <= [TMAX]) RLAgent shall immediately satisfy chooseAction & ([T]+([hMax]-[c])*[ts] <= [TMAX])")


dlTemplates.push(ed.createFinalTemplateObject())

//============================= R2

ed.newTemplate("template-dl-threshold2", "Threshold not at sample time");
ed.templateSummary("whenever the sample time is not reached (cRL < tS) the RL agent does not change the action")
ed.templateStructure("whenever ([cRL] < [tS]) RLAgent shall immediately satisfy maintainAction")

ed.fieldDescription("cRL", "The clock's time.");
ed.addOption("cRL", "cRL", "Replace with clock variable name.");

ed.fieldDescription("tS", "The sample time.")
ed.addOption("ts", "Replace with sample time variable name.")

//ed.addExample()

dlTemplates.push(ed.createFinalTemplateObject())


// ============================= R3

//??
ed.newTemplate("template-dl-threshold3", "Maintain Threshold")
ed.templateSummary("System should always kepe the controlled variable below the threshold")
ed.templateStructure("System shall always satisfy [var] <= [threshold]")

ed.fieldDescription("var", "The controlled variable.")
ed.addOption("var", "replace with the controlled variable.")

ed.fieldDescription("threshold","The controlled variable's threshold.")
ed.addOption("threshold", "Replace with the controlled variable's threshold.")

ed.addExample("[T] [TMAX]")

dlTemplates.push(ed.createFinalTemplateObject())


//=============================== R4

ed.newTemplate("template-dl-rcovery1", "Recovery not at threshold")
ed.templateSummary("? If the system has breached the threshold for a variable, choose and action to do something...")
ed.templateStructure("whenever ([cRL] >= [tS]) & !([var] [~] [threshold]) RLAgent shall immediately satisfy chooseAction & ([var]+wcreaction([state],[action],[tR]) [~] [threshold])")

ed.fieldDescription("cRL", "The clock's time.");
ed.addOption("cRL", "cRL", "Replace with clock variable name.");

ed.fieldDescription("tS", "The sample time.")
ed.addOption("ts", "Replace with sample time variable name.")

ed.fieldDescription("var", "The controlled variable.")
ed.addOption("var", "replace with the controlled variable.")

// We'll see if this works
ed.fieldDescription("~", "An inequality operator (<, >, <=, >=)")
ed.addOption("~", "<")
ed.addOption("~", ">")
ed.addOption("~", "<=")
ed.addOption("~", ">=")

ed.fieldDescription("threshold","The controlled variable's threshold.")
ed.addOption("threshold", "Replace with the controlled variable's threshold.")

ed.fieldDescription("state", "The state for the worst-case reaction function.")
ed.addOption("state", "Replace")

ed.fieldDescription("action", "The action for the worst-case reaction function")
ed.addOption("action", "Replace")

ed.fieldDescription("tR", "Recovery Time")
ed.addOption("tR", "Replace with recovery time variable name.")


dlTemplates.push(ed.createFinalTemplateObject())


// =============================== R5

ed.newTemplate("template-dl-recovery2", "Recovert at threshold")
ed.templateSummary("? If the system has not breached the threshold for a variable, choose and action to do something...")
ed.templateStructure("whenever ([cRL] >= [tS]) & ([var] [~] [threshold]) RLAgent shall immediately satisfy chooseAction & ([var]+wcreaction([state],[action],[tR]) [~] [threshold])")

ed.fieldDescription("cRL", "The clock's time.");
ed.addOption("cRL", "cRL", "Replace with clock variable name.");

ed.fieldDescription("tS", "The sample time.")
ed.addOption("ts", "Replace with sample time variable name.")

ed.fieldDescription("var", "The controlled variable.")
ed.addOption("var", "replace with the controlled variable.")

// We'll see if this works
ed.fieldDescription("~", "An inequality operator (<, >, <=, >=)")
ed.addOption("~", "<")
ed.addOption("~", ">")
ed.addOption("~", "<=")
ed.addOption("~", ">=")

ed.fieldDescription("threshold","The controlled variable's threshold.")
ed.addOption("threshold", "Replace with the controlled variable's threshold.")

ed.fieldDescription("state", "The state for the worst-case reaction function.")
ed.addOption("state", "Replace")

ed.fieldDescription("action", "The action for the worst-case reaction function")
ed.addOption("action", "Replace")


dlTemplates.push(ed.createFinalTemplateObject())

// =============================== R6

ed.newTemplate("template-dl-resilience1", "Resilience at threashold")
ed.templateSummary("When the threashold is maintained, do something..")
ed.templateStructure("whenever ([cRL] >= [tS]) &  ([var] [~] [threshold]+-[deltaSuff]) RLAgent shall immediately satisfy chooseAction & [action] >= [servDeg] & ([var]+wcreaction([state],[action],[tS]) [~] [threshold])")

ed.fieldDescription("cRL", "The clock's time.");
ed.addOption("cRL", "cRL", "Replace with clock variable name.");

ed.fieldDescription("tS", "The sample time.")
ed.addOption("ts", "Replace with sample time variable name.")

ed.fieldDescription("var", "The controlled variable.")
ed.addOption("var", "replace with the controlled variable.")

// We'll see if this works
ed.fieldDescription("~", "An inequality operator (<, >, <=, >=)")
ed.addOption("~", "<")
ed.addOption("~", ">")
ed.addOption("~", "<=")
ed.addOption("~", ">=")

ed.fieldDescription("state", "The state for the worst-case reaction function.")
ed.addOption("state", "Replace")

ed.fieldDescription("action", "The action for the worst-case reaction function")
ed.addOption("action", "Replace")

ed.fieldDescription("deltaSuff" , "?")
ed.addOption("deltaSuff", "Replace")

ed.fieldDescription("servDeg", "Least degraded service?")
ed.addOption("servDeg", "Replace")

dlTemplates.push(ed.createFinalTemplateObject())

// =============================== R7

ed.newTemplate("template-dl-resilience2")
ed.templateSummary("When the threshold is not maintained, do something...")
ed.templateStructure("whenever ([cRL] >= [tS]) & !([var] [~] [threshold]+-[deltaSuff]) RLAgent shall immediately satisfy chooseAction & [action] =   [servDeg]")

ed.fieldDescription("cRL", "The clock's time.");
ed.addOption("cRL", "cRL", "Replace with clock variable name.");

ed.fieldDescription("tS", "The sample time.")
ed.addOption("ts", "Replace with sample time variable name.")

ed.fieldDescription("var", "The controlled variable.")
ed.addOption("var", "replace with the controlled variable.")

// We'll see if this works
ed.fieldDescription("~", "An inequality operator (<, >, <=, >=)")
ed.addOption("~", "<")
ed.addOption("~", ">")
ed.addOption("~", "<=")
ed.addOption("~", ">=")


ed.fieldDescription("deltaSuff" , "?")
ed.addOption("deltaSuff", "Replace")

ed.fieldDescription("servDeg", "Least degraded service?")
ed.addOption("servDeg", "Replace")

dlTemplates.push(ed.createFinalTemplateObject())



return dlTemplates
}

module.exports = {
 makeTemplates
}
