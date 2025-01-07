// Convert FRET formula to MLTL format
exports.fretToMltlConverter = function fretToMltlConverter(inputFormula) {
  // Map of FRET symbols to MLTL equivalents
  const symbolMap = {
    eventually: "F",
    always: "G",
    until: "U",
    release: "R",
    true: "true",
    false: "false",
    and: "&",
    or: "|",
    not: "!",
    "->": "->",
    "=": "=",
  };

  // Symbols to ignore during conversion with explanations
  const ignoredSymbolsWithMeaning = {
    "LAST V": "Indicates current state relevance; removed in conversion.",
    X: "Next operator; removed in conversion.",
    G: "Globally operator; removed in conversion.",
    F: "Finally operator; removed in conversion.",
    U: "Until operator; removed in conversion.",
    R: "Release operator; removed in conversion.",
  };

  // Array to store conversion steps
  const steps = [];
  // Array to store ignored symbols and their explanations
  const ignoredSymbolsDetails = [];
  // Log each conversion step
  const updateConversionSteps = (step, formula) => {
    steps.push({ step, formula });
  };

  // Remove ignored symbols from the formula
  const removeIgnoredSymbols = (formula) => {
    let cleanedFormula = formula;
    Object.entries(ignoredSymbolsWithMeaning).forEach(([symbol, meaning]) => {
      const regex = new RegExp(`\\b${symbol}\\b`, "g");
      if (regex.test(cleanedFormula)) {
        ignoredSymbolsDetails.push({ symbol, meaning });
        cleanedFormula = cleanedFormula.replace(regex, "").trim();
      }
    });
    updateConversionSteps("Removed ignored time operators", cleanedFormula);
    return cleanedFormula;
  };

  // Replace FRET symbols with MLTL equivalents
  const mapSymbols = (formula) => {
    Object.entries(symbolMap).forEach(([fretSymbol, mltlSymbol]) => {
      const regex = new RegExp(`\\b${fretSymbol}\\b`, "g");
      formula = formula.replace(regex, mltlSymbol);
    });
    updateConversionSteps("Mapped FRET symbols to MLTL", formula);
    return formula;
  };

  // Standardize variable names to p1, p2, etc.
  const standardizeVariables = (formula) => {
    const variableMap = {};
    let variableCount = 0;
    const standardizedFormula = formula.replace(
      /\b[a-zA-Z_]\w*\b/g,
      (match) => {
        if (Object.values(symbolMap).includes(match)) return match;
        if (!variableMap[match]) variableMap[match] = `p${++variableCount}`;
        return variableMap[match];
      }
    );
    updateConversionSteps("Standardized variables", standardizedFormula);
    return { formula: standardizedFormula, variableMap };
  };

  // Clean up spacing in the formula
  const cleanUpSpacing = (formula) => {
    const cleanedFormula = formula
      .replace(/\s*([()!&|=->X<>=])\s*/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
    updateConversionSteps("Cleaned up spacing", cleanedFormula);
    return cleanedFormula;
  };

  // Main function to handle the conversion process
  const convertFretToMltl = (formula) => {
    updateConversionSteps("Original formula", formula);
    formula = removeIgnoredSymbols(formula);
    formula = mapSymbols(formula);
    const { formula: standardizedFormula, variableMap } =
      standardizeVariables(formula);
    formula = cleanUpSpacing(standardizedFormula);
    updateConversionSteps("Final converted formula", formula);
    return {
      formula,
      steps,
      variableMap,
      ignoredSymbols: ignoredSymbolsDetails,
    };
  };

  return convertFretToMltl(inputFormula);
}

/*
// Usage example
const result = fretToMltlConverter(
  "(LAST V (PCVMode -> ((breathingCycleDone | patientBreathingRequest) -> (breathingCycleStart & inspiratoryPhaseStart))))" //example FRET formula
);
console.log(result.formula); // Final converted formula
console.log(result.steps); // Array of conversion steps
console.log(result.variableMap); // Variable mapping
console.log(result.ignoredSymbols); // Ignored time operators with explanations
*/