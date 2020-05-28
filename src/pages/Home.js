import React, { useState } from 'react';
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

  const setAcceptingStates = () => {
    let acceptingStates = [];
    selectedFinalStates.forEach((selectedState) => {
      acceptingStates.push(selectedState.value);
    });
    setAutomaton({ ...automaton, acceptingStates });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAcceptingStates();
    setIsSubmitted(true);
    console.log(automaton);
  };

  const handleChange = (e) => {
    let value;
    if (e.target.name === 'states') {
      value = e.target.value.replace(/(^\s*,)|(,\s*$)/g, '');
      if (value === '') {
        setStateOptions([]);
        return;
      }
      let states = value.split(',');
      setAutomaton({
        ...automaton,
        states,
        initialState: null,
        acceptingStates: [],
      });
      let options = [];
      states.forEach((state) => {
        options.push({
          label: state,
          value: state,
        });
      });
      setStateOptions(options);
    } else if (e.target.name === 'initial-state') {
      value = e.target.value;
      setAutomaton({ ...automaton, initialState: value });
    } else if (e.target.name === 'inputs') {
      value = e.target.value.replace(/(^\s*,)|(,\s*$)/g, '');
      let alphabet = value.split(',');
      setAutomaton({ ...automaton, alphabet, transitions: [] });
    } else {
      let splitName = e.target.name.split('-');
      let fromState = splitName[0];
      let toStates = [e.target.value];
      let symbol = splitName[splitName.length - 1];
      let transitions = automaton.transitions;
      let alreadyExists = false;
      transitions.forEach((transition) => {
        if (
          transition.symbol === symbol &&
          transition.fromState === fromState
        ) {
          transition.toStates = toStates;
          alreadyExists = true;
          return;
        }
      });
      if (alreadyExists === false) {
        transitions.push({ fromState, toStates, symbol });
      }
      setAutomaton({ ...automaton, transitions });
    }
  };

  return (
    <React.Fragment>
      <Card>
        <CardHeader>Input Automaton</CardHeader>
        <CardBody>
          <CardTitle>
            Use the form below to input data for your automaton
          </CardTitle>
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
                All Spaces and trailing commas will be ignored
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
                        <tr key={`transition-${state}}`}>
                          <th scope='row'>{state}</th>
                          {automaton.alphabet.map((alphabet) => (
                            <td key={`${state}-${alphabet}`}>
                              <Input
                                required
                                bsSize='sm'
                                type='select'
                                onChange={handleChange}
                                name={`${state}-${alphabet}`}
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
        <CardFooter className='d-flex align-items-center justify-content-between'>
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
