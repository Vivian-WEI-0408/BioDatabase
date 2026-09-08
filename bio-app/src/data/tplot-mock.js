export const dimerLbdOptions = [
  { name: 'LasR', id: 'lasr' },
  { name: 'TraR', id: 'trar' },
  { name: 'LuxR', id: 'luxr' },
];

export const dbdOptions = [
  { name: 'CI', id: 'ci' },
  { name: 'Cro', id: 'cro' },
  { name: 'LexA', id: 'lexa' },
];

export const algorithmOptions = [
  { name: 'CNN', id: 'CNN' },
  { name: 'CurveFit', id: 'CurveFit' },
];

export const i0Options = [
  { name: '1', id: '1' },
  { name: '10', id: '10' },
  { name: '100', id: '100' },
];

export const alphaOptions = [
  { name: '0.5', id: '0.5' },
  { name: '1.0', id: '1.0' },
  { name: '2.0', id: '2.0' },
];

export const betaOptions = [
  { name: '0.5', id: '0.5' },
  { name: '1.0', id: '1.0' },
  { name: '2.0', id: '2.0' },
];

export const lbdOptionalOptions = [
  { name: 'LasR', id: 'lasr' },
  { name: 'TraR', id: 'trar' },
  { name: 'None', id: 'none' },
];

export const dbdOptionalOptions = [
  { name: 'CI', id: 'ci' },
  { name: 'Cro', id: 'cro' },
  { name: 'None', id: 'none' },
];

export const defaultParams = {
  dimerLbd: null,
  dbd: null,
  l: 2.1,
  kd: 1.38,
  algorithm: null,
  i0: null,
  alpha: null,
  beta: null,
  lbdOptional: null,
  dbdOptional: null,
};

export const optimalResults = {
  dbd: 'CI',
  lbd: 'LasR',
  l: '0.3',
  rpu: '28.9',
};

export const uploadedFile = {
  name: 'dataset 1.csv',
  size: '604KB',
  time: '2m ago',
};
