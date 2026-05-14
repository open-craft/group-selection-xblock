import '@testing-library/jest-dom';

jest.mock('@openedx/paragon/icons', () => ({
  CheckCircle: () => null,
  Lock: () => null,
  Close: () => null,
}));
