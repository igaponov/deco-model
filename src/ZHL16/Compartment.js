// @flow

export default class Compartment {
  pN2: number;

  pHe: number;

  constructor(pN2: number = 0.0, pHe: number = 0.0) {
    this.pN2 = pN2;
    this.pHe = pHe;
  }
};
