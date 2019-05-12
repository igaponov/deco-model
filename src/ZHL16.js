// @flow
import type { Algorithm } from './Algorithm';
import Compartment from './ZHL16/Compartment';

type TissueValues = {
  heHalftime: number,
  n2Halftime: number,
  heCoefficient: { a: number, b: number },
  n2Coefficient: { a: number, b: number },
};

export const N2_A_A = [
  1.2599, 1.1696, 1.0000, 0.8618, 0.7562, 0.6667, 0.5933, 0.5282, 0.4701,
  0.4187, 0.3798, 0.3497, 0.3223, 0.2971, 0.2737, 0.2523, 0.2327,
];
export const N2_A_B = [
  1.2599, 1.1696, 1.0000, 0.8618, 0.7562, 0.6667, 0.5600, 0.4947, 0.4500,
  0.4187, 0.3798, 0.3497, 0.3223, 0.2850, 0.2737, 0.2523, 0.2327,
];
export const N2_A_C = [
  1.2599, 1.1696, 1.0000, 0.8618, 0.7562, 0.6200, 0.5043, 0.4410, 0.4000,
  0.3750, 0.3500, 0.3295, 0.3065, 0.2835, 0.2610, 0.2480, 0.2327,
];
export const N2_B = [
  0.5050, 0.5578, 0.6514, 0.7222, 0.7825, 0.8126, 0.8434, 0.8693, 0.8910,
  0.9092, 0.9222, 0.9319, 0.9403, 0.9477, 0.9544, 0.9602, 0.9653,
];
export const HE_A = [
  1.7424, 1.6189, 1.3830, 1.1919, 1.0458, 0.9220, 0.8205, 0.7305, 0.6502,
  0.5950, 0.5545, 0.5333, 0.5189, 0.5181, 0.5176, 0.5172, 0.5119,
];
export const HE_B = [
  0.4245, 0.4770, 0.5747, 0.6527, 0.7223, 0.7582, 0.7957, 0.8279, 0.8553,
  0.8757, 0.8903, 0.8997, 0.9073, 0.9122, 0.9171, 0.9217, 0.9267,
];
export const N2_HALF_TIME = [
  4.0, 5.0, 8.0, 12.5, 18.5, 27.0, 38.3, 54.3, 77.0, 109.0,
  146.0, 187.0, 239.0, 305.0, 390.0, 498.0, 635.0,
];
export const HE_HALF_TIME = [
  1.51, 1.88, 3.02, 4.72, 6.99, 10.21, 14.48, 20.53, 29.11,
  41.20, 55.19, 70.69, 90.34, 115.29, 147.42, 188.24, 240.03,
];

export function createTissues(n2a: Array<number>): Array<TissueValues> {
  const result = [];
  for (let i = 0; i < 17; i += 1) {
    result.push({
      heHalftime: HE_HALF_TIME[i],
      n2Halftime: N2_HALF_TIME[i],
      heCoefficient: {
        a: HE_A[i],
        b: HE_B[i],
      },
      n2Coefficient: {
        a: n2a[i],
        b: N2_B[i],
      },
    });
  }

  return result;
}

export function createZHL16ATissues(): Array<TissueValues> {
  return createTissues(N2_A_A);
}

export function createZHL16BTissues(): Array<TissueValues> {
  return createTissues(N2_A_B);
}

export function createZHL16CTissues(): Array<TissueValues> {
  return createTissues(N2_A_C);
}

export const compartmentsName = Symbol('compartments');
export const saturationName = Symbol('saturation');
export const gfName = Symbol('gf');

const WATER_VAPOUR_PRESSURE = 0.0627;
const LOG_2 = 0.6931471805599453;
const GRAVITY_ACCELERATION = 9.81;
const PA_TO_BAR = 100000;

function createCompartments(length: number, surfacePressure: number): Array<Compartment> {
  const compartments = [];
  for (let i = 0; i < length; i += 1) {
    compartments[i] = new Compartment(
      ZHL16.pressureInspired(0.7902, surfacePressure),
      0.0,
    );
  }

  return compartments;
}

export class ZHL16 implements Algorithm {
  +tissueValues: Array<TissueValues>;

  +surfacePressure: number;

  +waterCoefficient: number;

  constructor(tissueValues: Array<TissueValues>, surfacePressure: number, waterDensity: number) {
    this.tissueValues = tissueValues;
    this.surfacePressure = surfacePressure;
    this.waterCoefficient = waterDensity * GRAVITY_ACCELERATION / PA_TO_BAR;
  }

  ceilingLimit(
    prevDepth: ?number,
    nextDepth: number,
    time: number,
    n2Fraction: number,
    heFraction: number,
    attrs: Object,
  ): [number, Object] {
    if (typeof prevDepth !== 'number') {
      const compartments = createCompartments(this.tissueValues.length, this.surfacePressure);

      return [
        0,
        {
          ...attrs,
          [compartmentsName]: compartments,
          [saturationName]: 0,
        }
      ];
    }

    const compartments = this.calculateLoad(
      prevDepth,
      nextDepth,
      time,
      n2Fraction,
      heFraction,
      attrs[compartmentsName],
    );
    const gf = attrs[gfName];

    const limits = compartments.map((compartment: Compartment, index: number) => {
      const { n2Coefficient, heCoefficient } = this.tissueValues[index];
      const A = ZHL16.aFunc(n2Coefficient.a, compartment.pN2, heCoefficient.a, compartment.pHe);
      const B = ZHL16.bFunc(n2Coefficient.b, compartment.pN2, heCoefficient.b, compartment.pHe);

      if (gf) {
        return ZHL16.gfLimit(compartment.pN2 + compartment.pHe, A, B, gf);
      } else {
        return ZHL16.limit(compartment.pN2 + compartment.pHe, A, B);
      }
    }, this);

    const saturation = Math.max(...limits);

    return [
      Math.max(0, this.pressureToDepth(saturation - this.surfacePressure)),
      {
        ...attrs,
        [compartmentsName]: compartments,
        [saturationName]: saturation,
      },
    ];
  }

