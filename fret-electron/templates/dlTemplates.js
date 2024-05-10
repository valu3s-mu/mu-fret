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
//============================= No Change (was R2/threshold2)

ed.newTemplate("template-rl-noChange", "RL: No Change");
ed.templateSummary("whenever the sample time is not reached (cRL < tS) the RL agent does not change the action");
ed.templateStructure("whenever ([clockTime] < [sampleTime]) RLAgent shall immediately satisfy maintainAction");

ed.fieldDescription("clockTime", "The clock's time.");
ed.addOption("clockTime", "cRL", "Replace with clock variable name.");

ed.fieldDescription("sampleTime", "The sample time.");
ed.addOption("sampleTime", "sampleTime",  "Replace with sample time variable name.");

ed.addExample("[cRL][tS]")

dlTemplates.push(ed.createFinalTemplateObject())

// =========================== Choose Action (was R1/threshold2)
ed.newTemplate("template-rl-chooseAction", "RL: Choose Action");
ed.templateSummary("Whenever the sample time is reacheed (cRL >= tS) \
	the RL agent chooses and action that ensures that the worst case reaction of the overall system, \
	within one sample time still maintains the safety threshold.");

ed.templateStructure("when ([clockTime] >= [sampleTime]) RLAgent shall immediately satisfy chooseAction");

ed.fieldDescription("clockTime", "The clock's time.");
ed.addOption("clockTime", "cRL", "Replace with clock variable name.");

ed.fieldDescription("sampleTime", "The sample time.");
ed.addOption("sampleTime", "sampleTime",  "Replace with sample time variable name.");


ed.addExample("whenever ([cRL] >= [tS]) RLAgent shall immediately satisfy chooseAction");

dlTemplates.push(ed.createFinalTemplateObject());

// =========================== System Threashold (was R3/threshold3)

ed.newTemplate("template-rl-systemThreshold", "RL: System Threshold");
ed.templateSummary("The system should always satisfy the given threashold.");

ed.templateStructure("System shall always satisfy [threshold]");

ed.fieldDescription("threshold", "var ~ threshold");
ed.addOption("threshold", "var < threshold", "var less than threshold");
ed.addOption("threshold", "var <= threshold", "var less than or equal to threshold");

ed.addExample("[T <= TMAX]");
dlTemplates.push(ed.createFinalTemplateObject());

// =========================== Contract Threshold (also was R1/threshold1)

ed.newTemplate("template-rl-contractThreshold", "RL: Contract Threshold");
ed.templateSummary("Whenever the sample time is reacheed (cRL >= tS) and the threshold is maintained, \
	the RL agent chooses and action that ensures that the worst case reaction of the overall system, \
	within one sample time still maintains the safety threshold.");
ed.templateStructure("when ([clockTime] >= [sampleTime]) RLAgent shall immediately satisfy ([threshold]) => ([var] + [worst case reaction] ) [thresholdComparison]");


ed.fieldDescription("clockTime", "The clock's time.");
ed.addOption("clockTime", "cRL", "Replace with clock variable name.");

ed.fieldDescription("sampleTime", "The sample time.");
ed.addOption("sampleTime", "sampleTime",  "Replace with sample time variable name.");

ed.fieldDescription("var", "The controlled variable.")
ed.addOption("var", "controlledVariable", "replace with the controlled variable.")


ed.fieldDescription("threshold", "var ~ threshold");
ed.addOption("threshold", "var < threshold", "var less than threshold");
ed.addOption("threshold", "var <= threshold", "var less than or equal to threshold");

ed.fieldDescription("thresholdComparison","Comparison to the threshold variable.")
ed.addOption("thresholdComparison", "< threshold", "less than threshold");
ed.addOption("thresholdComparison", "<= threshold", "less than or equal to threshold");
ed.addOption("thresholdComparison", "> threshold", "greater than threshold");
ed.addOption("thresholdComparison", ">= threshold", "greater than or equal to threshold");


ed.fieldDescription("worst case reaction", "The worst-case reaction function. Usually this is defined as the realtion between the state, and action, and the recovery time.");
ed.addOption("worst case reaction", "(state - action) * sampleTime", "Usual worst case reaction relationship.");
ed.addOption("worst case reaction", "wcreaction", "Replace with worst-case reaction function.  Usually this is defined as the realtion between the state, and action, and the recovery time.");

ed.addExample("whenever ([cRL] >= [tS]) RLAgent shall immediately satisfy ([T <= TMAX]) => ([T]+[(hMax-c)*ts] [<= TMAX])");


dlTemplates.push(ed.createFinalTemplateObject());


// =========================== System Recovery (new)

ed.newTemplate("template-rl-systemRecovery", "RL: System Recovery");
ed.templateSummary("After some disruption, the system should recover. ");

ed.templateStructure("System shall always satisfy [time since disruption] > [maxRecoveryTime] => [threshold]");

ed.fieldDescription("time since disruption", "t");
ed.addOption("time since disruption", "t", "Replace with variable representing the time since the disruption.")

