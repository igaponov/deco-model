import { Algorithm } from './Algorithm';
import Compartment from './ZHL16/Compartment';
import { Utils } from "./Utils";

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

export function createTissues(n2a: number[]): TissueValues[] {
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

export function createZHL16ATissues(): TissueValues[] {
  return createTissues(N2_A_A);
}

export function createZHL16BTissues(): TissueValues[] {
  return createTissues(N2_A_B);
}

export function createZHL16CTissues(): TissueValues[] {
  return createTissues(N2_A_C);
}

function createCompartments(length: number, surfacePressure: number): Array<Compartment> {
  const compartments = [];
  for (let i = 0; i < length; i += 1) {
    compartments[i] = new Compartment(
      Utils.pressureInspired(0.7902, surfacePressure),
      0.0,
    );
  }

  return compartments;
}

export class ZHL16 implements Algorithm {
  public static compartmentsName = 'compartments';
  public static saturationName = 'saturation';
  public static gfName = 'gf';

  private static LOG_2 = 0.6931471805599453;

  constructor(
      private readonly tissueValues: TissueValues[],
      private readonly surfacePressure: number,
      private readonly utils: Utils
  ) {}

  ceilingLimit(
    prevDepth: number | null,
    nextDepth: number,
    time: number,
    n2Fraction: number,
    heFraction: number,
    attrs: { [property: string]: any},
  ): [number, { [property: string ]: any }] {
    if (typeof prevDepth !== 'number') {
      const compartments = createCompartments(this.tissueValues.length, this.surfacePressure);

      return [
        0,
        {
          ...attrs,
          [ZHL16.compartmentsName]: compartments,
          [ZHL16.saturationName]: 0,
        }
      ];
    }

    const compartments = this.calculateLoad(
      prevDepth,
      nextDepth,
      time,
      n2Fraction,
      heFraction,
      attrs[ZHL16.compartmentsName],
    );
    const gf = attrs[ZHL16.gfName];

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
      Math.max(0, this.utils.pressureToDepth(saturation - this.surfacePressure)),
      {
        ...attrs,
        [ZHL16.compartmentsName]: compartments,
        [ZHL16.saturationName]: saturation,
      },
    ];
  }

  calculateLoad(
    prevDepth: number,
    nextDepth: number,
    time: number,
    n2Fraction: number,
    heFraction: number,
    compartments: Compartment[],
  ): Compartment[] {
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
      pAlv = Utils.pressureInspired(fGas, this.utils.depthToPressure(prevDepth) + this.surfacePressure);
    }
    const decay = ZHL16.gasDecay(gasHalfTime);

    if (nextDepth === prevDepth) {
      return Utils.haldaneEquation(pGas, pAlv, decay, time);
    }
    const rate = Utils.gasRate(fGas, this.utils.depthToPressure(nextDepth - prevDepth) / (time / 60));
    return Utils.schreinerEquation(pAlv, rate, time, decay, pGas);
  }

  /**
   * k - Gas decay constant for a tissue compartment
   * @param Thl Inert gas half-life time for tissue compartment
   * @returns {number}
   */
  static gasDecay(Thl: number): number {
    return ZHL16.LOG_2 / Thl;
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
