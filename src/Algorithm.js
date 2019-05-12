// @flow

export interface Algorithm {
  ceilingLimit(
    prevDepth: ?number,
    nextDepth: number,
    time: number,
    n2Fraction: number,
    heFraction: number,
    attrs: Object,
  ): [number, Object];
}
