/* eslint-disable no-loop-func */
import util from 'util';
import { isEqual } from './Helpers';

export const minimize = (originalAutomaton) => {
  console.log('----------------- Original DFA -----------------');

  console.log(
    'Original DFA:',
    util.inspect(originalAutomaton, { showHidden: false, depth: null })
  );

  console.log('----------------- DFA Minimization -----------------');

  var equivalences = []; // Keeping track of all equivalences
  var equivalenceCount = 0; // Keeping track of the equivalence count

  /**
   * Apply equivalence theorem on given DFA
   * @param  {Object} automaton The original DFA
   * @param  {Array} previousEquivalence The previous equivalence
   */

  function applyEquivalenceTheorem(automaton, previousEquivalence) {
    console.log(
      `******************* ${equivalenceCount}-Equivalence ***********************`
    );
    let currentEquivalence = [];
    // For 0-Equivalence just separate the non-final and final states
    if (equivalenceCount === 0) {
      // Filtering out nonFinalStates
      let nonFinalStates = automaton.states.filter((state) => {
        return !automaton.acceptingStates.includes(state);
      });
      // Creating the currentEquivalence array with non-final and final states
      currentEquivalence = [nonFinalStates, automaton.acceptingStates];
      // Adding the 0-equivalence to the equivalences set
      equivalences.push(currentEquivalence);
      console.log(currentEquivalence);
    } else {
      // For equivalences where k > 0, create new pairs of equivalent states
      // Looping over the k-1 equivalence to produce the newer equivalence
      for (let i = 0; i < previousEquivalence.length; i++) {
        let set = previousEquivalence[i]; // Set in the k-1 equivalence
        let isPair = false;
        let paired = [];
        // If the set has more than one states then start checking those states for equivalence
        if (set.length > 1) {
          // Looping over each state in the set
          for (let j = 0; j < set.length; j++) {
            var pair = [];
            const pivotState = set[j];
            if (!paired.includes(pivotState)) {
              pair.push(pivotState);
              paired.push(pivotState);
            }
            for (let k = j + 1; k < set.length; k++) {
              const subsequentState = set[k];

              // Get the transitions for the pivot state
              automaton.alphabet.forEach((symbol) => {
                let pivotStateTransition = automaton.transitions.filter(
                  (transition) => {
                    return (
                      transition.fromState === pivotState &&
                      transition.symbol === symbol
                    );
                  }
                )[0];

                // Get the transitions for the subsequent state
                let transition = automaton.transitions.filter((transition) => {
                  return (
                    transition.fromState === subsequentState &&
                    transition.symbol === symbol
                  );
                })[0];

                // Compare the two states for their equivalence
                if (
                  pivotStateTransition.toStates[0] === transition.toStates[0]
                ) {
                  isPair = true;
                } else {
                  for (let i = 0; i < previousEquivalence.length; i++) {
                    const set = previousEquivalence[i];
                    if (
                      set.includes(pivotStateTransition.toStates[0]) &&
                      set.includes(transition.toStates[0])
                    ) {
                      isPair = true;
                      break;
                    } else {
                      isPair = false;
                    }
                  }
                }
              });

              if (isPair)
                console.log(
                  `Matching ${pivotState} and ${subsequentState} (Equivalent)`
                );
              else
                console.log(
                  `Matching ${pivotState} and ${subsequentState} (Non Equivalent)`
                );
              if (isPair && !paired.includes(subsequentState)) {
                paired.push(subsequentState);
                pair.push(subsequentState);
              }

              isPair = false;
            }
            if (pair.length) {
              currentEquivalence.push(pair);
            }
          }
        } else {
          // Else if the set just contains a single state then push it to the currentEquivalence without performing any operations on it whatsoever
          currentEquivalence.push(set);
        }
      }
      // Once the currentEquivalence has been computed, push it to the main equivalence array
      equivalences.push(currentEquivalence);
      console.log(currentEquivalence);
    }
    // Stop the recursive function if the previous and the current equivalences are the same
    if (isEqual(previousEquivalence, currentEquivalence)) {
      return;
    }
    // Incrementing equivalence count 'k' with 1
    equivalenceCount += 1;
    // Recursive call to the function
    applyEquivalenceTheorem(automaton, currentEquivalence);
  }

  applyEquivalenceTheorem(originalAutomaton);

  var sortedEquivalences = [];
  equivalences.forEach((equivalence) => {
    sortedEquivalences.push(
      equivalence.sort((a, b) => {
        return b.length - a.length;
      })
    );
  });

  console.log('\n\n----------------- Computed Equivalences -----------------');

  sortedEquivalences.forEach((equivalence, index) => {
    console.log(`${index}-Equivalence:`, equivalence);
  });

  let minimizedAutomaton = {
    states: [],
    alphabet: originalAutomaton.alphabet,
    initialState: null,
    acceptingStates: [],
    transitions: [],
  };

  let separatedStates = [];

  sortedEquivalences[sortedEquivalences.length - 1].forEach((set) => {
    minimizedAutomaton.states.push(set.join(''));
    separatedStates.push(set.join(','));
  });

  minimizedAutomaton.initialState = sortedEquivalences[
    sortedEquivalences.length - 1
  ]
    .filter((set) => {
      return set.includes(originalAutomaton.initialState);
    })[0]
    .join('');

  minimizedAutomaton.acceptingStates = sortedEquivalences[
    sortedEquivalences.length - 1
  ].filter((set) => {
    return set.includes(...originalAutomaton.acceptingStates);
  });

  minimizedAutomaton.acceptingStates = minimizedAutomaton.acceptingStates.map(
    (state) => {
      return state.join('');
    }
  );

  separatedStates.forEach((state) => {
    let stateElements = state.replace(/(^\s*,)|(,\s*$)/g, '').split(',');
    let stateElement = stateElements[0];
    let transitions = originalAutomaton.transitions.filter((transition) => {
      return transition.fromState === stateElement;
    });
    transitions.forEach((transition) => {
      let oldToState = transition.toStates[0];
      let toStates = separatedStates.filter((state) => {
        let states = state.replace(/(^\s*,)|(,\s*$)/g, '').split(',');
        return states.includes(oldToState);
      });
      toStates[0] = toStates[0].replace(/,/g, '');
      minimizedAutomaton.transitions.push({
        fromState: state.replace(/,/g, ''),
        toStates,
        symbol: transition.symbol,
      });
    });
    console.log(stateElement);
  });

  console.log(
    'Minimized DFA:',
    util.inspect(minimizedAutomaton, { showHidden: false, depth: null })
  );

  return { minimizedAutomaton, equivalences: sortedEquivalences };
};