ed.fieldDescription("maxRecoveryTime", "maxT");
ed.addOption("maxRecoveryTime", "maxT", "Replace with variable representing the maxRecoveryTime.")

ed.fieldDescription("threshold", "var ~ threshold");
ed.addOption("threshold", "var < threshold", "var less than threshold");
ed.addOption("threshold", "var <= threshold", "var less than or equal to threshold");

ed.addExample("[T <= TMAX]");
dlTemplates.push(ed.createFinalTemplateObject());

//=============================== Contract Recovery (was R4/recovery1)

ed.newTemplate("template-rl-contractRecovery1", "RL: Contract Recovery 1")
ed.templateSummary("If the threashold is breached, then??")
ed.templateStructure("whenever ([clockTime] >= [sampleTime]) RLAgent shall immediately satisfy & !([threshold]) => ([var] + [worst case reaction] [thresholdComparison])");

ed.fieldDescription("clockTime", "The clock's time.");
ed.addOption("clockTime", "cRL", "Replace with clock variable name.");

ed.fieldDescription("sampleTime", "The sample time.");
ed.addOption("sampleTime", "sampleTime",  "Replace with sample time variable name.");

ed.fieldDescription("var", "The controlled variable.");
ed.addOption("var", "controlledVariable", "replace with the controlled variable.");

ed.fieldDescription("threshold", "var ~ Threshold");
ed.addOption("threshold", "var < threshold", "var less than threshold");
ed.addOption("threshold", "var <= threshold", "var less than or equal to threshold");


ed.fieldDescription("thresholdComparison","Comparison to the threshold variable.");
ed.addOption("thresholdComparison", "< threshold", "less than threshold");
ed.addOption("thresholdComparison", "<= threshold", "less than or equal to threshold");
ed.addOption("thresholdComparison", "> threshold", "greater than threshold");
ed.addOption("thresholdComparison", ">= threshold", "greater than or equal to threshold");

ed.fieldDescription("worst case reaction", "The worst-case reaction function. Usually this is defined as the realtion between the state, and action, and the recovery time.");
ed.addOption("worst case reaction", "(state - action) * sampleTime", "Usual worst case reaction relationship.");
ed.addOption("worst case reaction", "wcreaction", "Replace with worst-case reaction function.  Usually this is defined as the realtion between the state, and action, and the recovery time.");

ed.addExample("whenever ([cRL] >= [tS]) RLAgent shall immediately satisfy ([bigT > TMAX]) => [(hMax - c*((tDLast+tRMax) - t]) [<= TMAX].");

dlTemplates.push(ed.createFinalTemplateObject())



// =============================== Contract Recovery 2 (was R5/recovery2)

ed.newTemplate("template-rl-contractRecovery2", "RL: Contract Recovery 2");
ed.templateSummary("If the threashold is not breached, then...?");
ed.templateStructure("whenever ([clockTime] >= [sampleTime]) RLAgent shall immediately satisfy ([threshold]) => ([var] + [worst case reaction]) [thresholdComparison])");


ed.fieldDescription("clockTime", "The clock's time.");
ed.addOption("clockTime", "cRL", "Replace with clock variable name.");

ed.fieldDescription("sampleTime", "The sample time.");
ed.addOption("sampleTime", "sampleTime",  "Replace with sample time variable name.");

ed.fieldDescription("var", "The controlled variable.");
ed.addOption("var", "controlledVariable", "replace with the controlled variable.");

ed.fieldDescription("threshold", "var ~ Threshold");
ed.addOption("threshold", "var < threshold", "var less than threshold");
ed.addOption("threshold", "var <= threshold", "var less than or equal to threshold");

ed.fieldDescription("thresholdComparison","Comparison to the threshold variable.")
ed.addOption("thresholdComparison", "< threshold", "less than threshold");
ed.addOption("thresholdComparison", "<= threshold", "less than or equal to threshold");
ed.addOption("thresholdComparison", "> threshold", "greater than threshold");
ed.addOption("thresholdComparison", ">= threshold", "greater than or equal to threshold");

ed.fieldDescription("worst case reaction", "The worst-case reaction function. Usually this is defined as the realtion between the state, and action, and the recovery time.");
ed.addOption("worst case reaction", "(state - action) * sampleTime", "Usual worst case reaction relationship.");
ed.addOption("worst case reaction", "wcreaction", "Replace with worst-case reaction function.  Usually this is defined as the realtion between the state, and action, and the recovery time.");

ed.addExample("whenever ([cRL >= tS]) RLAgent shall immediately satisfy ([bigT <= TMAX]) => [(hMax - c) *tS)] [<= TMAX]");


dlTemplates.push(ed.createFinalTemplateObject());


// =========================== System Resiliance (new)

ed.newTemplate("template-rl-systemResiliance", "RL: System Resiliance");
ed.templateSummary("After some disruption, the system should recover. ");

ed.templateStructure("System shall always satisfy [threshold] & [action] >= [degradedService]");

ed.fieldDescription("threshold", "var ~ threshold");
ed.addOption("threshold", "var < threshold", "var less than threshold");
ed.addOption("threshold", "var <= threshold", "var less than or equal to threshold");