  calculateLoad(
    prevDepth: number,
    nextDepth: number,
    time: number,
    n2Fraction: number,
    heFraction: number,
    compartments: Array<Compartment>,
  ): Array<Compartment> {
    return compartments.map((compartment: Compartment, index: number) => {
      const { n2Halftime, heHalftime } = this.tissueValues[index];
      return new Compartment(
        this.calculateGasLoad(compartment.pN2, n2Fraction, n2Halftime, prevDepth, nextDepth, time),
        this.calculateGasLoad(compartment.pHe, heFraction, heHalftime, prevDepth, nextDepth, time),
      );
    }, this);
  }

  calculateGasLoad(
    pGas: number,
    fGas: number,
    gasHalfTime: number,
    prevDepth: number,
    nextDepth: number,
    time: number,
  ): number {
    let pAlv;
    if (fGas === 0) {
      pAlv = 0;
    } else {
      pAlv = ZHL16.pressureInspired(fGas, this.depthToPressure(prevDepth) + this.surfacePressure);
    }
    const decay = ZHL16.gasDecay(gasHalfTime);

    if (nextDepth === prevDepth) {
      return ZHL16.constDepth(pGas, pAlv, decay, time);
    }
    const rate = ZHL16.rate(fGas, this.depthToPressure(nextDepth - prevDepth) / (time / 60));
    return ZHL16.schreiner(pAlv, rate, time, decay, pGas);
  }

  /**
   * p = ρ * g * h
   * where
   * p = pressure in liquid, Pa
   * ρ = density of liquid, kg/m3
   * g = acceleration of gravity, 9.81 m/s2
   * h = height of fluid column - or depth in the fluid where pressure is measured, m
   *
   * @param pressure
   * @returns {number}
   */
  pressureToDepth(pressure: number): number {
    return pressure / this.waterCoefficient;
  }

  depthToPressure(depth: number): number {
    return depth * this.waterCoefficient;
  }

  /**
   * @param {number} pAlv Pressure of inspired inert gas
   * @param {number} rate Rate of change of inert gas pressure
   * @param {number} time Time of exposure in minutes.
   * @param {number} k Gas decay constant for a tissue compartment
   * @param {number} Pi Initial inert gas pressure in a tissue compartment.
   * @return {number}
   * */
  static schreiner(pAlv: number, rate: number, time: number, k: number, Pi: number): number {
    return pAlv + rate * (time / 60 - 1 / k) - (pAlv - Pi - rate / k) * Math.exp(-k * time / 60);
  }

  /**
   *
   * @param {number} Pi
   * @param {number} pAlv
   * @param {number} k
   * @param {number} time
   * @returns {number}
   */
  static constDepth(Pi: number, pAlv: number, k: number, time: number): number {
    return Pi + (pAlv - Pi) * (1 - Math.exp(-k * time / 60));
  }

  /**
   * Palv - Pressure of inspired inert gas
   * @param {number} fGas Inert gas fraction, i.e. 0.79 for air
   * @param {number} pAbs Absolute pressure of current depth [bar]
   * @returns {number}
   */
  static pressureInspired(fGas: number, pAbs: number): number {
    return fGas * (pAbs - WATER_VAPOUR_PRESSURE);
  }

  /**
   * k - Gas decay constant for a tissue compartment
   * @param Thl Inert gas half-life time for tissue compartment
   * @returns {number}
   */
  static gasDecay(Thl: number): number {
    return LOG_2 / Thl;
  }

  /**
   * R - Rate of change of inert gas pressure
   * @param {number} fGas Inert gas fraction, i.e. 0.79 for air
   * @param {number} Prate Pressure rate change [bar/min] (for example, about 1 bar/min is 10m/min)
   * @returns {number}
   */
  static rate(fGas: number, Prate: number): number {
    return fGas * Prate;
  }

  /**
   * Calculate limit pressure
   * @param {number} P
   * @param {number} A
   * @param {number} B
   * @param {number} gf
   * @return {number}
   */
  static gfLimit(P: number, A: number, B: number, gf: number): number {
    return (P - A * gf) / (gf / B + 1.0 - gf);
  }

  /**
   * Calculate limit without GF
   * @param pComp
   * @param a
   * @param b
   * @return {number}
   */
  static limit(pComp: number, a: number, b: number) {
    return (pComp - a) * b;
  }

  /**
   * Calculate A
   * @param {number} An2
   * @param {number} Pn2
   * @param {number} Ahe
   * @param {number} Phe
   * @return {number}
   */
  static aFunc(An2: number, Pn2: number, Ahe: number, Phe: number = 0) {
    const P = Pn2 + Phe;
    return (An2 * Pn2 + Ahe * Phe) / P;
  }

  /**
   * Calculate B
   * @param {number} Bn2
   * @param {number} Pn2
   * @param {number} Bhe
   * @param {number} Phe
   * @return {number}
   */
  static bFunc(Bn2: number, Pn2: number, Bhe: number, Phe: number = 0) {
    const P = Pn2 + Phe;
    return (Bn2 * Pn2 + Bhe * Phe) / P;
  }
}

export default ZHL16;
