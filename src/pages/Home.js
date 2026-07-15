import React, { useState, useEffect } from 'react';
import Alert from '../includes/Alert';
import ResultModal from './ResultModal';
import MultiSelect from 'react-multi-select-component';
import {
  Card,
  Button,
  CardHeader,
  CardFooter,
  CardBody,
  CardTitle,
  FormText,
  Form,
  FormGroup,
  Label,
  Input,
  Table,
} from 'reactstrap';

const parseCommaSeparated = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const Home = () => {
  const [automaton, setAutomaton] = useState({
    states: [],
    alphabet: [],
    initialState: null,
    acceptingStates: [],
    transitions: [],
  });

  const [selectedFinalStates, setSelectedFinalStates] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const acceptingStates = selectedFinalStates.map(
      (selectedState) => selectedState.value
    );
    setAutomaton((prev) => ({ ...prev, acceptingStates }));
  }, [selectedFinalStates]);

  const hasCompleteTransitions = ({ states, alphabet, transitions }) => {
    return states.every((state) =>
      alphabet.every((symbol) =>
        transitions.some(
          (transition) =>
            transition.fromState === state &&
            transition.symbol === symbol &&
            transition.toStates[0]
        )
      )
    );
  };

  const validate = () => {
    const {
      states,
      alphabet,
      initialState,
      acceptingStates,
      transitions,
    } = automaton;

    if (
      states.length < 1 ||
      alphabet.length < 1 ||
      initialState == null ||
      acceptingStates.length < 1
    ) {
      setErrorMessage(
        'All fields below are required. Please fill in states, alphabet, initial state, and final states.'
      );
      setHasErrors(true);
      window.scrollTo(0, 0);
      setTimeout(() => {
        setHasErrors(false);
      }, 6000);
      return false;
    }

    if (!hasCompleteTransitions({ states, alphabet, transitions })) {
      setErrorMessage(
        'Every state needs a transition for each alphabet symbol. Incomplete transition tables are NFAs and cannot be minimized here.'
      );
      setHasErrors(true);
      window.scrollTo(0, 0);
      setTimeout(() => {
        setHasErrors(false);
      }, 8000);
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setHasErrors(false);
      setIsSubmitted(true);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === 'states') {
      const states = parseCommaSeparated(e.target.value);
      if (states.length === 0) {
        setStateOptions([]);
        setSelectedFinalStates([]);
        setAutomaton((prev) => ({
          ...prev,
          states: [],
          initialState: null,
          acceptingStates: [],
          transitions: [],
        }));
        return;
      }

      const options = states.map((state) => ({
        label: state,
        value: state,
      }));
      setSelectedFinalStates([]);
      setStateOptions(options);
      setAutomaton((prev) => ({
        ...prev,
        states,
        initialState: null,
        acceptingStates: [],
        transitions: [],
      }));
    } else if (e.target.name === 'initial-state') {
      setAutomaton((prev) => ({ ...prev, initialState: e.target.value }));
    } else if (e.target.name === 'inputs') {
      const alphabet = parseCommaSeparated(e.target.value);
      setAutomaton((prev) => ({
        ...prev,
        alphabet,
        transitions: [],
      }));
    } else {
      const splitName = e.target.name.split('-');
      const fromState = splitName[0];
      const toStates = [e.target.value];
      const symbol = splitName.slice(1).join('-');

      setAutomaton((prev) => {
        const transitions = [...prev.transitions];
        const existingIndex = transitions.findIndex(
          (transition) =>
            transition.symbol === symbol && transition.fromState === fromState
        );

        if (existingIndex >= 0) {
          transitions[existingIndex] = {
            ...transitions[existingIndex],
            toStates,
          };
        } else {
          transitions.push({ fromState, toStates, symbol });
        }

        return { ...prev, transitions };
      });
    }
  };

  return (
    <React.Fragment>
      <Card className='shadow-sm'>
        <CardHeader>Input Automaton</CardHeader>
        <CardBody>
          <CardTitle>
            Use the form below to input data for your automaton
          </CardTitle>
          {hasErrors && <Alert type='danger' msg={errorMessage} />}
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label for='states'>Enter states separated by commas:</Label>
              <Input
                onChange={handleChange}
                type='text'
                name='states'
                id='states'
                required
                placeholder='e.g. q1,q2,q3,q4 or s1,s2,s3,s4 etc.'
              />
              <FormText>
                All Spaces and trailing commas will be ignored
              </FormText>
            </FormGroup>
            <FormGroup>
              <Label for='inputs'>
                Enter alphabet inputs separated by commas:
              </Label>
              <Input
                onChange={handleChange}
                type='text'
                name='inputs'
                required
                id='inputs'
                placeholder='e.g. a,b or 0,1'
              />
              <FormText>
                All Spaces and trailing commas will be ignored. Order does not
                matter.
              </FormText>
            </FormGroup>
            {stateOptions.length > 0 && (
              <FormGroup>
                <Label for='initial-state'>Select initial state:</Label>
                <Input
                  required
                  type='select'
                  name='initial-state'
                  id='initial-state'
                  onChange={handleChange}
                  value={automaton.initialState ? automaton.initialState : ''}
                >
                  <option value=''>Select...</option>
                  {stateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            )}
            {stateOptions.length > 0 && (
              <FormGroup>
                <Label for='final-states'>Select final states:</Label>
                <MultiSelect
                  required
                  id='final-states'
                  options={stateOptions}
                  value={selectedFinalStates}
                  onChange={setSelectedFinalStates}
                  labelledBy={'Select'}
                />
              </FormGroup>
            )}
            {automaton.states.length > 0 && automaton.alphabet.length > 0 && (
              <FormGroup>
                <Label>Transitions</Label>
                <FormText className='mb-2 d-block'>
                  A DFA requires exactly one next state for every state and
                  alphabet symbol.
                </FormText>
                <Table responsive bordered>
                  <thead>
                    <tr>
                      <th>States</th>
                      {automaton.alphabet.map((symbol) => (
                        <th key={symbol}>{symbol}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {automaton.states.map((state) => {
                      return (
                        <tr key={`transition-${state}`}>
                          <th scope='row'>{state}</th>
                          {automaton.alphabet.map((alphabet) => (
                            <td key={`${state}-${alphabet}`}>
                              <Input
                                required
                                bsSize='sm'
                                type='select'
                                onChange={handleChange}
                                name={`${state}-${alphabet}`}
                                value={
                                  automaton.transitions.find(
                                    (transition) =>
                                      transition.fromState === state &&
                                      transition.symbol === alphabet
                                  )?.toStates[0] || ''
                                }
                              >
                                <option value=''>State</option>
                                {stateOptions.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.value}
                                  </option>
                                ))}
                              </Input>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </FormGroup>
            )}
            <Button type='submit' style={{ backgroundColor: '#4052B6' }}>
              Minimize DFA
            </Button>
          </Form>
        </CardBody>
        <CardFooter className='d-flex flex-column flex-md-row flex-lg-row align-items-center justify-content-between'>
          <span>
            Developed by{' '}
            <a
              href='http://www.aswadali.me'
              target='_blank'
              rel='noopener noreferrer'
            >
              Aswad Ali
            </a>{' '}
            &amp;{' '}
            <a
              href='https://www.linkedin.com/in/haris-manzoor-789b77190/'
              target='_blank'
              rel='noopener noreferrer'
            >
              Haris Manzoor
            </a>
          </span>
          <span>University of South Asia</span>
        </CardFooter>
      </Card>
      {isSubmitted && (
        <ResultModal automaton={automaton} setIsSubmitted={setIsSubmitted} />
      )}
    </React.Fragment>
  );
};

export default Home;