ed.fieldDescription("action", "The action for the worst-case reaction function")
ed.addOption("action", "worstCaseAction","Replace with the action for the worst-case reaction function")

ed.fieldDescription("degradedService", "degradedService");
ed.addOption("degradedService", "degradedService", "Replace with variable representing the degraded service.")

ed.addExample("[T <= TMAX] [action] [degradedService]");
dlTemplates.push(ed.createFinalTemplateObject());

// =============================== Contract Resiliance (was R6/resiliance1)

ed.newTemplate("template-rl-resilience1", "RL: Contract Resilience 1")
ed.templateSummary("When the threshold is maintained, do something..")
ed.templateStructure("whenever ([clockTime] >= [sampleTime]) RLAgent shall immediately \
	satisfy ([threshold] + [deltaSuff]) => [action] >= [degradedService] & ([var] + [worst case reaction]) [thresholdComparison])")

ed.fieldDescription("clockTime", "The clock's time.");
ed.addOption("clockTime", "cRL", "Replace with clock variable name.");

ed.fieldDescription("sampleTime", "The sample time.");
ed.addOption("sampleTime", "sampleTime",  "Replace with sample time variable name.");


ed.fieldDescription("var", "The controlled variable.")
ed.addOption("var", "controlledVariable", "replace with the controlled variable.")

ed.fieldDescription("worst case reaction", "The worst-case reaction function. Usually this is defined as the realtion between the state, and action, and the recovery time.")
ed.addOption("worst case reaction", "(state - action) * sampleTime", "Usual worst case reaction relationship.")
ed.addOption("worst case reaction", "wcreaction", "Replace with worst-case reaction function.  Usually this is defined as the realtion between the state, and action, and the recovery time.")

ed.fieldDescription("threshold", "var ~ Threshold");
ed.addOption("threshold", "var < threshold", "var less than threshold");
ed.addOption("threshold", "var <= threshold", "var less than or equal to threshold");

ed.fieldDescription("action", "The action for the worst-case reaction function")
ed.addOption("action", "worstCaseAction","Replace with the action for the worst-case reaction function")

ed.fieldDescription("deltaSuff" , "A buffer to ensure a higher service level can be provided and a minimum safety level can be maintained.")
ed.addOption("deltaSuff", "deltaSuff", "Replace")

ed.fieldDescription("degradedService", "degradedService");
ed.addOption("degradedService", "degradedService", "Replace with variable representing the degraded service.")

ed.fieldDescription("thresholdComparison","Comparison to the threshold variable.")
ed.addOption("thresholdComparison", "< threshold", "less than threshold");
ed.addOption("thresholdComparison", "<= threshold", "less than or equal to threshold");
ed.addOption("thresholdComparison", "> threshold", "greater than threshold");
ed.addOption("thresholdComparison", ">= threshold", "greater than or equal to threshold");

ed.addExample("whenever ([cRL] >= [tS])  RLAgent shall immediately satisfy ([l] >  [lMin+deltaSuff]) => [s] >= [sDeg] & ([l]+[0*r-s)*(tS)] > [lMin]");

dlTemplates.push(ed.createFinalTemplateObject())




// =============================== Contract Resiliance 2 (was R7/resiliance2)

ed.newTemplate("template-rl-contractResilience2", "RL: Contract Resilience 2");
ed.templateSummary("When the threshold is not maintained, do something...?");
ed.templateStructure("whenever ([clockTime] >= [sampleTime]) & RLAgent shall immediately satisfy !([threshold] + [deltaSuff]) => [action] = [degradedService]");

ed.fieldDescription("clockTime", "The clock's time.");
ed.addOption("clockTime", "cRL", "Replace with clock variable name.");

ed.fieldDescription("sampleTime", "The sample time.");
ed.addOption("sampleTime", "sampleTime",  "Replace with sample time variable name.");


ed.fieldDescription("threshold", "var ~ Threshold");
ed.addOption("threshold", "var < threshold", "var less than threshold");
ed.addOption("threshold", "var <= threshold", "var less than or equal to threshold");

ed.fieldDescription("threshold","The controlled variable's threshold.");
ed.addOption("threshold", "variableThreshold", "Replace with the controlled variable's threshold.");


ed.fieldDescription("deltaSuff" , "A buffer to ensure a higher service level can be provided and a minimum safety level can be maintained.");
ed.addOption("deltaSuff", "deltaSuff", "Replace");


ed.fieldDescription("action", "The action for the worst-case reaction function");
ed.addOption("action", "worstCaseAction","Replace with action");

ed.fieldDescription("degradedService", "degradedService");
ed.addOption("degradedService", "degradedService", "Replace with variable representing the degraded service.");



ed.addExample("whenever ([cRL] >= [tS]) RLAgent shall immediately satisfy !([l] > [lMin+deltaSuff]) => [s] = [sDeg]");


dlTemplates.push(ed.createFinalTemplateObject())


return dlTemplates
}

module.exports = {
 makeTemplates
}
